import "../CSS/NavBar.css";

interface NavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  "Dashboard",
  "Users",
  "Success Logs",
  "Unknown Logs",
  "Exam Not Found",
  "Common Users",
];

export const NavBar = ({ activeTab, setActiveTab }: NavBarProps) => {
  return (
    <nav className="navBarWrapper">
      <ul className="itemContainer">
        {tabs.map((tab) => (
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
