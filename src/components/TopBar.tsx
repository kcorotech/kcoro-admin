import { useState, useRef, useEffect } from "react";
import { FaRegCircleUser, FaRepeat } from "react-icons/fa6";
import { HiArrowRightOnRectangle } from "react-icons/hi2";
import { useDispatch } from "react-redux";
import "../CSS/TopBar.css";
import myUog_logo from "../assets/myUog_logo.png";
import myVU_logo from "../assets/myVU_logo.png";
import { logoutUser } from "../redux/user/userSlice";

const ECOSYSTEM_APPS = [
  { id: "myuog", name: "MyUOG: GPA & Past Papers", uri: myUog_logo },
  { id: "myvustudy", name: "VU Study: VU Student App", uri: myVU_logo },
];

const CURRENT_APP_ID = "myuog";

const TopBar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

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

  const otherApps = ECOSYSTEM_APPS.filter((app) => app.id !== CURRENT_APP_ID);

  return (
    <header className="topBarContainer">
      <div className="topBarBrand">
        <img src={myUog_logo} alt="My UOG Logo" className="topBarLogo" />
        <div className="topBarBrandText">
          <span className="topBarTitle">MyUOG: GPA & Past Papers</span>
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
                    <div key={app.id} className="appLinkItem">
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

        <button type="button" className="topBarIconButton" title="Profile">
          <FaRegCircleUser size={20} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
