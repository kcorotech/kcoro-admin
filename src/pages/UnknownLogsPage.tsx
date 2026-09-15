import React, { useState, useMemo } from "react";
import {
  HiMagnifyingGlass,
  HiXMark,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";
import "../CSS/SuccessLogsPage.css";

// --- DUMMY DATA ---
const generateLogs = (count: number) => {
  const statuses = ["Correct", "Review", "Not found"];
  const users = ["Haider Ali", "Sara Khan", "Zain Ahmed", "Fatima", "Bilal"];
  const versions = ["1.0.15", "1.0.16", "1.0.17", "1.0.18"];

  return Array.from({ length: count }, (_, i) => ({
    id: `log-${i}`,
    time: i === 0 ? "10:25 PM" : i < 5 ? "Yesterday" : `14 Feb 2026`,
    user: users[i % users.length],
    initial: users[i % users.length].charAt(0),
    version: versions[i % versions.length],
    question:
      i % 2 === 0
        ? "Where is UoG Located?"
        : "Provide past papers for CS Semester 4",
    response:
      i % 2 === 0
        ? "The University of Gujrat (UoG) is located in Gujrat, Punjab, Pakistan. The main campus, Hafiz Hayat Campus, is situated on Jalalpur Jattan Road..."
        : "I have found 3 past papers for Computer Science Semester 4. They include Data Structures, Database Systems, and Operating Systems.",
    status: statuses[i % statuses.length],
  }));
};

const dummyLogs = generateLogs(65);

const UnknownLogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const logsPerPage = 12;

  // --- FILTER LOGIC ---
  const filteredLogs = useMemo(() => {
    return dummyLogs.filter((log) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        log.user.toLowerCase().includes(query) ||
        log.question.toLowerCase().includes(query) ||
        log.response.toLowerCase().includes(query) ||
        log.version.includes(query);

      const matchesStatus = activeTab === "All" || log.status === activeTab;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, activeTab]);

  // Pagination
  const totalLogs = filteredLogs.length;
  const totalPages = Math.ceil(totalLogs / logsPerPage) || 1;
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  // Reset pagination if filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Correct":
        return "status-correct";
      case "Review":
        return "status-review";
      case "Not found":
        return "status-error";
      default:
        return "";
    }
  };

  return (
    <div className="chatLayoutContainer">
      <div className="chatHeader">
        <div className="titleRow">
          <h2 className="pageTitle">Unknown Logs</h2>
          <span className="totalBadge">{totalLogs} Entries</span>
        </div>
      </div>

      <div className="globalFilterBar">
        <div className="chatSearch">
          <HiMagnifyingGlass size={18} className="searchIcon" />
          <input
            type="text"
            placeholder="Search users, questions, or versions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="chatMainBox">
        <div className="chatList">
          {currentLogs.length > 0 ? (
            currentLogs.map((log) => (
              <div
                className="chatRow"
                key={log.id}
                onClick={() => setSelectedLog(log)}
              >
                <div className="chatAvatar">{log.initial}</div>
                <div className="chatContent">
                  <div className="chatContentTop">
                    <span className="chatUserName">{log.user}</span>
                    <span className="chatTime">{log.time}</span>
                  </div>

                  <div className="chatContentMiddle">
                    <span className="chatVersion">v{log.version}</span>
                    <span className="chatQuestion">{log.question}</span>
                  </div>

                  <div className="chatContentBottom">
                    <p className="chatResponseSnippet">{log.response}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="chatEmptyState">
              No conversations match your filters.
            </div>
          )}
        </div>
        {totalLogs > 0 && (
          <div className="chatPagination">
            <p className="pageText">
              Showing <span>{indexOfFirstLog + 1}</span>-
              <span>{Math.min(indexOfLastLog, totalLogs)}</span> of {totalLogs}
            </p>
            <div className="pageControls">
              <button
                className="pageBtn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <HiChevronLeft size={16} />
              </button>
              <button
                className="pageBtn"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                <HiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="chatModalOverlay" onClick={() => setSelectedLog(null)}>
          <div className="chatModalBox" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalUserGroup">
                <div className="chatAvatar smallAvatar">
                  {selectedLog.initial}
                </div>
                <div>
                  <h3>{selectedLog.user}</h3>
                  <p>
                    {selectedLog.time} • v{selectedLog.version}
                  </p>
                </div>
              </div>
              <button
                className="closeModalBtn"
                onClick={() => setSelectedLog(null)}
              >
                <HiXMark size={22} />
              </button>
            </div>

            <div className="modalBody">
              <div className="messageBubble userMessage">
                <span className="bubbleLabel">Question</span>
                <p>{selectedLog.question}</p>
              </div>

              <div className="messageBubble botMessage">
                <div className="bubbleTop">
                  <span className="bubbleLabel">Bot Response</span>
                </div>
                <p>{selectedLog.response}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnknownLogsPage;
