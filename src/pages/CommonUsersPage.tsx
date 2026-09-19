import React, { useState, useMemo } from "react";
import {
  HiMiniListBullet,
  HiMiniSquares2X2,
  HiChevronLeft,
  HiChevronRight,
  HiMagnifyingGlass,
  HiXMark,
} from "react-icons/hi2";
import "../CSS/UsersPage.css";
import { useGetMyUogAppDataQuery } from "../redux/user/userApi";
import type { RootState } from "../redux/store";
import { useSelector } from "react-redux";

const CommonUsersPage = () => {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const usersPerPage = 6;

  const appId = useSelector((state: RootState) => state.user.currentAppId);

  const { data, isLoading } = useGetMyUogAppDataQuery(undefined, {
    skip: appId !== "myuog",
  });

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1000) setViewMode("grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- FILTER & INTERSECTION LOGIC ---
  const filteredUsers = useMemo(() => {
    const users = data?.users || [];
    const successLogs = data?.successLogs || [];
    const unknownLogs = data?.unknownLogs || [];

    const successCountMap: Record<string, number> = {};
    const unknownCountMap: Record<string, number> = {};

    successLogs.forEach((log: any) => {
      const id = log.Hardware_ID;
      if (id) successCountMap[id] = (successCountMap[id] || 0) + 1;
    });

    unknownLogs.forEach((log: any) => {
      const id = log.Hardware_ID;
      if (id) unknownCountMap[id] = (unknownCountMap[id] || 0) + 1;
    });

    return users
      .filter((user: any) => {
        const id = user.Hardware_ID;

        const hasBothLogs = successCountMap[id] > 0 && unknownCountMap[id] > 0;
        if (!hasBothLogs) return false;

        const query = searchQuery.toLowerCase().trim();

        const safeName = String(user.Name || "").toLowerCase();
        const safeId = String(id || "").toLowerCase();
        const safeDevice = String(user.Device_Model || "").toLowerCase();

        return (
          !query ||
          safeName.includes(query) ||
          safeId.includes(query) ||
          safeDevice.includes(query)
        );
      })
      .map((user: any) => ({
        ...user,
        successCount: successCountMap[user.Hardware_ID] || 0,
        unknownCount: unknownCountMap[user.Hardware_ID] || 0,
      }));
  }, [data, searchQuery]);

  const userChatHistory = useMemo(() => {
    if (!selectedUser) return [];

    const sLogs = (data?.successLogs || [])
      .filter((log: any) => log.Hardware_ID === selectedUser.Hardware_ID)
      .map((log: any) => ({ ...log, isUnknown: false }));

    const uLogs = (data?.unknownLogs || [])
      .filter((log: any) => log.Hardware_ID === selectedUser.Hardware_ID)
      .map((log: any) => ({ ...log, isUnknown: true }));

    return [...sLogs, ...uLogs];
  }, [selectedUser, data]);

  // --- SAFE PAGINATION LOGIC ---
  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const indexOfLastUser = safePage * usersPerPage;
  const indexOfFirstUser = Math.max(0, indexOfLastUser - usersPerPage);
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  if (isLoading) {
    return <div className="loadingState">Loading common users...</div>;
  }

  return (
    <div className="usersPageContainer">
      <div className="usersHeaderArea">
        <div className="titleGroup">
          <h2 className="pageTitle">Common Users</h2>
          <div className="totalBadge">{totalUsers} Users</div>
        </div>

        <div className="headerActions">
          <div className="searchBox">
            <HiMagnifyingGlass className="searchIcon" size={18} />
            <input
              type="text"
              placeholder="Search by ID, Name, or Device..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="viewToggleGroup">
            <button
              className={`viewBtn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <HiMiniListBullet size={18} />
            </button>
            <button
              className={`viewBtn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <HiMiniSquares2X2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="tableWrapperCard">
          <div className="tableScrollArea">
            <table className="premiumTable">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Device</th>
                  <th>Version</th>
                  <th>Last Active</th>
                  <th className="alignRight">Success Logs</th>
                  <th className="alignRight">Unknown Logs</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <tr
                      key={`${user.Hardware_ID}-${index}`}
                      onClick={() => setSelectedUser(user)}
                      className="clickableRow"
                    >
                      <td>
                        <div className="userInfo">
                          <div className="userAvatar">
                            {user.Name
                              ? user.Name.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                          <div className="userDetails">
                            <span className="userName">
                              {user.Name || "Student"}
                            </span>
                            <span className="userId">{user.Hardware_ID}</span>
                          </div>
                        </div>
                      </td>
                      <td className="deviceText">{user.Device_Model}</td>
                      <td>
                        <span className="versionBadge">
                          v{user.App_Version}
                        </span>
                      </td>
                      <td className="dateText">
                        {user.Last_Seen || user.Timestamp}
                      </td>
                      <td className="alignRight successText">
                        {user.successCount}
                      </td>
                      <td className="alignRight errorText">
                        {user.unknownCount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="emptyState">
                      No common users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalUsers > 0 && (
            <PaginationFooter
              start={indexOfFirstUser + 1}
              end={Math.min(indexOfLastUser, totalUsers)}
              total={totalUsers}
              currentPage={safePage}
              totalPages={totalPages}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          )}
        </div>
      ) : (
        <div className="gridFlow">
          <div className="gridWrapper">
            {currentUsers.length > 0 ? (
              currentUsers.map((user, index) => (
                <div
                  className="gridCard clickableCard"
                  key={`${user.Hardware_ID}-${index}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="cardTop">
                    <div className="userAvatar">
                      {user.Name ? user.Name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="cardUserInfo">
                      <span className="userName">{user.Name || "Student"}</span>
                      <span className="userId">{user.Hardware_ID}</span>
                    </div>
                  </div>

                  <div className="cardBody">
                    <div className="cardRow">
                      <span className="cardLabel">Device</span>
                      <span className="cardVal">{user.Device_Model}</span>
                    </div>
                    <div className="cardRow">
                      <span className="cardLabel">Version</span>
                      <span className="versionBadge">v{user.App_Version}</span>
                    </div>
                  </div>

                  <div className="cardFooter">
                    <div className="miniStat">
                      <span className="statLabel">Success</span>
                      <span className="successText">{user.successCount}</span>
                    </div>
                    <div className="miniStat">
                      <span className="statLabel">Unknown</span>
                      <span className="errorText">{user.unknownCount}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="emptyState">No common users found.</div>
            )}
          </div>

          {totalUsers > 0 && (
            <div className="gridPaginationWrapper">
              <PaginationFooter
                start={indexOfFirstUser + 1}
                end={Math.min(indexOfLastUser, totalUsers)}
                total={totalUsers}
                currentPage={safePage}
                totalPages={totalPages}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="sidebarOverlay" onClick={() => setSelectedUser(null)}>
          <div className="sidebarPanel" onClick={(e) => e.stopPropagation()}>
            <div className="sidebarHeader">
              <div className="sidebarUserInfo">
                <div className="userAvatar">
                  {selectedUser.Name
                    ? selectedUser.Name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div>
                  <h3>{selectedUser.Name || "Student"}</h3>
                  <p>{selectedUser.Hardware_ID}</p>
                </div>
              </div>
              <button
                className="closeSidebarBtn"
                onClick={() => setSelectedUser(null)}
              >
                <HiXMark size={24} />
              </button>
            </div>

            <div className="sidebarContent">
              <h4 className="chatSectionTitle">Combined Interaction History</h4>

              {userChatHistory.length > 0 ? (
                <div className="chatList">
                  {userChatHistory.map((chat: any, index: number) => (
                    <div key={index} className="chatExchange">
                      <div className="chatBubble userBubble">
                        <span className="bubbleLabel">
                          User ({chat.Timestamp})
                        </span>
                        <p>{chat.Question}</p>
                      </div>

                      {chat.isUnknown ? (
                        <div
                          className="chatBubble botBubble"
                          style={{ background: "rgba(244, 63, 94, 0.1)" }}
                        >
                          <span
                            className="bubbleLabel"
                            style={{ color: "#f43f5e" }}
                          >
                            Unknown / Unanswered
                          </span>
                          <p style={{ color: "#f43f5e", fontStyle: "italic" }}>
                            {chat.comments
                              ? `Admin Note: ${chat.comments}`
                              : "No bot response available."}
                          </p>
                        </div>
                      ) : (
                        <div className="chatBubble botBubble">
                          <span className="bubbleLabel">
                            Bot ({chat.Validation})
                          </span>
                          <p>{chat.Bot_Response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emptyState">
                  No logs available for this user.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaginationFooter = ({
  start,
  end,
  total,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: any) => (
  <div className="paginationBar">
    <p className="pageText">
      Showing <span>{start}</span> to <span>{end}</span> of <span>{total}</span>{" "}
      users
    </p>
    <div className="pageControls">
      <button className="pageBtn" onClick={onPrev} disabled={currentPage === 1}>
        <HiChevronLeft size={16} />
      </button>
      <span className="pageNumber">
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="pageBtn"
        onClick={onNext}
        disabled={currentPage === totalPages}
      >
        <HiChevronRight size={16} />
      </button>
    </div>
  </div>
);

export default CommonUsersPage;
