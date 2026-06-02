import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LayoutDashboard, CheckCircle, HelpCircle, Users, Link as LinkIcon, FileText, RefreshCw, Sun, Moon, LogOut, Menu, X, Activity, AlertCircle, ArrowLeft, Search, Maximize2 } from 'lucide-react';

const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbzZkgTYLPD6hZJTa8et6DjumjKbyxS5mr92Mm5SzQC82l9Qyrq1x6s0GbvPs7B7_6yCeQ/exec";

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // --- APP STATE ---
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [data, setData] = useState({ users: [], success: [], unknown: [] });
  const [exams, setExams] = useState([]);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [examSearch, setExamSearch] = useState('');
  
  // New Filters
  const [userSearch, setUserSearch] = useState('');
  const [userVersionFilter, setUserVersionFilter] = useState('All');
  const [examTermFilter, setExamTermFilter] = useState('All');
  const [examYearFilter, setExamYearFilter] = useState('All');

  // Modals & Drilldown
  const [selectedUser, setSelectedUser] = useState(null);
  const [botResponseModal, setBotResponseModal] = useState(null);

  // --- 1. INITIALIZATION & AUTH ---
  useEffect(() => {
    const authExpiry = localStorage.getItem('uog_auth_expiry');
    if (authExpiry && Date.now() < parseInt(authExpiry)) {
      setIsAuthenticated(true);
      fetchDashboardData();
      fetchExamsData();
    }
    
    const isDark = localStorage.getItem('uog_theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'myuog') {
      const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000); 
      localStorage.setItem('uog_auth_expiry', expiry.toString());
      setIsAuthenticated(true);
      fetchDashboardData();
      fetchExamsData();
    } else {
      alert("Invalid Credentials");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('uog_auth_expiry');
    setIsAuthenticated(false);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('uog_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('uog_theme', 'light');
    }
  };

  // --- 2. DATA FETCHING ---
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL);
      const result = await response.json();
      setData({
        users: result.users || [],
        success: result.successLogs || [],
        unknown: result.unknownLogs || []
      });
    } catch (error) {
      console.error("Failed to fetch sheet data", error);
    }
    setLoading(false);
  };

  const fetchExamsData = async () => {
    try {
      const localVersion = parseFloat(localStorage.getItem("EXAM_ADMIN_VERSION") || "0");
      const versionRes = await fetch("https://uog-exams.vercel.app/exam_version.json");
      const cloudVersionData = await versionRes.json();

      if (cloudVersionData.version > localVersion) {
        const dataRes = await fetch("https://uog-exams.vercel.app/exams.json");
        const cloudExams = await dataRes.json();
        setExams(cloudExams);
        localStorage.setItem("EXAM_ADMIN_DATA", JSON.stringify(cloudExams));
        localStorage.setItem("EXAM_ADMIN_VERSION", cloudVersionData.version.toString());
      } else {
        const localExams = JSON.parse(localStorage.getItem("EXAM_ADMIN_DATA") || "[]");
        setExams(localExams);
      }
    } catch (e) {
      const localExams = JSON.parse(localStorage.getItem("EXAM_ADMIN_DATA") || "[]");
      setExams(localExams);
    }
  };

  // --- 3. DATA COMPUTATIONS ---
  const { success, unknown, users } = data;
  
  const pieData = useMemo(() => {
    const counts = success.reduce((acc, log) => {
      const status = log.Validation || 'Review';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const colors = { 'Correct': '#10B981', 'Wrong': '#EF4444', 'Review': '#F59E0B', 'Later': '#3B82F6', 'not found': '#8B5CF6' };
    return Object.keys(counts).map(key => ({ name: key, value: counts[key], color: colors[key] || '#6B7280' }));
  }, [success]);

  const deviceData = useMemo(() => {
    const counts = users.reduce((acc, user) => {
      const device = user['Device Model'] || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts)
      .map(key => ({ name: key, count: counts[key] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); 
  }, [users]);

  const commonUsers = useMemo(() => {
    const successIds = new Set(success.map(l => String(l['Hardware ID']).trim()));
    const unknownIds = new Set(unknown.map(l => String(l['Hardware ID']).trim()));
    return users.filter(u => {
      const id = String(u['Hardware ID']).trim();
      return successIds.has(id) && unknownIds.has(id);
    });
  }, [success, unknown, users]);

  // Unique Filters Extraction
  const uniqueAppVersions = useMemo(() => [...new Set(users.map(u => String(u['App Version'] || '')).filter(v => v !== ''))].sort(), [users]);
  const uniqueExamYears = useMemo(() => {
    const years = exams.map(e => {
      const match = e.title.match(/20\d{2}/);
      return match ? match[0] : null;
    }).filter(Boolean);
    return [...new Set(years)].sort().reverse();
  }, [exams]);

  const getBadgeClass = (status) => {
    switch(status) {
      case 'Correct': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
      case 'Wrong': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
      case 'Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800';
      case 'Later': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800';
      case 'not found': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  }


  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-96 mx-4">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Admin Login</h2>
          <input 
            type="text" placeholder="Username" required
            className="w-full mb-4 p-3 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setLoginForm({...loginForm, username: e.target.value})}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full mb-6 p-3 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setLoginForm({...loginForm, password: e.target.value})}
          />
          <button className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition">Login</button>
        </form>
      </div>
    );
  }

  // --- DASHBOARD RENDER ---
  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* BOT RESPONSE MODAL */}
      {botResponseModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 transition-opacity" onClick={() => setBotResponseModal(null)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-3">
              <h2 className="text-lg font-bold flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-500"/> Bot Full Response</h2>
              <button onClick={() => setBotResponseModal(null)} className="text-gray-500 hover:text-red-500 transition-colors"><X/></button>
            </div>
            <div className="overflow-y-auto flex-1 pr-2">
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">{botResponseModal}</p>
            </div>
            <button onClick={() => setBotResponseModal(null)} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Close</button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl flex flex-col transition-transform duration-300`}>
        <div className="p-6 text-2xl font-black text-blue-600 border-b dark:border-gray-700 flex justify-between items-center">
          MyUOG Admin
          <button className="md:hidden text-gray-500" onClick={() => setSidebarOpen(false)}><X/></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarBtn icon={LayoutDashboard} label="Overview" active={activeTab==='overview'} onClick={() => {setActiveTab('overview'); setSidebarOpen(false); setSelectedUser(null);}} />
          <SidebarBtn icon={CheckCircle} label="Success Logs" count={success.length} color="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400" active={activeTab==='success'} onClick={() => {setActiveTab('success'); setSidebarOpen(false); setSelectedUser(null);}} />
          <SidebarBtn icon={HelpCircle} label="Unknown Logs" count={unknown.length} color="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" active={activeTab==='unknown'} onClick={() => {setActiveTab('unknown'); setSidebarOpen(false); setSelectedUser(null);}} />
          <SidebarBtn icon={Users} label="User Profiles" count={users.length} color="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400" active={activeTab==='users'} onClick={() => {setActiveTab('users'); setSidebarOpen(false); setSelectedUser(null);}} />
          <SidebarBtn icon={LinkIcon} label="Common Users" count={commonUsers.length} active={activeTab==='common'} onClick={() => {setActiveTab('common'); setSidebarOpen(false); setSelectedUser(null);}} />
          <SidebarBtn icon={FileText} label="Exams Cache" count={exams.length} active={activeTab==='exams'} onClick={() => {setActiveTab('exams'); setSidebarOpen(false); setSelectedUser(null);}} />
        </nav>

        <div className="p-4 border-t dark:border-gray-700 space-y-2">
          <button onClick={toggleTheme} className="flex items-center w-full p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            {darkMode ? <Sun className="w-5 h-5 mr-3"/> : <Moon className="w-5 h-5 mr-3"/>}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleLogout} className="flex items-center w-full p-3 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
            <LogOut className="w-5 h-5 mr-3"/> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="h-16 bg-white dark:bg-gray-800 shadow flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-gray-600 dark:text-gray-300" onClick={() => setSidebarOpen(true)}>
              <Menu />
            </button>
            <h1 className="text-xl font-bold capitalize truncate">
              {selectedUser ? `Profile: ${selectedUser.Name}` : activeTab.replace('-', ' ')}
            </h1>
          </div>
          <button onClick={fetchDashboardData} disabled={loading} className="flex items-center bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base whitespace-nowrap">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading && 'animate-spin'}`} />
            Refresh
          </button>
        </header>

        {/* SCROLLABLE VIEW */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
          
          {/* VIEW: OVERVIEW */}
          {activeTab === 'overview' && !selectedUser && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Activity} title="Total Interactions" value={success.length + unknown.length} color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-100 dark:bg-blue-900/30" />
                <StatCard icon={Users} title="Total Users" value={users.length} color="text-indigo-600 dark:text-indigo-400" bgColor="bg-indigo-100 dark:bg-indigo-900/30" />
                <StatCard icon={CheckCircle} title="Success Logs" value={success.length} color="text-teal-600 dark:text-teal-400" bgColor="bg-teal-100 dark:bg-teal-900/30" />
                <StatCard icon={AlertCircle} title="Unknown Logs" value={unknown.length} color="text-red-600 dark:text-red-400" bgColor="bg-red-100 dark:bg-red-900/30" />
              </div>
              
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow h-96 flex flex-col">
                  <h3 className="text-lg font-bold mb-2">Success Logs Status</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: darkMode ? '#374151' : '#fff', borderRadius: '8px', border: 'none', color: darkMode ? '#fff' : '#000'}}/>
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow h-96 flex flex-col">
                  <h3 className="text-lg font-bold mb-2">Top Devices</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deviceData} layout="vertical" margin={{ left: 50, right: 30, top: 20, bottom: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: darkMode ? '#9CA3AF' : '#4B5563'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: darkMode ? '#374151' : '#fff', borderRadius: '8px', border: 'none', color: darkMode ? '#fff' : '#000'}}/>
                        <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: darkMode ? '#9CA3AF' : '#4B5563', fontSize: 12, fontWeight: 'bold' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SUCCESS LOGS */}
          {activeTab === 'success' && !selectedUser && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden flex flex-col">
              <div className="p-4 md:p-6 border-b dark:border-gray-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex flex-wrap gap-2">
                  <select onChange={e => setStatusFilter(e.target.value)} className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="All">All Statuses</option>
                    <option value="Review">Review</option>
                    <option value="Correct">Correct</option>
                    <option value="Wrong">Wrong</option>
                    <option value="Later">Later</option>
                    <option value="not found">Not Found</option>
                  </select>
                </div>
                <div className="relative w-full lg:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input type="text" placeholder="Search questions..." onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">User</th>
                      <th className="p-4 font-semibold">Device (Ver)</th>
                      <th className="p-4 font-semibold">Question</th>
                      <th className="p-4 font-semibold w-1/4">Bot Response</th>
                      <th className="p-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {success
                      .filter(log => statusFilter === 'All' || log.Validation === statusFilter)
                      .filter(log => String(log.Question || '').toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((log, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{String(log.Timestamp || '')?.replace("'","")}</td>
                        <td className="p-4 font-bold text-sm whitespace-nowrap">{log.Name}</td>
                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{log['Device Model']} <br/><span className="text-blue-500">v{log['App Version']}</span></td>
                        <td className="p-4 text-sm font-medium">{log.Question}</td>
                        <td className="p-4 text-xs text-gray-500">
                          <button 
                            onClick={() => setBotResponseModal(log['Bot Response'])}
                            className="flex items-center text-left hover:text-blue-600 dark:hover:text-blue-400 group max-w-xs transition-colors"
                          >
                            <span className="truncate flex-1" title="Click to view full response">{log['Bot Response']}</span>
                            <Maximize2 className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"/>
                          </button>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeClass(log.Validation)}`}>
                            {log.Validation || 'Review'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: UNKNOWN LOGS */}
          {activeTab === 'unknown' && !selectedUser && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden flex flex-col">
               <div className="p-4 md:p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="relative w-full lg:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input type="text" placeholder="Search unknown questions..." onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                  </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-xs">
                    <tr><th className="p-4">Date</th><th className="p-4">User</th><th className="p-4">Device (Ver)</th><th className="p-4">Unanswered Question</th></tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {unknown
                      .filter(log => String(log.Question || '').toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((log, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{String(log.Timestamp || '')?.replace("'","")}</td>
                        <td className="p-4 font-bold text-sm whitespace-nowrap">{log.Name}</td>
                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{log['Device Model']} <br/><span className="text-blue-500">v{log['App Version']}</span></td>
                        <td className="p-4 text-red-500 dark:text-red-400 font-medium text-sm">{log.Question}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: USERS & COMMON USERS */}
          {(activeTab === 'users' || activeTab === 'common') && !selectedUser && (
            <div className="flex flex-col space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex flex-col md:flex-row gap-4 items-center justify-between">
                 <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input type="text" placeholder="Search by name or device..." onChange={e => setUserSearch(e.target.value)} className="w-full pl-9 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                 </div>
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">App Version:</span>
                    <select onChange={e => setUserVersionFilter(e.target.value)} className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none flex-1 md:flex-none">
                      <option value="All">All Versions</option>
                      {uniqueAppVersions.map(v => <option key={v} value={v}>v{v}</option>)}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(activeTab === 'users' ? users : commonUsers)
                  .filter(u => userVersionFilter === 'All' || String(u['App Version']) === userVersionFilter)
                  .filter(u => String(u.Name || '').toLowerCase().includes(userSearch.toLowerCase()) || String(u['Device Model'] || '').toLowerCase().includes(userSearch.toLowerCase()))
                  .map((user, i) => {
                  const uSuccess = success.filter(s => s['Hardware ID'] === user['Hardware ID']);
                  const uUnknown = unknown.filter(u => u['Hardware ID'] === user['Hardware ID']);
                  return (
                    <button 
                      key={i} 
                      onClick={() => setSelectedUser(user)}
                      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center border border-transparent hover:border-blue-500 text-left"
                    >
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shrink-0">
                        {user.Name?.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{user.Name}</h3>
                      <p className="text-xs text-gray-500 mb-4">{user['Device Model']} • {user.Platform} <br/><span className="text-blue-500 font-semibold">v{user['App Version']}</span></p>
                      
                      <div className="w-full grid grid-cols-2 gap-2 mt-auto border-t dark:border-gray-700 pt-4">
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-2 rounded-lg">
                          <p className="text-xs text-teal-600 font-bold uppercase">Success</p>
                          <p className="font-black text-teal-700 dark:text-teal-400">{uSuccess.length}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                          <p className="text-xs text-red-600 font-bold uppercase">Unknown</p>
                          <p className="font-black text-red-700 dark:text-red-400">{uUnknown.length}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* DETAILED USER DRILLDOWN VIEW */}
          {selectedUser && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden flex flex-col">
              <div className="p-4 md:p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center">
                <button onClick={() => setSelectedUser(null)} className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold">
                  <ArrowLeft className="w-5 h-5 mr-2"/> Back to Users
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-gray-100 dark:bg-gray-900/80 text-gray-500 uppercase text-xs">
                    <tr><th className="p-4">Type</th><th className="p-4">Date</th><th className="p-4">Question</th><th className="p-4">Status / Response</th></tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {[
                      ...success.filter(s => s['Hardware ID'] === selectedUser['Hardware ID']).map(l => ({...l, type: 'Success'})),
                      ...unknown.filter(u => u['Hardware ID'] === selectedUser['Hardware ID']).map(l => ({...l, type: 'Unknown'}))
                    ].sort((a,b) => new Date(String(b.Timestamp || '').replace("'","")) - new Date(String(a.Timestamp || '').replace("'","")))
                    .map((log, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                         <td className="p-4">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${log.type === 'Success' ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'}`}>
                             {log.type}
                           </span>
                         </td>
                         <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{String(log.Timestamp || '')?.replace("'","")}</td>
                         <td className="p-4 text-sm font-medium">{log.Question}</td>
                         <td className="p-4">
                           {log.type === 'Success' ? (
                              <div className="flex flex-col items-start gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getBadgeClass(log.Validation)}`}>
                                  {log.Validation || 'Review'}
                                </span>
                                <button 
                                  onClick={() => setBotResponseModal(log['Bot Response'])}
                                  className="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 group max-w-xs text-left transition-colors flex items-center"
                                >
                                  <span className="truncate" title="Click to view full response">{log['Bot Response']}</span>
                                  <Maximize2 className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"/>
                                </button>
                              </div>
                           ) : (
                              <span className="text-xs text-red-500 font-bold italic">No Response</span>
                           )}
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

           {/* VIEW: EXAMS */}
           {activeTab === 'exams' && !selectedUser && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 md:p-6 flex flex-col">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b dark:border-gray-700 pb-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText className="text-blue-500"/> Local Exam Cache ({exams.length} Papers)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Fetched automatically from GitHub JSON</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                  <select onChange={e => setExamTermFilter(e.target.value)} className="w-full md:w-auto p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="All">All Terms</option>
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                  </select>
                  
                  <select onChange={e => setExamYearFilter(e.target.value)} className="w-full md:w-auto p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="All">All Years</option>
                    {uniqueExamYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>

                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input type="text" placeholder="Search course code (e.g. CS103)" onChange={e => setExamSearch(e.target.value)} className="w-full pl-9 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 px-3 py-2 rounded-lg font-bold whitespace-nowrap border border-blue-200 dark:border-blue-800">
                    v {localStorage.getItem("EXAM_ADMIN_VERSION") || "0"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {exams
                  .filter(e => examTermFilter === 'All' || String(e.title || '').toLowerCase().includes(examTermFilter.toLowerCase()))
                  .filter(e => examYearFilter === 'All' || String(e.title || '').includes(examYearFilter))
                  .filter(e => String(e.title || '').toLowerCase().includes(examSearch.toLowerCase()))
                  .map((exam, i) => (
                  <div key={i} className="p-4 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 hover:border-blue-500 transition-colors">
                    <p className="font-bold text-sm mb-2 text-gray-900 dark:text-white" title={exam.title}>{exam.title}</p>
                    <div className="flex justify-between items-center mt-4">
                       <p className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                         {exam.urls?.length || 0} Pages
                       </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// UI COMPONENTS
function SidebarBtn({ icon: Icon, label, count, color, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${active ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
      <div className="flex items-center"><Icon className="w-5 h-5 mr-3" /> {label}</div>
      {count !== undefined && <span className={`text-xs px-2 py-1 rounded-full font-bold ${color || 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>{count}</span>}
    </button>
  )
}

function StatCard({ icon: Icon, title, value, color, bgColor }) {
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow flex items-center gap-4 border-t-4 ${color.split(' ')[0].replace('text', 'border')} dark:${color.split(' ')[1].replace('text', 'border')}`}>
      <div className={`p-4 rounded-full ${bgColor} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <p className={`text-3xl font-black text-gray-900 dark:text-white`}>{value}</p>
      </div>
    </div>
  )
}