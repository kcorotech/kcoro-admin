import { HiMiniUsers, HiMiniCalendarDays, HiMiniBolt } from "react-icons/hi2";
import { FaMobileAlt } from "react-icons/fa";
import { BiGitBranch } from "react-icons/bi";
import "../CSS/DashBoardPage.css";

// --- DUMMY DATA ---
const versionData = [
  { version: "v2.4.1", users: 850, percent: 56 },
  { version: "v2.4.0", users: 320, percent: 21 },
  { version: "v2.3.5", users: 150, percent: 10 },
  { version: "v2.3.0", users: 90, percent: 6 },
  { version: "v2.0.1", users: 50, percent: 3 },
  { version: "v1.9.0", users: 30, percent: 2 },
  { version: "v1.8.5", users: 10, percent: 1 },
];

const deviceData = [
  { name: "iPhone 15 Pro", users: 450, percent: 30 },
  { name: "iPhone 13", users: 320, percent: 21 },
  { name: "Samsung Galaxy S23", users: 280, percent: 18 },
  { name: "iPhone 14 Pro Max", users: 210, percent: 14 },
  { name: "Google Pixel 8", users: 150, percent: 10 },
  { name: "Samsung Galaxy A54", users: 90, percent: 6 },
  { name: "Xiaomi 13 Pro", users: 60, percent: 4 },
  { name: "OnePlus 11", users: 40, percent: 2 },
];

const DashboardPage = () => {
  return (
    <div className="dashboardContainer">
      <div className="statBox">
        <div className="statHeader">
          <p className="statTitle">Total Users</p>
          <div className="iconWrapper">
            <HiMiniUsers size={18} />
          </div>
        </div>
        <p className="statValue">1,500</p>
      </div>

      <div className="statBox">
        <div className="statHeader">
          <p className="statTitle">Monthly Active</p>
          <div className="iconWrapper">
            <HiMiniCalendarDays size={18} />
          </div>
        </div>
        <p className="statValue">200</p>
      </div>

      <div className="statBox">
        <div className="statHeader">
          <p className="statTitle">Daily Active</p>
          <div className="iconWrapper">
            <HiMiniBolt size={18} />
          </div>
        </div>
        <p className="statValue">10</p>
      </div>
      <div className="chartBox versionBox">
        <div className="chartHeader">
          <BiGitBranch className="chartIcon" size={18} />
          <p>Users by Version</p>
        </div>
        <div className="dataListContainer">
          {versionData.map((item, index) => (
            <div className="dataListItem" key={index}>
              <span className="dataLabel">{item.version}</span>
              <div className="dataTrack">
                <div
                  className="dataProgress"
                  style={{ width: `${item.percent}%` }}
                ></div>
              </div>
              <span className="dataValue">{item.users}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chartBox deviceBox">
        <div className="chartHeader">
          <FaMobileAlt className="chartIcon" size={16} />
          <p>Mobile Devices</p>
        </div>
        <div className="dataListContainer">
          {deviceData.map((item, index) => (
            <div className="dataListItem" key={index}>
              <span className="dataLabel">{item.name}</span>
              <div className="dataTrack">
                <div
                  className="dataProgress"
                  style={{ width: `${item.percent}%` }}
                ></div>
              </div>
              <span className="dataValue">{item.users}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
