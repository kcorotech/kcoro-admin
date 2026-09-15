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

// --- GENERATE DUMMY DATA WITH CHAT HISTORY ---
const generateUsers = (count: number) => {
  const devices = [
    "Vivo X90",
    "iPhone 15 Pro",
    "Samsung S23 Ultra",
    "Pixel 8",
    "Oppo Reno 10",
  ];
  const names = ["Haider", "Ali", "Sara", "Zain", "Fatima", "Bilal", "Ayesha"];

  return Array.from({ length: count }, (_, i) => {
    // Generate dummy chat history for this user
    const chatHistory = Array.from(
      { length: Math.floor(Math.random() * 4) + 1 },
      (_, j) => ({
        id: `chat-${i}-${j}`,
        question: `How do I check my past paper for subject ${j + 1}?`,
        answer: `To check your past paper for subject ${j + 1}, navigate to the Dashboard and click on 'Past Papers'. Select your semester and subject from the dropdown.`,
      }),
    );

    return {
      id: `myuog${387730000 + i}`,
      name: names[i % names.length],
      initial: names[i % names.length].charAt(0),
      device: devices[i % devices.length],
      version: `1.0.${10 + (i % 8)}`,
      lastActive: `Sept ${Math.floor(Math.random() * 28) + 1}, 2026`,
      successLogs: Math.floor(Math.random() * 200),
      unknownLogs: Math.floor(Math.random() * 30),
      chatHistory,
    };
  });
};

const dummyUsers = generateUsers(45);

const UsersPage = () => {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null); // For sidebar
  const usersPerPage = 6;

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
    return dummyUsers.filter((user) => {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query) ||
        user.device.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  // --- PAGINATION LOGIC (Applied on Filtered Users) ---
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage) || 1;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
                  <th className="alignRight">Success Logs</th>
                  <th className="alignRight">Unknown Logs</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="clickableRow"
                    >
                      <td>
                        <div className="userInfo">
                          <div className="userAvatar">{user.initial}</div>
                          <div className="userDetails">
                            <span className="userName">{user.name}</span>
                            <span className="userId">{user.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="deviceText">{user.device}</td>
                      <td>
                        <span className="versionBadge">{user.version}</span>
                      </td>
                      <td className="dateText">{user.lastActive}</td>
                      <td className="alignRight successText">
                        {user.successLogs}
                      </td>
                      <td className="alignRight errorText">
                        {user.unknownLogs > 0 ? user.unknownLogs : "-"}
                      </td>
                    </tr>
                  ))
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
              currentUsers.map((user) => (
                <div
                  className="gridCard clickableCard"
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="cardTop">
                    <div className="userAvatar">{user.initial}</div>
                    <div className="cardUserInfo">
                      <span className="userName">{user.name}</span>
                      <span className="userId">{user.id}</span>
                    </div>
                  </div>

                  <div className="cardBody">
                    <div className="cardRow">
                      <span className="cardLabel">Device</span>
                      <span className="cardVal">{user.device}</span>
                    </div>
                    <div className="cardRow">
                      <span className="cardLabel">Version</span>
                      <span className="versionBadge">{user.version}</span>
                    </div>
                  </div>

                  <div className="cardFooter">
                    <div className="miniStat">
                      <span className="statLabel">Success</span>
                      <span className="successText">{user.successLogs}</span>
                    </div>
                    <div className="miniStat">
                      <span className="statLabel">Unknown</span>
                      <span className="errorText">{user.unknownLogs}</span>
                    </div>
                  </div>
                </div>
              ))
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
                <div className="userAvatar">{selectedUser.initial}</div>
                <div>
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.id}</p>
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

              {selectedUser.chatHistory.length > 0 ? (
                <div className="chatList">
                  {selectedUser.chatHistory.map((chat: any) => (
                    <div key={chat.id} className="chatExchange">
                      <div className="chatBubble userBubble">
                        <span className="bubbleLabel">User</span>
                        <p>{chat.question}</p>
                      </div>
                      <div className="chatBubble botBubble">
                        <span className="bubbleLabel">Bot</span>
                        <p>{chat.answer}</p>
                      </div>
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

export default UsersPage;
