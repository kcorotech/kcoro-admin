import { useState, useRef, useEffect } from "react";
import { FaRegCircleUser, FaRepeat } from "react-icons/fa6";
import { HiArrowRightOnRectangle } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import "../CSS/TopBar.css";
import myUog_logo from "../assets/myUog_logo.png";
import myVU_logo from "../assets/myVU_logo.png";
import { logoutUser, setCurrentApp } from "../redux/user/userSlice";
import type { RootState } from "../redux/store";
import { CURRENT_APP_ID } from "../utils/Keys";
import { FaSyncAlt } from "react-icons/fa";
import {
  useGetMyUogAppDataQuery,
  useGetMyVUStudyAppDataQuery,
} from "../redux/user/userApi";

const ECOSYSTEM_APPS = [
  { id: "myuog", name: "MyUOG: GPA & Past Papers", uri: myUog_logo },
  { id: "myvustudy", name: "VU Study: VU Student App", uri: myVU_logo },
];

const TopBar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const currentAppId =
    useSelector((state: RootState) => state.user.currentAppId) ||
    localStorage.getItem(CURRENT_APP_ID) ||
    "myuog";

  const { refetch: reloadUOG, isFetching: isFetchingUOG } =
    useGetMyUogAppDataQuery(undefined, {
      skip: currentAppId !== "myuog",
    });

  const { refetch: reloadVU, isFetching: isFetchingVU } =
    useGetMyVUStudyAppDataQuery(undefined, {
      skip: currentAppId !== "myvustudy",
    });

  const isRefreshing = currentAppId === "myuog" ? isFetchingUOG : isFetchingVU;

  const currentApp =
    ECOSYSTEM_APPS.find((app) => app.id === currentAppId) || ECOSYSTEM_APPS[0];
  const otherApps = ECOSYSTEM_APPS.filter((app) => app.id !== currentAppId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleAppSwitch = (appId: string) => {
    localStorage.setItem(CURRENT_APP_ID, appId);
    dispatch(setCurrentApp(appId));
    setIsProfileOpen(false);
  };

  return (
    <header className="topBarContainer">
      <div className="topBarBrand">
        <img
          src={currentApp.uri}
          alt={`${currentApp.name} Logo`}
          className="topBarLogo"
        />
        <div className="topBarBrandText">
          <span className="topBarTitle">{currentApp.name}</span>
        </div>
      </div>

      <div className="topBarActions">
        <div className="profileDropdownWrapper" ref={dropdownRef}>
          <button
            type="button"
            className={`topBarIconButton ${isProfileOpen ? "active" : ""}`}
            title="Switch Project"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <FaRepeat size={18} />
          </button>

          {isProfileOpen && (
            <div className="profileDropdownMenu">
              <div className="dropdownHeader">
                <p className="dropdownUserName">Kcoro Admin</p>
                <p className="dropdownUserEmail">Other apps</p>
              </div>

              <div className="dropdownSection">
                <div className="appList">
                  {otherApps.map((app) => (
                    <div
                      key={app.id}
                      className="appLinkItem"
                      onClick={() => handleAppSwitch(app.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={app.uri}
                        alt="app_logo"
                        className="appLinkIcon"
                      />
                      <span className="appNameFont">{app.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dropdownFooter">
                <button className="logoutBtn" onClick={handleLogout}>
                  <HiArrowRightOnRectangle size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="topBarIconButton"
          title="Refresh Data"
          onClick={() => {
            if (currentAppId === "myuog") {
              reloadUOG();
            } else {
              reloadVU();
            }
          }}
        >
         <FaSyncAlt size={20} className={isRefreshing ? "spin-animation" : ""} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
