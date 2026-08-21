import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Search,
  RefreshCw,
  Users,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  FileText,
  Link as LinkIcon,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

const GOOGLE_SHEET_API_URL =
  "https://script.google.com/macros/s/AKfycbzZkgTYLPD6hZJTa8et6DjumjKbyxS5mr92Mm5SzQC82l9Qyrq1x6s0GbvPs7B7_6yCeQ/exec";

const EXAM_VERSION_URL = "https://uog-exams.vercel.app/exam_version.json";
const EXAMS_DATA_URL = "https://uog-exams.vercel.app/exams.json";

const AUTH_EXPIRY_KEY = "uog_auth_expiry";
const AUTH_ROLE_KEY = "uog_auth_role";
const AUTH_NAME_KEY = "uog_auth_name";
const THEME_KEY = "uog_theme";
const EXAM_VERSION_KEY = "EXAM_ADMIN_VERSION";
const EXAM_DATA_KEY = "EXAM_ADMIN_DATA";

const STATUSES = [
  "Review",
  "Correct",
  "Wrong",
  "Later",
  "Fixed Later",
  "Not Found",
];
const ROLE_TABS = {
  admin: [
    "overview",
    "notfound",
    "success",
    "users",
    "unknown",
    "common",
    "exams",
    "passwords",
  ],
  collaborator: ["overview", "notfound", "exams"],
};

const SIDEBAR_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "notfound", label: "Exam Not Found", icon: AlertTriangle },
  { key: "success", label: "Success Logs", icon: CheckCircle },
  { key: "users", label: "Users", icon: Users },
  { key: "unknown", label: "Unknown Logs", icon: HelpCircle },
  { key: "common", label: "Common Users", icon: LinkIcon },
  { key: "exams", label: "Exams", icon: FileText },
  { key: "passwords", label: "Passwords", icon: KeyRound },
];

const monthMap = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const safeString = (value) => String(value ?? "").trim();
const cx = (...classes) => classes.filter(Boolean).join(" ");

const cleanTime = (value) => safeString(value).replace(/^'/, "");
const getHardwareId = (row) => safeString(row?.["Hardware ID"]);
const getName = (row) => safeString(row?.Name) || "Student";
const getVersion = (row) => safeString(row?.["App Version"]) || "Unknown";
const getQuestion = (row) => safeString(row?.Question);
const getResponse = (row) => safeString(row?.["Bot Response"]);

const parseTimestamp = (value) => {
  const text = cleanTime(value).toLowerCase();
  const match = text.match(
    /(\d{1,2})\/([a-z]{3})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)/i,
  );
  if (!match) return 0;

  const day = Number(match[1]);
  const month = monthMap[match[2]] ?? 0;
  const year = Number(match[3]);
  let hour = Number(match[4]);
  const minute = Number(match[5]);
  const ampm = match[6];

  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;

  return new Date(year, month, day, hour, minute).getTime();
};

const sortLatestFirst = (rows) =>
  [...rows].sort(
    (a, b) => parseTimestamp(b.Timestamp) - parseTimestamp(a.Timestamp),
  );

const isExamNotFoundResponse = (botResponse = "") => {
  const response = safeString(botResponse).toLowerCase();
  return (
    response.includes("i didn't find any exams matching") ||
    response.includes("developer can add it") ||
    response.includes("saved it for review") ||
    response.includes("add it soon")
  );
};

const normalizeStatus = (value, botResponse = "", fallback = "Review") => {
  const raw = safeString(value).toLowerCase();

  if (raw === "fixed later" || raw === "fix-later" || raw === "fixed-later")
    return "Fixed Later";
  if (raw === "not found" || raw === "not-found" || raw === "exam not found")
    return "Not Found";
  if (raw === "correct" || raw === "success") return "Correct";
  if (raw === "wrong" || raw === "issue") return "Wrong";
  if (raw === "later") return "Later";
  if (raw === "review") return "Review";

  if (isExamNotFoundResponse(botResponse)) return "Not Found";
  return fallback;
};

const includesSearch = (row, search) => {
  const s = safeString(search).toLowerCase();
  if (!s) return true;
  return Object.values(row || {})
    .map((v) => safeString(v).toLowerCase())
    .join(" ")
    .includes(s);
};

