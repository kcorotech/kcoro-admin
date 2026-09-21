import { HiMiniUsers, HiMiniCalendarDays, HiMiniBolt } from "react-icons/hi2";
import { FaMobileAlt } from "react-icons/fa";
import { BiGitBranch } from "react-icons/bi";
import "../CSS/DashBoardPage.css";
import { useGetMyUogAppDataQuery, useGetMyVUStudyAppDataQuery } from "../redux/user/userApi";
import type { RootState } from "../redux/store";
import { useSelector } from "react-redux";
import { useMemo } from "react";

const DashboardPage = () => {
  const appId = useSelector((state: RootState) => state.user.currentAppId);

  const { data } = useGetMyUogAppDataQuery(undefined, {
    skip: appId !== "myuog",
  });

   const { data: VuStudyData } = useGetMyVUStudyAppDataQuery(undefined, {
    skip: appId !== "myvustudy",
  });

  const {
    totalUsers,
    dailyActive,
    monthlyActive,
    currentMonthDay,
    currentHour,
    versionData,
    deviceData,
  } = useMemo(() => {
      const users = (appId === "myuog" ? data?.users : VuStudyData?.users) || [];

    if (users.length === 0) {
      return {
        totalUsers: 0,
        dailyActive: 0,
        monthlyActive: 0,
        currentMonthDay: 1,
        currentHour: 0,
        versionData: [],
        deviceData: [],
      };
    }

    const now = new Date();
    const nowMs = now.getTime();
    const currentDay = now.getDate();
    const currentHour = now.getHours();

    const startOfCurrentMonthMs = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();

    const oneDayInMs = 24 * 60 * 60 * 1000;

    let dailyCount = 0;
    let monthlyCount = 0;

    const versionCountMap: Record<string, number> = {};
    const deviceCountMap: Record<string, number> = {};

    users.forEach((user: any) => {
      const dateString = user.Last_Seen || user.Timestamp || user.last_seen_at || user.updated_at;

      if (dateString) {
        const lastSeenMs = new Date(dateString).getTime();

        if (nowMs - lastSeenMs <= oneDayInMs) {
          dailyCount++;
        }

        if (lastSeenMs >= startOfCurrentMonthMs) {
          monthlyCount++;
        }
      }

      const version = user.App_Version || user.app_version || "Unknown";
      versionCountMap[version] = (versionCountMap[version] || 0) + 1;

      const device = user.Device_Model || user.device_model || "Unknown";
      deviceCountMap[device] = (deviceCountMap[device] || 0) + 1;
    });

    const total = users.length;

    const formattedVersionData = Object.entries(versionCountMap)
      .map(([version, count]) => ({
        version: version.startsWith("v") ? version : `v${version}`,
        users: count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 7);

    const formattedDeviceData = Object.entries(deviceCountMap)
      .map(([name, count]) => ({
        name,
        users: count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 8);

    return {
      totalUsers: users.length,
      dailyActive: dailyCount,
      monthlyActive: monthlyCount,
      currentMonthDay: currentDay,
      currentHour: currentHour,
      versionData: formattedVersionData,
      deviceData: formattedDeviceData,
    };
  }, [data?.users, VuStudyData?.users, appId]);

  return (
    <div className="dashboardContainer">
      <div className="statBox">
        <div className="statHeader">
          <p className="statTitle">Total Users</p>
          <div className="iconWrapper">
            <HiMiniUsers size={18} />
          </div>
        </div>
        <p className="statValue">{totalUsers}</p>
      </div>

      <div className="statBox">
        <div className="statHeader">
          <p className="statTitle">Monthly Active (Day {currentMonthDay})</p>
          <div className="iconWrapper">
            <HiMiniCalendarDays size={18} />
          </div>
        </div>
        <p className="statValue">{monthlyActive}</p>
      </div>

      <div className="statBox">
        <div className="statHeader">
          <p className="statTitle">Daily Active ({currentHour}/24h)</p>
          <div className="iconWrapper">
            <HiMiniBolt size={18} />
          </div>
        </div>
        <p className="statValue">{dailyActive}</p>
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
