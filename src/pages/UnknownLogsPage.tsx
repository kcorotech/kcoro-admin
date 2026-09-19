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

// Helper to reliably parse your dates into milliseconds for perfect sorting
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
    const modifier = parts[2];

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

const UnknownLogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const logsPerPage = 12;

  const appId = useSelector((state: RootState) => state.user.currentAppId);

  const { data } = useGetMyUogAppDataQuery(undefined, {
    skip: appId !== "myuog",
  });

  // --- FILTER & SORT LOGIC ---
  const filteredLogs = useMemo(() => {
    const rawLogs = data?.unknownLogs || [];

    const sortedLogs = [...rawLogs].sort(
      (a: any, b: any) =>
        parseLogTimestamp(b?.Timestamp) - parseLogTimestamp(a?.Timestamp),
    );

    return sortedLogs.filter((log: any) => {
      const query = searchQuery.toLowerCase().trim();

      const safeName = String(log?.Name || "").toLowerCase();
      const safeQuestion = String(log?.Question || "").toLowerCase();
      const safeVersion = String(log?.App_Version || "").toLowerCase();

      return (
        !query ||
        safeName.includes(query) ||
        safeQuestion.includes(query) ||
        safeVersion.includes(query)
      );
    });
  }, [data?.unknownLogs, searchQuery]);

  // --- SAFE PAGINATION LOGIC ---
  const totalLogs = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / logsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const indexOfLastLog = safePage * logsPerPage;
  const indexOfFirstLog = Math.max(0, indexOfLastLog - logsPerPage);
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="chatMainBox">
        <div className="chatList">
          {currentLogs.length > 0 ? (
            currentLogs.map((log: any, index: number) => (
              <div
                className="chatRow"
                key={`${log?.Hardware_ID || "unknown"}-${index}`}
                onClick={() => setSelectedLog(log)}
              >
                <div className="chatAvatar">
                  {log?.Name ? log.Name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="chatContent">
                  <div className="chatContentTop">
                    <span className="chatUserName">
                      {log?.Name || "Student"}
                    </span>
                    <span className="chatTime">
                      {log?.Timestamp || "Unknown Time"}
                    </span>
                  </div>

                  <div className="chatContentMiddle">
                    <span className="chatVersion">
                      v{log?.App_Version || "Unknown"}
                    </span>
                    <span className="chatQuestion">
                      {log?.Question || "No Question Provided"}
                    </span>
                  </div>

                  {log?.comments && (
                    <div className="chatContentBottom">
                      <p
                        className="chatResponseSnippet"
                        style={{ color: "#f59e0b", fontStyle: "italic" }}
                      >
                        Note: {log.comments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="chatEmptyState">
              No unknown logs match your search.
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
                  {selectedLog?.Name
                    ? selectedLog.Name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div>
                  <h3>{selectedLog?.Name || "Student"}</h3>
                  <p>
                    {selectedLog?.Timestamp || "Unknown Time"} • v
                    {selectedLog?.App_Version || "Unknown"}
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
                <span className="bubbleLabel">Unanswered Question</span>
                <p>{selectedLog?.Question || "No Question Provided"}</p>
              </div>

              {selectedLog?.comments && (
                <div
                  className="messageBubble botMessage"
                  style={{ background: "rgba(245, 158, 11, 0.1)" }}
                >
                  <div className="bubbleTop">
                    <span className="bubbleLabel" style={{ color: "#f59e0b" }}>
                      Admin Note
                    </span>
                  </div>
                  <p style={{ color: "#f59e0b" }}>{selectedLog.comments}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnknownLogsPage;