const initials = (name) => {
  const n = safeString(name);
  if (!n) return "S";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const dayLabel = (timestamp) => {
  if (!timestamp) return "Unknown";
  const d = new Date(timestamp);
  return `${String(d.getDate()).padStart(2, "0")}/${d.toLocaleString("en", { month: "short" })}`;
};

const statusPillClass = (status) => {
  switch (status) {
    case "Correct":
      return "status-correct";
    case "Wrong":
      return "status-wrong";
    case "Later":
      return "status-later";
    case "Fixed Later":
      return "status-fixed";
    case "Not Found":
      return "status-notfound";
    case "Unknown":
      return "status-unknown";
    default:
      return "status-review";
  }
};
const statusSelectClass = (status) =>
  cx("status-select", statusPillClass(status));

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("admin");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({ users: [], success: [], unknown: [] });
  const [exams, setExams] = useState([]);
  const [examVersion, setExamVersion] = useState(
    localStorage.getItem(EXAM_VERSION_KEY) || "0",
  );

  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [versionFilter, setVersionFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [paperModal, setPaperModal] = useState(null);

  const [examSearch, setExamSearch] = useState("");
  const [examDept, setExamDept] = useState("All");
  const [examSubject, setExamSubject] = useState("All");
  const [examTerm, setExamTerm] = useState("All");
  const [examType, setExamType] = useState("All");
  const [examYear, setExamYear] = useState("All");

  const allowedTabs = ROLE_TABS[role] || ROLE_TABS.admin;

  useEffect(() => {
    const expiry = parseInt(localStorage.getItem(AUTH_EXPIRY_KEY) || "0", 10);
    const savedRole = localStorage.getItem(AUTH_ROLE_KEY) || "admin";
    const isDark = localStorage.getItem(THEME_KEY) === "dark";

    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    if (expiry && Date.now() < expiry) {
      setRole(savedRole);
      setIsAuthenticated(true);
      setActiveTab((ROLE_TABS[savedRole] || ROLE_TABS.admin)[0]);
      refreshAll();
    }
  }, []);

  const refreshAll = async () => {
    await Promise.all([fetchDashboardData(), fetchExamsData(false)]);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const username = loginForm.username.trim().toLowerCase();
    const password = loginForm.password;

    let nextRole = null;
    let displayName = "Admin";

    if (username === "admin" && password === "myuog") {
      nextRole = "admin";
      displayName = "Main Admin";
    }

    if (
      (username === "collaborator" || username === "contributor") &&
      password === "myuog-exams"
    ) {
      nextRole = "collaborator";
      displayName = "Collaborator";
    }

    if (!nextRole) {
      setLoginError("Invalid username or password");
      return;
    }

    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(AUTH_EXPIRY_KEY, String(expiry));
    localStorage.setItem(AUTH_ROLE_KEY, nextRole);
    localStorage.setItem(AUTH_NAME_KEY, displayName);
    setRole(nextRole);
    setIsAuthenticated(true);
    setActiveTab((ROLE_TABS[nextRole] || ROLE_TABS.admin)[0]);
    setLoginError("");
    refreshAll();
  };

  const logout = () => {
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    localStorage.removeItem(AUTH_ROLE_KEY);
    localStorage.removeItem(AUTH_NAME_KEY);
    setIsAuthenticated(false);
    setLoginForm({ username: "", password: "" });
  };

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${GOOGLE_SHEET_API_URL}?t=${Date.now()}`);
      const result = await response.json();
      setData({
        users: Array.isArray(result.users) ? result.users : [],
        success: Array.isArray(result.successLogs) ? result.successLogs : [],
        unknown: Array.isArray(result.unknownLogs) ? result.unknownLogs : [],
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      alert(
        "Failed to fetch Google Sheet data. Check Apps Script deployment/access.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchExamsData = async (force = false) => {
    try {
      const localVersion = parseFloat(
        localStorage.getItem(EXAM_VERSION_KEY) || "0",
      );
      const versionResponse = await fetch(
        `${EXAM_VERSION_URL}?t=${Date.now()}`,
      );
      const versionData = await versionResponse.json();
      const cloudVersion = parseFloat(versionData.version || "0");

      if (force || cloudVersion > localVersion) {
        const dataResponse = await fetch(`${EXAMS_DATA_URL}?t=${Date.now()}`);
        const cloudExams = await dataResponse.json();
        if (Array.isArray(cloudExams)) {
          setExams(cloudExams);
          setExamVersion(String(cloudVersion));
          localStorage.setItem(EXAM_DATA_KEY, JSON.stringify(cloudExams));
          localStorage.setItem(EXAM_VERSION_KEY, String(cloudVersion));
        }
      } else {
        const cached = JSON.parse(localStorage.getItem(EXAM_DATA_KEY) || "[]");
        setExams(Array.isArray(cached) ? cached : []);
        setExamVersion(String(localVersion));
      }
    } catch (error) {
      console.error("Failed to fetch exams", error);
      const cached = JSON.parse(localStorage.getItem(EXAM_DATA_KEY) || "[]");
      setExams(Array.isArray(cached) ? cached : []);
    }
  };

  const successLogs = useMemo(
    () =>
      sortLatestFirst(
        data.success.map((log) => ({
          ...log,
          _kind: "success",
          _status: normalizeStatus(
            log.Validation,
            log["Bot Response"],
            "Review",
          ),
          ISSUE: safeString(log.ISSUE),
        })),
      ),
    [data.success],
  );

  const unknownLogs = useMemo(
    () =>
      sortLatestFirst(
        data.unknown.map((log) => ({
          ...log,
          _kind: "unknown",
          _status: normalizeStatus(log.Validation, "", "Unknown"),
          ISSUE: safeString(log.ISSUE),
        })),
      ),
    [data.unknown],
  );

  const notFoundLogs = useMemo(
    () => successLogs.filter((log) => log._status === "Not Found"),
    [successLogs],
  );

  const countsByUser = useMemo(() => {
    const map = {};
    successLogs.forEach((log) => {
      const id = getHardwareId(log);
      if (!id) return;
      map[id] = map[id] || { success: 0, unknown: 0 };
      map[id].success += 1;
    });
    unknownLogs.forEach((log) => {
      const id = getHardwareId(log);
      if (!id) return;
      map[id] = map[id] || { success: 0, unknown: 0 };
      map[id].unknown += 1;
    });
    return map;
  }, [successLogs, unknownLogs]);

  const latestByUser = useMemo(() => {
    const map = {};
    [...successLogs, ...unknownLogs].forEach((log) => {
      const id = getHardwareId(log);
      if (!id) return;
      const t = parseTimestamp(log.Timestamp);
      if (!map[id] || t > map[id].timeValue) {
        map[id] = {
          timeValue: t,
          timestamp: log.Timestamp,
          source: log._kind,
          status: log._status,
        };
      }
    });
    return map;
  }, [successLogs, unknownLogs]);

  const usersWithActivity = useMemo(() => {
    return [...data.users]
      .map((user) => {
        const id = getHardwareId(user);
        const activity = latestByUser[id];
        const counts = countsByUser[id] || { success: 0, unknown: 0 };
        return {
          ...user,
          _latestTimeValue:
            activity?.timeValue || parseTimestamp(user.Timestamp),
          _latestTimestamp: activity?.timestamp || user.Timestamp,
          _latestStatus: activity?.status || "",
          _successCount: counts.success,
          _unknownCount: counts.unknown,
        };
      })
      .sort((a, b) => b._latestTimeValue - a._latestTimeValue);
  }, [data.users, latestByUser, countsByUser]);

  const commonUsers = useMemo(
    () =>
      usersWithActivity.filter(
        (user) => user._successCount > 0 && user._unknownCount > 0,
      ),
    [usersWithActivity],
  );

  const versionCounts = useMemo(() => {
    const counts = {};
    usersWithActivity.forEach((user) => {
      const version = getVersion(user);
      counts[version] = (counts[version] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [usersWithActivity]);

  const deviceCounts = useMemo(() => {
    const counts = {};
    usersWithActivity.forEach((user) => {
      const device = safeString(user["Device Model"]) || "Unknown device";
      counts[device] = (counts[device] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [usersWithActivity]);

  const logStatusCounts = useMemo(() => {
    const counts = {};
    successLogs.forEach((log) => {
      counts[log._status] = (counts[log._status] || 0) + 1;
    });
    counts.Unknown = unknownLogs.length;
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [successLogs, unknownLogs]);

  const dailyActivity = useMemo(() => {
    const logs = [...successLogs, ...unknownLogs]
      .map((log) => ({ ...log, _timeValue: parseTimestamp(log.Timestamp) }))
      .filter((log) => log._timeValue);
    const sorted = logs.sort((a, b) => a._timeValue - b._timeValue);
    const uniqueDays = [
      ...new Set(sorted.map((log) => dayLabel(log._timeValue))),
    ].slice(-10);
    return uniqueDays.map((label) => {
      const dayLogs = logs.filter((log) => dayLabel(log._timeValue) === label);
      return {
        label,
        success: dayLogs.filter((log) => log._kind === "success").length,
        unknown: dayLogs.filter((log) => log._kind === "unknown").length,
      };
    });
  }, [successLogs, unknownLogs]);

  const uniqueVersions = useMemo(
    () => ["All", ...versionCounts.map((item) => item.label)],
    [versionCounts],
  );

  const filteredSuccess = useMemo(() => {
    return successLogs.filter((log) => {
      const statusOk = statusFilter === "All" || log._status === statusFilter;
      const versionOk =
        versionFilter === "All" || getVersion(log) === versionFilter;
      return statusOk && versionOk && includesSearch(log, globalSearch);
    });
  }, [successLogs, statusFilter, versionFilter, globalSearch]);

  const filteredUnknown = useMemo(() => {
    return unknownLogs.filter((log) => {
      const versionOk =
        versionFilter === "All" || getVersion(log) === versionFilter;
      return versionOk && includesSearch(log, globalSearch);
    });
  }, [unknownLogs, versionFilter, globalSearch]);

  const filteredNotFound = useMemo(() => {
    return notFoundLogs.filter((log) => {
      const versionOk =
        versionFilter === "All" || getVersion(log) === versionFilter;
      return versionOk && includesSearch(log, globalSearch);
    });
  }, [notFoundLogs, versionFilter, globalSearch]);

  const filteredUsers = useMemo(() => {
    return usersWithActivity.filter((user) => {
      const versionOk =
        versionFilter === "All" || getVersion(user) === versionFilter;
      return versionOk && includesSearch(user, globalSearch);
    });
  }, [usersWithActivity, versionFilter, globalSearch]);

  const filteredCommonUsers = useMemo(() => {
    return commonUsers.filter((user) => {
      const versionOk =
        versionFilter === "All" || getVersion(user) === versionFilter;
      return versionOk && includesSearch(user, globalSearch);
    });
  }, [commonUsers, versionFilter, globalSearch]);

  const examFilterOptions = useMemo(() => {
    const values = (key) =>
      [
        "All",
        ...new Set(exams.map((e) => safeString(e[key])).filter(Boolean)),
      ].sort();
    return {
      departments: values("department"),
      subjects: values("subjectCode"),
      terms: values("term"),
      types: values("examType"),
      years: [
        "All",
        ...new Set(exams.map((e) => safeString(e.year)).filter(Boolean)),
      ]
        .sort()
        .reverse(),
    };
  }, [exams]);

  const filteredExams = useMemo(() => {
    const search = examSearch.toLowerCase().trim();
    return exams.filter((exam) => {
      if (examDept !== "All" && safeString(exam.department) !== examDept)
        return false;
      if (examSubject !== "All" && safeString(exam.subjectCode) !== examSubject)
        return false;
      if (examTerm !== "All" && safeString(exam.term) !== examTerm)
        return false;
      if (examType !== "All" && safeString(exam.examType) !== examType)
        return false;
      if (examYear !== "All" && safeString(exam.year) !== examYear)
        return false;
      if (!search) return true;
      return `${exam.title || ""} ${exam.keywords || ""} ${exam.courseCode || ""} ${exam.subjectName || ""} ${exam.teacher || ""}`
        .toLowerCase()
        .includes(search);
    });
  }, [exams, examSearch, examDept, examSubject, examTerm, examType, examYear]);

  const selectedUserLogs = useMemo(() => {
    if (!selectedUser) return [];
    const id = getHardwareId(selectedUser);
    return sortLatestFirst(
      [...successLogs, ...unknownLogs].filter(
        (log) => getHardwareId(log) === id,
      ),
    );
  }, [selectedUser, successLogs, unknownLogs]);

  const openTab = (tab) => {
    if (!allowedTabs.includes(tab)) return;
    setActiveTab(tab);
    setSelectedUser(null);
    setSelectedLog(null);
    setSidebarOpen(false);
  };

  const openUser = (user) => {
    if (role !== "admin") return;
    setSelectedUser(user);
    setActiveTab("users");
    setSelectedLog(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-page">
        <style>{globalStyles}</style>
        <form onSubmit={handleLogin} className="auth-card">
          <div className="auth-icon">
            <ShieldCheck size={28} />
          </div>
          <h1>MyUOG Admin</h1>
          <p>Secure dashboard login · expires after 7 days</p>

          <label className="auth-label">Username</label>
          <input
            className="auth-input"
            placeholder="collaborator"
            value={loginForm.username}
            onChange={(e) =>
              setLoginForm({ ...loginForm, username: e.target.value })
            }
          />

          <label className="auth-label">Password</label>
          <input
            type="password"
            className="auth-input"
            placeholder="Enter password"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
          />

          {loginError && <div className="auth-error">{loginError}</div>}
          <button className="auth-button">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <style>{globalStyles}</style>
      <div className="app-shell">
        {sidebarOpen && (
          <button
            className="fixed inset-0 bg-black/25 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          />
        )}

        <aside
          className={cx(
            "sidebar",
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="sidebar-header">
            <div>
              <h1>MyUOG Admin</h1>
              <p>{role}</p>
            </div>
            <button
              className="md:hidden icon-button"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={22} />
            </button>
          </div>

          <nav className="sidebar-nav">
            {SIDEBAR_ITEMS.filter((item) => allowedTabs.includes(item.key)).map(
              (item) => {
                const Icon = item.icon;
                const count =
                  item.key === "notfound"
                    ? notFoundLogs.length
                    : item.key === "success"
                      ? successLogs.length
                      : item.key === "users"
                        ? data.users.length
                        : item.key === "unknown"
                          ? unknownLogs.length
                          : item.key === "common"
                            ? commonUsers.length
                            : item.key === "exams"
                              ? exams.length
                              : null;

                return (
                  <button
                    key={item.key}
                    onClick={() => openTab(item.key)}
                    className={cx(
                      "nav-button",
                      activeTab === item.key && "nav-active",
                    )}
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                    {count !== null && <b>{count}</b>}
                  </button>
                );
              },
            )}
          </nav>

          <div className="sidebar-footer">
            <button onClick={toggleTheme} className="nav-button plain">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button onClick={logout} className="nav-button danger">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <section className="main-section">
          <header className="topbar">
            <div className="topbar-title">
              <button
                className="md:hidden icon-button"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              <div>
                <h2>
                  {selectedUser
                    ? `${getName(selectedUser)} Profile`
                    : getTitle(activeTab)}
                </h2>
                <p>Latest records appear first.</p>
              </div>
            </div>

            <button
              onClick={refreshAll}
              disabled={loading}
              className="refresh-button"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </header>

          <main className="content-area">
            {activeTab !== "overview" &&
              activeTab !== "exams" &&
              activeTab !== "passwords" &&
              !selectedUser && (
                <FilterBar
                  search={globalSearch}
                  setSearch={setGlobalSearch}
                  versionFilter={versionFilter}
                  setVersionFilter={setVersionFilter}
                  versions={uniqueVersions}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  showStatus={activeTab === "success"}
                />
              )}

            {activeTab === "overview" && (
              <Overview
                successLogs={successLogs}
                unknownLogs={unknownLogs}
                versionCounts={versionCounts}
                deviceCounts={deviceCounts}
                logStatusCounts={logStatusCounts}
                dailyActivity={dailyActivity}
              />
            )}

            {activeTab === "notfound" && (
              <LogsList
                title="Exam Not Found"
                subtitle="Missing exam requests. Click a row to view full response and sheet status."
                rows={filteredNotFound}
                onOpenLog={setSelectedLog}
              />
            )}

            {activeTab === "success" && role === "admin" && (
              <LogsList
                title="Success Logs"
                subtitle="All bot responses. Click a row to view full response and sheet status."
                rows={filteredSuccess}
                onOpenLog={setSelectedLog}
              />
            )}

            {activeTab === "users" && role === "admin" && !selectedUser && (
              <UsersGrid rows={filteredUsers} onOpenUser={openUser} />
            )}

            {activeTab === "users" && role === "admin" && selectedUser && (
              <UserDetail
                user={selectedUser}
                logs={selectedUserLogs}
                onBack={() => setSelectedUser(null)}
                onOpenLog={setSelectedLog}
              />
            )}

            {activeTab === "unknown" && role === "admin" && (
              <LogsList
                title="Unknown Logs"
                subtitle="Questions that reached unknown fallback. Click a row to view details."
                rows={filteredUnknown}
                onOpenLog={setSelectedLog}
              />
            )}

            {activeTab === "common" && role === "admin" && (
              <UsersGrid
                rows={filteredCommonUsers}
                onOpenUser={openUser}
                title="Common Users"
              />
            )}

            {activeTab === "exams" && (
              <ExamsSection
                exams={filteredExams}
                total={exams.length}
                version={examVersion}
                filters={{
                  examSearch,
                  examDept,
                  examSubject,
                  examTerm,
                  examType,
                  examYear,
                }}
                setters={{
                  setExamSearch,
                  setExamDept,
                  setExamSubject,
                  setExamTerm,
                  setExamType,
                  setExamYear,
                }}
                options={examFilterOptions}
                onRefresh={() => fetchExamsData(true)}
                onOpenPaper={setPaperModal}
              />
            )}

            {activeTab === "passwords" && role === "admin" && (
              <PasswordsSection />
            )}
          </main>
        </section>

        {selectedLog && (
          <LogDetailPanel
            row={selectedLog}
            onClose={() => setSelectedLog(null)}
            onOpenUser={openUser}
          />
        )}
        {paperModal && (
          <PaperModal exam={paperModal} onClose={() => setPaperModal(null)} />
        )}
      </div>
    </div>
  );
}

function getTitle(tab) {
  const item = SIDEBAR_ITEMS.find((i) => i.key === tab);
  return item?.label || "Overview";
}

function Overview({
  successLogs,
  unknownLogs,
  versionCounts,
  deviceCounts,
  logStatusCounts,
  dailyActivity,
}) {
  const correctCount = successLogs.filter(
    (l) => l._status === "Correct",
  ).length;
  const reviewCount = successLogs.filter((l) => l._status === "Review").length;
  const notFoundCount = successLogs.filter(
    (l) => l._status === "Not Found",
  ).length;

  return (
    <div className="overview-page">
      <div className="overview-stat-grid">
        <OverviewStat
          title="Total Interactions"
          value={successLogs.length + unknownLogs.length}
        />
        <OverviewStat
          title="Total Users"
          value={versionCounts.reduce((sum, item) => sum + item.count, 0)}
        />
        <OverviewStat title="Success Logs" value={successLogs.length} />
        <OverviewStat title="Unknown Logs" value={unknownLogs.length} />
        <OverviewStat title="Need Review" value={reviewCount} />
        <OverviewStat title="Correct" value={correctCount} />
        <OverviewStat title="Exam Not Found" value={notFoundCount} />
      </div>

      <div className="overview-grid">
        <Panel
          title="Daily Activity"
          subtitle="History by date. Blue = success, orange = unknown."
        >
          <DailyActivityChart rows={dailyActivity} />
        </Panel>

        <Panel
          title="Logs by Status"
          subtitle="Readable horizontal bars, not tiny text."
        >
          <HorizontalBarChart rows={logStatusCounts} />
        </Panel>

        <Panel
          title="Users by App Version"
          subtitle="Installed app versions from user profiles."
        >
          <HorizontalBarChart rows={versionCounts} />
        </Panel>

        <Panel
          title="Mobile Devices"
          subtitle="Top mobile devices using MyUOG."
        >
          <RankedList rows={deviceCounts} />
        </Panel>
      </div>
    </div>
  );
}

function OverviewStat({ title, value }) {
  return (
    <div className="overview-stat-card">
      <span>{title}</span>
      <b>{value}</b>
    </div>
  );
}
function MiniStat({ label, value }) {
  return (
    <div className="mini-stat">
      <p>{label}</p>
      <b>{value}</b>
    </div>
  );
}

function HorizontalBarChart({ rows }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="horizontal-chart">
      {rows.length === 0 && <p className="empty-text">No data yet.</p>}
      {rows.map((row) => {
        const width = Math.max(5, Math.round((row.count / max) * 100));
        return (
          <div className="hbar-row" key={row.label}>
            <div className="hbar-head">
              <span title={row.label}>{row.label}</span>
              <b>{row.count}</b>
            </div>
            <div className="hbar-track">
              <div style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerticalBarChart({ rows }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="vertical-chart">
      {rows.length === 0 && <p className="empty-text">No data yet.</p>}
      {rows.map((row) => {
        const height = Math.max(10, Math.round((row.count / max) * 100));
        return (
          <div className="vertical-item" key={row.label}>
            <div className="vertical-bar-wrap">
              <div className="vertical-bar" style={{ height: `${height}%` }} />
            </div>
            <b>{row.count}</b>
            <span title={row.label}>{row.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DailyActivityChart({ rows }) {
  const max = Math.max(...rows.map((r) => r.success + r.unknown), 1);
  return (
    <div className="daily-chart">
      {rows.length === 0 && <p className="empty-text">No data yet.</p>}
      {rows.map((row) => {
        const successHeight = Math.max(
          4,
          Math.round((row.success / max) * 100),
        );
        const unknownHeight = Math.max(
          row.unknown ? 4 : 0,
          Math.round((row.unknown / max) * 100),
        );
        return (
          <div className="daily-item" key={row.label}>
            <div className="daily-stack">
              <div
                className="daily-unknown"
                style={{ height: `${unknownHeight}%` }}
                title={`Unknown: ${row.unknown}`}
              />
              <div
                className="daily-success"
                style={{ height: `${successHeight}%` }}
                title={`Success: ${row.success}`}
              />
            </div>
            <b>{row.success + row.unknown}</b>
            <span>{row.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function RankedList({ rows }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="ranked-list">
      {rows.length === 0 && <p className="empty-text">No data yet.</p>}
      {rows.map((row) => {
        const width = Math.max(4, Math.round((row.count / max) * 100));
        return (
          <div className="rank-row" key={row.label}>
            <div className="rank-head">
              <span>{row.label}</span>
              <b>{row.count}</b>
            </div>
            <div className="rank-track">
              <div style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilterBar({
  search,
  setSearch,
  versionFilter,
  setVersionFilter,
  versions,
  statusFilter,
  setStatusFilter,
  showStatus,
}) {
  return (
    <div className="filter-panel">
      <label className="filter-search">
        <span>Search</span>
        <div className="search-input-wrap">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, device, question..."
          />
        </div>
      </label>
      <SelectBox
        value={versionFilter}
        onChange={setVersionFilter}
        options={versions}
        label="App Version"
      />
      {showStatus && (
        <SelectBox
          value={statusFilter}
          onChange={setStatusFilter}
          options={["All", ...STATUSES]}
          label="Status"
        />
      )}
    </div>
  );
}

function LogsList({ title, subtitle, rows, onOpenLog }) {
  return (
    <Panel
      title={title}
      subtitle={`${subtitle} · ${rows.length} rows`}
      noPadding
    >
      <div className="table-scroll">
        <table className="data-table logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Version</th>
              <th>Question</th>
              <th>Response</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr
                key={`${log._kind}-${log._rowNumber || "no-row"}-${log.Timestamp}-${getQuestion(log)}`}
                onClick={() => onOpenLog(log)}
              >
                <td>{cleanTime(log.Timestamp)}</td>
                <td>
                  <b>{getName(log)}</b>
                  <span>
                    {safeString(log["Device Model"]) || "unknown device"}
                  </span>
                </td>
                <td>{getVersion(log)}</td>
                <td className="question-cell">
                  {getQuestion(log) || "No question"}
                </td>
                <td className="response-cell">
                  {getResponse(log) || "No bot response"}
                </td>
                <td>
                  <StatusBadge status={log._status || "Review"} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <EmptyRow colSpan={6} text="No rows found." />
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function LogDetailPanel({ row, onClose, onOpenUser }) {
  const status = row._status || "Review";
  const issue = safeString(row.ISSUE);

  return (
    <div className="detail-shell">
      <button
        className="detail-backdrop"
        onClick={onClose}
        aria-label="Close details"
      />
      <aside className="detail-panel">
        <div className="detail-header">
          <div>
            <h3>Log Details</h3>
            <p>{row._kind === "unknown" ? "Unknown log" : "Success log"}</p>
          </div>
          <button onClick={onClose} className="icon-button">
            <X size={22} />
          </button>
        </div>

        <div className="detail-body">
          <div className="detail-user-card">
            <div className="avatar small">{initials(getName(row))}</div>
            <div>
              <button onClick={() => onOpenUser(row)}>{getName(row)}</button>
              <p>{getHardwareId(row)}</p>
            </div>
          </div>

          <div className="detail-grid">
            <Info label="Time" value={cleanTime(row.Timestamp)} />
            <Info label="Version" value={getVersion(row)} />
            <Info label="Status" value={status} />
            <Info
              label="Device"
              value={safeString(row["Device Model"]) || "unknown"}
            />
          </div>

          <DetailBlock title="Question">
            <p>{getQuestion(row) || "No question"}</p>
          </DetailBlock>

          <DetailBlock title="Response User Got">
            {getResponse(row) ? (
              <pre>{getResponse(row)}</pre>
            ) : (
              <p className="muted">
                No bot response saved because this row is from Unknown Logs.
              </p>
            )}
          </DetailBlock>

          <DetailBlock title="Status From Google Sheet">
            <StatusBadge status={status} />
          </DetailBlock>

          {issue && (
            <DetailBlock title="Remarks / Issue From Sheet">
              <p>{issue}</p>
            </DetailBlock>
          )}
        </div>

        <div className="detail-footer read-only">
          <button onClick={onClose} className="primary-button">
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

function UsersGrid({ rows, onOpenUser, title = "Users" }) {
  return (
    <Panel
      title={title}
      subtitle={`${rows.length} users · latest active first`}
    >
      <div className="user-grid">
        {rows.map((user) => (
          <UserProfileCard
            key={getHardwareId(user)}
            user={user}
            onClick={() => onOpenUser(user)}
          />
        ))}
        {rows.length === 0 && <p className="empty-text">No users found.</p>}
      </div>
    </Panel>
  );
}

function UserProfileCard({ user, onClick }) {
  return (
    <button onClick={onClick} className="profile-card">
      <div className="profile-cover">
        <div className="avatar">{initials(getName(user))}</div>
      </div>
      <div className="profile-content">
        <h3>{getName(user)}</h3>
        <p>
          {safeString(user["Device Model"]) || "unknown device"} ·{" "}
          {safeString(user.Platform) || "unknown"}
        </p>
        <b>v{getVersion(user)}</b>
        <div className="profile-stats">
          <div>
            <span>Success</span>
            <strong>{user._successCount || 0}</strong>
          </div>
          <div>
            <span>Unknown</span>
            <strong>{user._unknownCount || 0}</strong>
          </div>
        </div>
        <small>Last active: {cleanTime(user._latestTimestamp)}</small>
      </div>
    </button>
  );
}

function UserDetail({ user, logs, onBack, onOpenLog }) {
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="secondary-button inline-flex">
        ← Back to Users
      </button>
      <UserProfileCard user={user} onClick={() => {}} />
      <LogsList
        title="User Logs"
        subtitle={`${logs.length} logs for ${getName(user)}`}
        rows={logs}
        onOpenLog={onOpenLog}
      />
    </div>
  );
}

function ExamsSection({
  exams,
  total,
  version,
  filters,
  setters,
  options,
  onRefresh,
  onOpenPaper,
}) {
  return (
    <div className="space-y-5">
      <div className="panel filter-exam-panel">
        <div className="exam-head">
          <div>
            <h3>Exams</h3>
            <p>
              Showing {exams.length} of {total} · cache version {version}
            </p>
          </div>
          <button onClick={onRefresh} className="primary-button">
            <RefreshCw size={16} /> Force Refresh
          </button>
        </div>

        <div className="exam-filter-grid">
          <label className="filter-search exam-search">
            <span>Search</span>
            <div className="search-input-wrap">
              <Search size={18} />
              <input
                value={filters.examSearch}
                onChange={(e) => setters.setExamSearch(e.target.value)}
                placeholder="Search paper, course, teacher..."
              />
            </div>
          </label>
          <SelectBox
            value={filters.examDept}
            onChange={setters.setExamDept}
            options={options.departments}
            label="Dept"
          />
          <SelectBox
            value={filters.examSubject}
            onChange={setters.setExamSubject}
            options={options.subjects}
            label="Subject"
          />
          <SelectBox
            value={filters.examTerm}
            onChange={setters.setExamTerm}
            options={options.terms}
            label="Term"
          />
          <SelectBox
            value={filters.examType}
            onChange={setters.setExamType}
            options={options.types}
            label="Type"
          />
          <SelectBox
            value={filters.examYear}
            onChange={setters.setExamYear}
            options={options.years}
            label="Year"
          />
        </div>
      </div>

      <Panel
        title="Exam Papers"
        subtitle="Click any row to open the paper fully."
        noPadding
      >
        <div className="table-scroll">
          <table className="data-table exams-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Dept</th>
                <th>Subject</th>
                <th>Term</th>
                <th>Year</th>
                <th>Type</th>
                <th>Pages</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, index) => (
                <tr
                  key={`${exam.title}-${index}`}
                  onClick={() => onOpenPaper(exam)}
                >
                  <td className="question-cell">
                    <b>{exam.title}</b>
                  </td>
                  <td>{safeString(exam.department) || "-"}</td>
                  <td>{safeString(exam.subjectCode) || "-"}</td>
                  <td>{safeString(exam.term) || "-"}</td>
                  <td>{safeString(exam.year) || "-"}</td>
                  <td>{safeString(exam.examType) || "-"}</td>
                  <td>
                    <span className="open-pill">
                      {Array.isArray(exam.urls) ? exam.urls.length : 0}{" "}
                      <ExternalLink size={14} />
                    </span>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <EmptyRow colSpan={7} text="No exams found." />
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function PaperModal({ exam, onClose }) {
  const urls = Array.isArray(exam.urls) ? exam.urls : [];
  return (
    <div className="paper-modal">
      <header>
        <div>
          <h2>{exam.title}</h2>
          <p>{safeString(exam.subjectName) || safeString(exam.subjectCode)}</p>
        </div>
        <button onClick={onClose} className="icon-button">
          <X size={24} />
        </button>
      </header>
      <main>
        {urls.map((url, index) => (
          <div key={url} className="paper-page">
            <div>
              <b>Page {index + 1}</b>
              <button onClick={() => window.open(url, "_blank")}>
                Open original <ExternalLink size={14} />
              </button>
            </div>
            <img src={url} alt={`Page ${index + 1}`} />
          </div>
        ))}
        {urls.length === 0 && (
          <div className="panel p-10 text-center">
            No paper image URLs found.
          </div>
        )}
      </main>
    </div>
  );
}

function PasswordsSection() {
  return (
    <Panel
      title="Passwords"
      subtitle="Visible only to main admin. Main admin password is unchanged."
    >
      <div className="credential-grid">
        <CredentialCard title="Main Admin" username="admin" password="myuog" />
        <CredentialCard
          title="Collaborator"
          username="collaborator / contributor"
          password="myuog-exams"
        />
      </div>
    </Panel>
  );
}

function CredentialCard({ title, username, password }) {
  return (
    <div className="credential-card">
      <h4>{title}</h4>
      <Info label="Username" value={username} />
      <Info label="Password" value={password} />
    </div>
  );
}

function Panel({ title, subtitle, children, noPadding = false }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className={noPadding ? "" : "panel-body"}>{children}</div>
    </div>
  );
}

function DetailBlock({ title, children }) {
  return (
    <div className="detail-block">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function SelectBox({ value, onChange, options, label }) {
  return (
    <label className="select-box">
      {label && <span>{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={cx("status-pill", statusPillClass(status))}>{status}</span>
  );
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-cell">
        {text}
      </td>
    </tr>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-box">
      <p>{label}</p>
      <b>{value}</b>
    </div>
  );
}

const globalStyles = `
  :root {
    --bg: #eef3f8;
    --surface: #ffffff;
    --surface-2: #f6f9fd;
    --text: #0f172a;
    --muted: #526173;
    --line: #cbd8e8;
    --soft-line: #e5edf6;
    --primary: #2563eb;
    --primary-soft: #e7efff;
    --bar: #2563eb;
    --bar-soft: #dbeafe;
  }
  .dark {
    --bg: #182232;
    --surface: #233044;
    --surface-2: #2c3a50;
    --text: #f8fafc;
    --muted: #d0d9e6;
    --line: #52627a;
    --soft-line: #40516a;
    --primary: #8bbcff;
    --primary-soft: rgba(139, 188, 255, 0.18);
    --bar: #78aef8;
    --bar-soft: #31435d;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); }
  input::placeholder, textarea::placeholder { color: color-mix(in srgb, var(--muted) 78%, transparent); }
  .app-shell {
    height: 100vh;
    background: var(--bg);
    color: var(--text);
    display: flex;
    overflow: hidden;
  }
  .sidebar {
    position: fixed;
    z-index: 40;
    height: 100%;
    width: 18rem;
    background: var(--surface);
    border-right: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    transition: transform 180ms ease;
  }
  @media (min-width: 768px) { .sidebar { position: relative; transform: translateX(0) !important; } }
  .sidebar-header {
    height: 4.25rem;
    padding: 0 1.25rem;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sidebar-header h1 { font-weight: 900; font-size: 1.25rem; color: var(--primary); margin: 0; }
  .sidebar-header p { margin: 0.1rem 0 0; color: var(--muted); font-size: 0.75rem; text-transform: capitalize; }
  .sidebar-nav { flex: 1; overflow-y: auto; padding: 0.8rem; display: flex; flex-direction: column; gap: 0.35rem; }
  .sidebar-footer { padding: 0.8rem; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 0.4rem; }
  .nav-button {
    width: 100%;
    border: 0;
    background: transparent;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.8rem 0.95rem;
    border-radius: 1rem;
    text-align: left;
    font-weight: 750;
    cursor: pointer;
  }
  .nav-button:hover { background: var(--surface-2); }
  .nav-button.nav-active { background: var(--primary); color: white; }
  .nav-button span { flex: 1; }
  .nav-button b { font-size: 0.75rem; padding: 0.1rem 0.5rem; border-radius: 999px; background: rgba(0,0,0,0.08); }
  .nav-button.nav-active b { background: rgba(255,255,255,0.2); }
  .nav-button.danger { color: #e11d48; }
  .main-section { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .topbar {
    height: 4.25rem;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    border-bottom: 1px solid var(--line);
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .topbar-title { display: flex; align-items: center; gap: 0.8rem; min-width: 0; }
  .topbar h2 { margin: 0; font-size: 1.15rem; font-weight: 900; }
  .topbar p { margin: 0.15rem 0 0; color: var(--muted); font-size: 0.78rem; }
  .content-area { flex: 1; overflow: auto; padding: 1rem; }
  @media (min-width: 768px) { .content-area { padding: 1.35rem; } .topbar { padding: 0 1.35rem; } }
  .icon-button { border: 0; background: transparent; color: var(--text); border-radius: 0.75rem; padding: 0.5rem; cursor: pointer; }
  .icon-button:hover { background: var(--surface-2); }
  .refresh-button, .primary-button {
    border: 0;
    background: #2563eb;
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.7rem 1rem;
    border-radius: 0.9rem;
    font-weight: 850;
    cursor: pointer;
  }
  .dark .refresh-button, .dark .primary-button { background: #3b82f6; }
  .refresh-button:disabled, .primary-button:disabled { opacity: 0.45; cursor: not-allowed; }
  .secondary-button {
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--text);
    padding: 0.72rem 1rem;
    border-radius: 0.9rem;
    font-weight: 850;
    cursor: pointer;
    align-items: center;
    justify-content: center;
  }
  .secondary-button:hover { background: var(--surface-2); }
  .panel {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 1.35rem;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.035);
    overflow: hidden;
  }
  .dark .panel { box-shadow: none; }
  .panel-header { padding: 1rem 1.15rem; border-bottom: 1px solid var(--line); }
  .panel-header h3 { margin: 0; font-size: 1.05rem; font-weight: 900; }
  .panel-header p { margin: 0.25rem 0 0; color: var(--muted); font-size: 0.82rem; }
  .panel-body { padding: 1.15rem; }
  .overview-page { display: flex; flex-direction: column; gap: 1rem; }
  .overview-stat-grid { display: grid; grid-template-columns: 1fr; gap: 0.85rem; }
  @media (min-width: 640px) { .overview-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (min-width: 1180px) { .overview-stat-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .overview-stat-card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-top: 3px solid var(--primary);
    border-radius: 1.15rem;
    padding: 1rem 1.1rem;
    min-height: 6rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  }
  .dark .overview-stat-card { box-shadow: none; border-top-color: var(--primary); }
  .overview-stat-card span { color: var(--muted); font-weight: 900; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.03em; }
  .overview-stat-card b { color: var(--text); font-size: clamp(1.6rem, 3vw, 2.25rem); margin-top: 0.35rem; line-height: 1; }
  .overview-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  @media (min-width: 1100px) { .overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .mini-stat-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 0.8rem; }
  @media (min-width: 680px) { .mini-stat-grid { grid-template-columns: repeat(4, minmax(0,1fr)); } }
  .mini-stat { background: var(--surface-2); border: 1px solid var(--soft-line); border-radius: 1rem; padding: 1rem; }
  .mini-stat p { margin: 0; color: var(--muted); font-size: 0.8rem; font-weight: 800; }
  .mini-stat b { display: block; margin-top: 0.35rem; font-size: 1.5rem; }
  .horizontal-chart { display: flex; flex-direction: column; gap: 0.9rem; }
  .hbar-row { min-width: 0; }
  .hbar-head { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 0.35rem; align-items: center; }
  .hbar-head span { font-weight: 900; color: var(--text); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hbar-head b { color: var(--text); font-weight: 950; }
  .hbar-track { height: 0.7rem; border-radius: 999px; background: var(--bar-soft); overflow: hidden; }
  .hbar-track div { height: 100%; border-radius: 999px; background: var(--bar); }
  .vertical-chart { height: 250px; display: flex; align-items: flex-end; gap: 0.85rem; overflow-x: auto; padding: 0.7rem 0.2rem 0; }
  .vertical-item { height: 100%; min-width: 76px; display: grid; grid-template-rows: 1fr auto auto; gap: 0.35rem; text-align: center; align-items: end; }
  .vertical-bar-wrap { height: 170px; width: 100%; border-radius: 0.9rem; background: var(--surface-2); border: 1px solid var(--soft-line); display: flex; align-items: flex-end; padding: 0.25rem; }
  .vertical-bar { width: 100%; background: var(--primary); border-radius: 0.65rem; min-height: 8px; }
  .vertical-item b { color: var(--text); font-size: 0.9rem; }
  .vertical-item span { color: var(--muted); font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .daily-chart { height: 270px; display: flex; align-items: flex-end; gap: 0.9rem; overflow-x: auto; padding: 0.8rem 0.2rem 0; }
  .daily-item { height: 100%; min-width: 72px; display: grid; grid-template-rows: 1fr auto auto; gap: 0.35rem; text-align: center; align-items: end; }
  .daily-stack { height: 185px; width: 100%; display: flex; flex-direction: column; justify-content: flex-end; gap: 3px; background: var(--surface-2); border: 1px solid var(--soft-line); border-radius: 0.9rem; padding: 0.25rem; }
  .daily-success { background: #2563eb; border-radius: 0.55rem; min-height: 4px; }
  .daily-unknown { background: #f97316; border-radius: 0.55rem; }
  .daily-item b { font-size: 0.9rem; }
  .daily-item span { font-size: 0.75rem; color: var(--muted); }
  .ranked-list { display: flex; flex-direction: column; gap: 0.85rem; }
  .rank-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-weight: 850; }
  .rank-head span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rank-head b { color: var(--primary); }
  .rank-track { height: 0.55rem; border-radius: 999px; background: var(--surface-2); overflow: hidden; border: 1px solid var(--soft-line); }
  .rank-track div { height: 100%; background: var(--primary); border-radius: 999px; }
  .filter-panel, .filter-exam-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 1.25rem; padding: 1rem; margin-bottom: 1rem; }
  .filter-panel { display: grid; grid-template-columns: 1fr; gap: 0.85rem; align-items: end; }
  @media (min-width: 768px) { .filter-panel { grid-template-columns: minmax(260px, 1fr) 220px 220px; } }
  .filter-search span, .select-box span, .field-label span { display: block; color: var(--muted); font-size: 0.75rem; font-weight: 900; margin-bottom: 0.4rem; }
  .search-input-wrap { position: relative; display: flex; align-items: center; }
  .search-input-wrap svg { position: absolute; left: 0.9rem; color: var(--muted); }
  .search-input-wrap input, .select-box select, .auth-input, .field-label textarea, .status-select {
    width: 100%;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--text);
    border-radius: 0.9rem;
    padding: 0.78rem 0.9rem;
    outline: none;
    font-weight: 650;
  }
  .status-select { font-weight: 900; border-width: 1.5px; }
  .search-input-wrap input { padding-left: 2.55rem; }
  .search-input-wrap input:focus, .select-box select:focus, .auth-input:focus, .field-label textarea:focus, .status-select:focus { box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 35%, transparent); }
  .exam-head { display: flex; flex-direction: column; gap: 0.9rem; margin-bottom: 1rem; }
  .exam-head h3 { margin: 0; font-weight: 900; }
  .exam-head p { margin: 0.25rem 0 0; color: var(--muted); font-size: 0.82rem; }
  @media (min-width: 768px) { .exam-head { flex-direction: row; align-items: center; justify-content: space-between; } }
  .exam-filter-grid { display: grid; grid-template-columns: 1fr; gap: 0.85rem; align-items: end; }
  @media (min-width: 900px) { .exam-filter-grid { grid-template-columns: minmax(260px, 2fr) repeat(5, minmax(120px, 1fr)); } }
  .table-scroll { width: 100%; overflow-x: auto; }
  .data-table { min-width: 780px; width: 100%; border-collapse: collapse; font-size: 0.92rem; }
  .logs-table { min-width: 860px; }
  .exams-table { min-width: 940px; }
  .data-table th { text-align: left; color: var(--muted); font-size: 0.78rem; padding: 0.9rem 1rem; border-bottom: 1px solid var(--line); font-weight: 900; }
  .data-table td { padding: 0.95rem 1rem; border-bottom: 1px solid var(--soft-line); vertical-align: middle; color: var(--text); }
  .data-table tbody tr { cursor: pointer; }
  .data-table tbody tr:hover { background: var(--surface-2); }
  .data-table td span { display: block; color: var(--muted); font-size: 0.74rem; margin-top: 0.15rem; }
  .question-cell { max-width: 520px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 850; color: var(--text); }
  .response-cell { max-width: 420px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-weight: 700; }
  .detail-footer.read-only { grid-template-columns: 1fr; }
  .status-correct { background: #d1fae5 !important; color: #065f46 !important; border-color: #6ee7b7 !important; }
  .status-wrong { background: #fee2e2 !important; color: #991b1b !important; border-color: #fca5a5 !important; }
  .status-later { background: #dbeafe !important; color: #1e40af !important; border-color: #93c5fd !important; }
  .status-fixed { background: #e0e7ff !important; color: #3730a3 !important; border-color: #a5b4fc !important; }
  .status-notfound { background: #ede9fe !important; color: #5b21b6 !important; border-color: #c4b5fd !important; }
  .status-unknown { background: #e5e7eb !important; color: #374151 !important; border-color: #cbd5e1 !important; }
  .status-review { background: #fef3c7 !important; color: #92400e !important; border-color: #fcd34d !important; }
  .status-pill { display: inline-flex; border-radius: 999px; padding: 0.38rem 0.78rem; border: 1px solid; font-size: 0.76rem; font-weight: 950; white-space: nowrap; min-width: 6.1rem; justify-content: center; }
  .open-pill { color: var(--primary); display: inline-flex !important; align-items: center; gap: 0.25rem; font-weight: 900; font-size: 0.85rem !important; }
  .empty-cell { text-align: center; color: var(--muted); padding: 2.5rem !important; }
  .detail-shell { position: fixed; inset: 0; z-index: 60; display: flex; justify-content: flex-end; }
  .detail-backdrop { position: absolute; inset: 0; border: 0; background: rgba(15, 23, 42, 0.35); }
  .detail-panel { position: relative; height: 100%; width: 100%; max-width: 590px; background: var(--surface); border-left: 1px solid var(--line); box-shadow: -20px 0 45px rgba(15,23,42,0.18); display: flex; flex-direction: column; }
  .detail-header { height: 4.25rem; padding: 0 1.1rem; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; }
  .detail-header h3 { margin: 0; font-weight: 900; }
  .detail-header p { margin: 0.15rem 0 0; color: var(--muted); font-size: 0.76rem; }
  .detail-body { flex: 1; overflow: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
  .detail-footer { border-top: 1px solid var(--line); padding: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
  @media (max-width: 520px) { .detail-footer { grid-template-columns: 1fr; } }
  .detail-user-card, .detail-block, .info-box, .credential-card { background: var(--surface-2); border: 1px solid var(--soft-line); border-radius: 1rem; padding: 1rem; }
  .detail-user-card { display: flex; align-items: center; gap: 0.8rem; }
  .detail-user-card button { border: 0; background: transparent; color: var(--primary); font-weight: 900; padding: 0; cursor: pointer; }
  .detail-user-card p { color: var(--muted); font-size: 0.75rem; margin: 0.15rem 0 0; word-break: break-all; }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
  @media (max-width: 520px) { .detail-grid { grid-template-columns: 1fr; } }
  .detail-block h4 { margin: 0 0 0.5rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.02em; font-size: 0.72rem; font-weight: 900; }
  .detail-block p { margin: 0; font-weight: 700; white-space: pre-wrap; }
  .detail-block pre { margin: 0; white-space: pre-wrap; font-family: inherit; font-size: 0.9rem; line-height: 1.55; }
  .field-label textarea { min-height: 130px; resize: vertical; }
  .correct-note { border: 1px solid #86efac; background: #ecfdf5; color: #047857; border-radius: 1rem; padding: 1rem; font-weight: 800; }
  .dark .correct-note { background: rgba(52, 211, 153, 0.12); color: #d1fae5; border-color: rgba(52, 211, 153, 0.35); }
  .user-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  @media (min-width: 640px) { .user-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (min-width: 1280px) { .user-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (min-width: 1536px) { .user-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  .profile-card { border: 1px solid var(--line); background: var(--surface); border-radius: 1.5rem; overflow: hidden; padding: 0; text-align: left; cursor: pointer; color: var(--text); box-shadow: 0 8px 22px rgba(15,23,42,0.05); }
  .dark .profile-card { box-shadow: none; }
  .profile-card:hover { transform: translateY(-2px); }
  .profile-cover { height: 5.4rem; background: linear-gradient(135deg, #dbeafe, #ede9fe); position: relative; }
  .dark .profile-cover { background: linear-gradient(135deg, rgba(96,165,250,0.28), rgba(167,139,250,0.22)); }
  .avatar { position: absolute; left: 50%; bottom: -2.05rem; transform: translateX(-50%); height: 4.2rem; width: 4.2rem; border-radius: 999px; background: var(--surface); color: var(--primary); border: 4px solid var(--surface); display: flex; align-items: center; justify-content: center; font-weight: 950; font-size: 1.15rem; line-height: 1; letter-spacing: 0; padding: 0 0.25rem; box-shadow: 0 8px 18px rgba(15,23,42,0.1); white-space: nowrap; }
  .avatar.small { position: static; transform: none; height: 3rem; width: 3rem; border-width: 0; background: var(--primary-soft); box-shadow: none; }
  .profile-content { padding: 2.65rem 1.1rem 1.1rem; text-align: center; }
  .profile-content h3 { margin: 0; font-weight: 900; font-size: 1.05rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .profile-content p { margin: 0.25rem 0 0; color: var(--muted); font-size: 0.78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .profile-content > b { display: block; color: var(--primary); font-size: 0.8rem; margin-top: 0.25rem; }
  .profile-stats { margin-top: 1rem; border-top: 1px solid var(--line); padding-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
  .profile-stats div { background: var(--surface-2); border: 1px solid var(--soft-line); border-radius: 0.9rem; padding: 0.75rem; text-align: center; }
  .profile-stats span { display: block; text-transform: uppercase; color: var(--muted); font-weight: 900; font-size: 0.65rem; }
  .profile-stats strong { display: block; font-size: 1.25rem; margin-top: 0.1rem; }
  .profile-content small { display: block; color: var(--muted); margin-top: 0.8rem; font-size: 0.72rem; }
  .paper-modal { position: fixed; inset: 0; z-index: 70; background: var(--bg); color: var(--text); display: flex; flex-direction: column; }
  .paper-modal header { height: 4.25rem; background: var(--surface); border-bottom: 1px solid var(--line); padding: 0 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .paper-modal h2 { margin: 0; font-weight: 900; font-size: 1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .paper-modal p { margin: 0.1rem 0 0; color: var(--muted); font-size: 0.75rem; }
  .paper-modal main { flex: 1; overflow: auto; padding: 1rem; display: grid; grid-template-columns: 1fr; gap: 1rem; }
  @media (min-width: 1000px) { .paper-modal main { grid-template-columns: 1fr 1fr; } }
  .paper-page { background: var(--surface); border: 1px solid var(--line); border-radius: 1.2rem; overflow: hidden; }
  .paper-page div { padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); }
  .paper-page button { border: 0; background: transparent; color: var(--primary); font-weight: 900; display: inline-flex; align-items: center; gap: 0.25rem; cursor: pointer; }
  .paper-page img { width: 100%; max-height: 85vh; object-fit: contain; background: var(--surface-2); }
  .credential-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  @media (min-width: 768px) { .credential-grid { grid-template-columns: 1fr 1fr; } }
  .credential-card { display: flex; flex-direction: column; gap: 0.8rem; }
  .credential-card h4 { margin: 0; font-weight: 900; }
  .info-box p { margin: 0; color: var(--muted); font-size: 0.7rem; font-weight: 900; text-transform: uppercase; }
  .info-box b { display: block; margin-top: 0.25rem; word-break: break-word; }
  .empty-text, .muted { color: var(--muted); }
  .auth-page { min-height: 100vh; background: #eef3f8; display: flex; align-items: center; justify-content: center; padding: 1.25rem; color: #0f172a; }
  .auth-card { width: 100%; max-width: 440px; background: #ffffff; border: 1px solid #cbd8e8; border-radius: 1.4rem; box-shadow: 0 18px 45px rgba(15,23,42,0.12); padding: 1.6rem; }
  .auth-icon { height: 3.4rem; width: 3.4rem; border-radius: 1rem; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
  .auth-card h1 { text-align: center; margin: 0; font-weight: 950; font-size: 1.65rem; color: #0f172a; }
  .auth-card p { text-align: center; margin: 0.35rem 0 1.35rem; color: #475569; font-size: 0.92rem; }
  .auth-label { display: block; font-size: 0.8rem; font-weight: 950; color: #475569; margin: 0.8rem 0 0.4rem; }
  .auth-input { display: block; width: 100%; background: #f8fafc; color: #0f172a; border: 1px solid #cbd8e8; border-radius: 0.9rem; padding: 0.9rem 1rem; font-size: 1rem; font-weight: 650; }
  .auth-input::placeholder { color: #8493a8; }
  .auth-button { margin-top: 1rem; width: 100%; border: 0; background: #2563eb; color: white; border-radius: 0.95rem; padding: 0.9rem; font-size: 1rem; font-weight: 950; cursor: pointer; }
  .auth-button:hover { background: #1d4ed8; }
  .auth-error { margin-top: 0.8rem; color: #be123c; font-weight: 850; font-size: 0.88rem; text-align: center; }
`;
