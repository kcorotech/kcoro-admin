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
import {
  useGetMyUogAppDataQuery,
  useGetMyVUStudyAppDataQuery,
} from "../redux/user/userApi";
import type { RootState } from "../redux/store";
import { useSelector } from "react-redux";
import type { USERS, VUSTUDY_USERS } from "../redux/user/type";

type UnifiedUser = Partial<USERS & VUSTUDY_USERS>;

const UsersPage = () => {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const usersPerPage = 6;

  const appId = useSelector((state: RootState) => state.user.currentAppId);
  const isMyUog = appId === "myuog";

  const { data: uogData } = useGetMyUogAppDataQuery(undefined, {
    skip: !isMyUog,
  });

  const { data: vuData } = useGetMyVUStudyAppDataQuery(undefined, {
    skip: isMyUog,
  });

  const activeData = isMyUog ? uogData : vuData;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1000) {
        setViewMode("grid");
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredUsers = useMemo(() => {
    const users = activeData?.users || [];
    return users.filter((user) => {
      const u = user as UnifiedUser;
      const query = searchQuery.toLowerCase();
      const name = (u.Name || u.username || "").toLowerCase();
      const hardwareId = (
        u.Hardware_ID ||
        u.user_id ||
        u.device_id ||
        ""
      ).toLowerCase();
      const deviceModel = (
        u.Device_Model ||
        u.device_model ||
        ""
      ).toLowerCase();

      return (
        name.includes(query) ||
        hardwareId.includes(query) ||
        deviceModel.includes(query)
      );
    });
  }, [searchQuery, activeData?.users]);

  const logCounts = useMemo(() => {
    const successCountMap: Record<string, number> = {};
    const unknownCountMap: Record<string, number> = {};

    if (isMyUog && uogData) {
      uogData.successLogs?.forEach((log: any) => {
        const id = log.Hardware_ID;
        if (id) successCountMap[id] = (successCountMap[id] || 0) + 1;
      });

      uogData.unknownLogs?.forEach((log: any) => {
        const id = log.Hardware_ID;
        if (id) unknownCountMap[id] = (unknownCountMap[id] || 0) + 1;
      });
    }

    return { successCountMap, unknownCountMap };
  }, [isMyUog, uogData]);

  const userChatHistory = useMemo(() => {
    if (!selectedUser || !isMyUog || !uogData?.successLogs) return [];

    return uogData.successLogs
      .filter((log: any) => log.Hardware_ID === selectedUser.Hardware_ID)
      .reverse();
  }, [selectedUser, isMyUog, uogData]);

  // --- PAGINATION LOGIC ---
  const totalUsers = filteredUsers?.length || 0;
  const totalPages = Math.ceil(totalUsers / usersPerPage) || 1;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <div className="usersPageContainer">
      <div className="usersHeaderArea">
        <div className="titleGroup">
          <h2 className="pageTitle">Users</h2>
          <div className="totalBadge">{totalUsers} Total</div>
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
                  {isMyUog ? (
                    <>
                      <th className="alignRight">Success Logs</th>
                      <th className="alignRight">Unknown Logs</th>
                    </>
                  ) : (
                    <>
                      <th className="alignRight">Platform</th>
                      <th className="alignRight">Brand</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((rawUser) => {
                    const user = rawUser as UnifiedUser; // Type safe extraction
                    const hardwareId =
                      user.Hardware_ID ||
                      user.user_id ||
                      user.device_id ||
                      "Unknown_ID";
                    const name = user.Name || user.username || "Student";
                    const deviceModel =
                      user.Device_Model || user.device_model || "Unknown";
                    const appVersion =
                      user.App_Version || user.app_version || "Unknown";
                    const lastSeen =
                      user.Last_Seen ||
                      user.last_seen_at ||
                      user.updated_at ||
                      user.Timestamp ||
                      "Unknown";
                    const platform = user.Platform || user.platform || "-";
                    const brand = user.brand || "-";

                    return (
                      <tr
                        key={hardwareId}
                        onClick={() => isMyUog && setSelectedUser(user)}
                        className={isMyUog ? "clickableRow" : ""}
                        style={{ cursor: isMyUog ? "pointer" : "default" }}
                      >
                        <td>
                          <div className="userInfo">
                            <div className="userAvatar">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="userDetails">
                              <span className="userName">{name}</span>
                              <span className="userId">{hardwareId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="deviceText">{deviceModel}</td>
                        <td>
                          <span className="versionBadge">{appVersion}</span>
                        </td>
                        <td className="dateText">{lastSeen}</td>
                        {isMyUog ? (
                          <>
                            <td className="alignRight successText">
                              {logCounts.successCountMap[hardwareId] || 0}
                            </td>
                            <td className="alignRight errorText">
                              {logCounts.unknownCountMap[hardwareId] > 0
                                ? logCounts.unknownCountMap[hardwareId]
                                : "-"}
                            </td>
                          </>
                        ) : (
                          <>
                            <td
                              className="alignRight"
                              style={{ textTransform: "capitalize" }}
                            >
                              {platform}
                            </td>
                            <td
                              className="alignRight"
                              style={{ textTransform: "capitalize" }}
                            >
                              {brand}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="emptyState">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationFooter
            start={totalUsers === 0 ? 0 : indexOfFirstUser + 1}
            end={Math.min(indexOfLastUser, totalUsers)}
            total={totalUsers}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </div>
      ) : (
        <div className="gridFlow">
          <div className="gridWrapper">
            {currentUsers.length > 0 ? (
              currentUsers.map((rawUser) => {
                const user = rawUser as UnifiedUser; // Type safe extraction
                const hardwareId =
                  user.Hardware_ID ||
                  user.user_id ||
                  user.device_id ||
                  "Unknown_ID";
                const name = user.Name || user.username || "Student";
                const deviceModel =
                  user.Device_Model || user.device_model || "Unknown";
                const appVersion =
                  user.App_Version || user.app_version || "Unknown";
                const platform = user.Platform || user.platform || "-";
                const brand = user.brand || "-";

                return (
                  <div
                    className={`gridCard ${isMyUog ? "clickableCard" : ""}`}
                    style={{ cursor: isMyUog ? "pointer" : "default" }}
                    key={hardwareId}
                    onClick={() => isMyUog && setSelectedUser(user)}
                  >
                    <div className="cardTop">
                      <div className="userAvatar">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="cardUserInfo">
                        <span className="userName">{name}</span>
                        <span className="userId">{hardwareId}</span>
                      </div>
                    </div>

                    <div className="cardBody">
                      <div className="cardRow">
                        <span className="cardLabel">Device</span>
                        <span className="cardVal">{deviceModel}</span>
                      </div>
                      <div className="cardRow">
                        <span className="cardLabel">Version</span>
                        <span className="versionBadge">{appVersion}</span>
                      </div>
                    </div>

                    <div className="cardFooter">
                      {isMyUog ? (
                        <>
                          <div className="miniStat">
                            <span className="statLabel">Success</span>
                            <span className="successText">
                              {logCounts.successCountMap[hardwareId] || 0}
                            </span>
                          </div>
                          <div className="miniStat">
                            <span className="statLabel">Unknown</span>
                            <span className="errorText">
                              {logCounts.unknownCountMap[hardwareId] > 0
                                ? logCounts.unknownCountMap[hardwareId]
                                : "-"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="miniStat">
                            <span className="statLabel">Platform</span>
                            <span
                              style={{
                                textTransform: "capitalize",
                                fontWeight: 600,
                              }}
                            >
                              {platform}
                            </span>
                          </div>
                          <div className="miniStat">
                            <span className="statLabel">Brand</span>
                            <span
                              style={{
                                textTransform: "capitalize",
                                fontWeight: 600,
                              }}
                            >
                              {brand}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="emptyState">No users found.</div>
            )}
          </div>

          <div className="gridPaginationWrapper">
            <PaginationFooter
              start={totalUsers === 0 ? 0 : indexOfFirstUser + 1}
              end={Math.min(indexOfLastUser, totalUsers)}
              total={totalUsers}
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="sidebarOverlay" onClick={() => setSelectedUser(null)}>
          <div className="sidebarPanel" onClick={(e) => e.stopPropagation()}>
            <div className="sidebarHeader">
              <div className="sidebarUserInfo">
                <div className="userAvatar">
                  {(selectedUser.Name || selectedUser.username || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <h3>
                    {selectedUser.Name || selectedUser.username || "Student"}
                  </h3>
                  <p>
                    {selectedUser.Hardware_ID ||
                      selectedUser.user_id ||
                      selectedUser.device_id}
                  </p>
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
              <h4 className="chatSectionTitle">Interaction History</h4>

              {userChatHistory.length > 0 ? (
                <div className="chatList">
                  {userChatHistory.map((chat: any, index: number) => {
                    const question = chat.Question || chat.question || "";
                    const botResponse =
                      chat.Bot_Response || chat.bot_response || "";

                    return (
                      <div key={index} className="chatExchange">
                        <div className="chatBubble userBubble">
                          <span className="bubbleLabel">User</span>
                          <p>{question}</p>
                        </div>
                        <div className="chatBubble botBubble">
                          <span className="bubbleLabel">Bot</span>
                          <p>{botResponse}</p>
                        </div>
                      </div>
                    );
                  })}
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

export default UsersPage;
