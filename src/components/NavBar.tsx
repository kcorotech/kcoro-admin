import "../CSS/NavBar.css";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { useEffect } from "react";

interface NavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const allTabs = [
  "Dashboard",
  "Users",
  "Success Logs",
  "Unknown Logs",
  "Exam Not Found",
  "Common Users",
];

export const NavBar = ({ activeTab, setActiveTab }: NavBarProps) => {
  const appId = useSelector((state: RootState) => state.user.currentAppId);

  const visibleTabs = appId === "myvustudy" ? ["Dashboard", "Users"] : allTabs;

  useEffect(() => {
    setActiveTab("Dashboard");
  }, [appId]);

  return (
    <nav className="navBarWrapper">
      <ul className="itemContainer">
        {visibleTabs.map((tab) => (
          <li
            key={tab}
            className={`navItem ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </li>
        ))}
      </ul>
    </nav>
  );
};
