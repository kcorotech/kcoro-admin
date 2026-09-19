import { useState, useMemo } from "react";
import {
  HiMagnifyingGlass,
  HiXMark,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";
import "../CSS/SuccessLogsPage.css";
import type { RootState } from "../redux/store";
import { useSelector } from "react-redux";
import { useGetMyUogAppDataQuery } from "../redux/user/userApi";

// Helper to reliably parse "29/may/2026 2:33 pm" into milliseconds
const parseLogTimestamp = (dateStr: string): number => {
  if (!dateStr) return 0;
  try {
    if (dateStr.includes("T")) {
      const parsedIso = new Date(dateStr).getTime();
      if (!isNaN(parsedIso)) return parsedIso;
    }

    const clean = dateStr.replace(/'/g, "").trim().toLowerCase();
    const parts = clean.split(" ");
    if (parts.length < 2) return new Date(clean).getTime() || 0;

    const [dayStr, monthStr, yearStr] = parts[0].split("/");
    const timeParts = parts[1].split(":");
    let hours = parseInt(timeParts[0], 10) || 0;
    const minutes = parseInt(timeParts[1], 10) || 0;
    const modifier = parts[2]; // "am" or "pm"

    if (modifier === "pm" && hours < 12) hours += 12;
    if (modifier === "am" && hours === 12) hours = 0;

    const months: Record<string, number> = {
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

    const month = months[monthStr] ?? 0;
    const day = parseInt(dayStr, 10) || 1;
    const year = parseInt(yearStr, 10) || 2026;

    return new Date(year, month, day, hours, minutes).getTime();
  } catch {
    return 0;
  }
};

const normalizeValidation = (raw: string): string => {
  const val = (raw || "").toLowerCase().trim();
  if (val.includes("fixed")) return "Fixed Later";
  if (val.includes("correct")) return "Correct";
  if (
    val.includes("not found") ||
    val.includes("not-found") ||
    val.includes("wrong")
  )
    return "Not found";
  if (val === "later" || val.includes("review it later")) return "Later";
  if (val.includes("review")) return "Review";
  return "Review"; // default untriaged logs
};

const SuccessLogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const logsPerPage = 12;

  const appId = useSelector((state: RootState) => state.user.currentAppId);

  const { data } = useGetMyUogAppDataQuery(undefined, {
    skip: appId !== "myuog",
  });

  const STATUS_TABS = [
    "All",
    "Correct",
    "Review",
    "Fixed Later",
    "Not found",
    "Later",
  ];

  // --- FILTER & SORT LOGIC ---
  const filteredLogs = useMemo(() => {
    const rawLogs = data?.successLogs || [];

    const sortedLogs = [...rawLogs].sort(
      (a: any, b: any) =>
        parseLogTimestamp(b.Timestamp) - parseLogTimestamp(a.Timestamp),
    );

    return sortedLogs.filter((log: any) => {
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        (log.Name || "").toLowerCase().includes(query) ||
        (log.Question || "").toLowerCase().includes(query) ||
        (log.Bot_Response || "").toLowerCase().includes(query) ||
        (log.App_Version || "").includes(query);

      const category = normalizeValidation(log.Validation);
      const matchesStatus = activeTab === "All" || category === activeTab;

      return matchesSearch && matchesStatus;
    });
  }, [data?.successLogs, searchQuery, activeTab]);

  // --- SAFE PAGINATION LOGIC ---
  const totalLogs = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / logsPerPage));
  const safePage = Math.min(currentPage, totalPages); // Prevents blank page drift
  const indexOfLastLog = safePage * logsPerPage;
  const indexOfFirstLog = Math.max(0, indexOfLastLog - logsPerPage);
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  const getStatusClass = (status: string) => {
    const category = normalizeValidation(status);
    switch (category) {
      case "Correct":
        return "status-correct";
      case "Review":
        return "status-review";
      case "Fixed Later":
        return "status-fixed";
      case "Later":
        return "status-later";
      case "Not found":
        return "status-error";
      default:
        return "status-default";
    }
  };

  return (
    <div className="chatLayoutContainer">
      <div className="chatHeader">
        <div className="titleRow">
          <h2 className="pageTitle">Success Logs</h2>
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="chatTabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              className={`chatTabBtn ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="chatMainBox">
        <div className="chatList">
          {currentLogs.length > 0 ? (
            currentLogs.map((log: any, index: number) => (
              <div
                className="chatRow"
                key={`${log.Hardware_ID}-${log.Timestamp}-${indexOfFirstLog + index}`}
                onClick={() => setSelectedLog(log)}
              >
                <div className="chatAvatar">
                  {log.Name ? log.Name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="chatContent">
                  <div className="chatContentTop">
                    <span className="chatUserName">
                      {log.Name || "Student"}
                    </span>
                    <span className="chatTime">{log.Timestamp}</span>
                  </div>

                  <div className="chatContentMiddle">
                    <span className="chatVersion">v{log.App_Version}</span>
                    <span className="chatQuestion">{log.Question}</span>
                  </div>

                  <div className="chatContentBottom">
                    <p className="chatResponseSnippet">{log.Bot_Response}</p>
                  </div>
                </div>
                <div className="chatRightAction">
                  <span
                    className={`chatBadge ${getStatusClass(log.Validation)}`}
                  >
                    {normalizeValidation(log.Validation)}
                  </span>
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
                disabled={safePage === 1}
              >
                <HiChevronLeft size={16} />
              </button>
              <button
                className="pageBtn"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={safePage === totalPages}
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
                  {selectedLog.Name
                    ? selectedLog.Name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div>
                  <h3>{selectedLog.Name || "Student"}</h3>
                  <p>
                    {selectedLog.Timestamp} • v{selectedLog.App_Version}
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
                <p>{selectedLog.Question}</p>
              </div>

              <div className="messageBubble botMessage">
                <div className="bubbleTop">
                  <span className="bubbleLabel">Bot Response</span>
                  <span
                    className={`chatBadge ${getStatusClass(selectedLog.Validation)}`}
                  >
                    {normalizeValidation(selectedLog.Validation)}
                  </span>
                </div>
                <p>{selectedLog.Bot_Response}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessLogsPage;
