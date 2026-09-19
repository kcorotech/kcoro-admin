import { useState } from "react";
import { NavBar } from "../components/NavBar";
import TopBar from "../components/TopBar";
import DashboardPage from "./DashboardPage";
import UsersPage from "./UsersPage";
import SuccessLogsPage from "./SuccessLogsPage";
import UnknownLogsPage from "./UnknownLogsPage";
import ExamNotFoundPage from "./ExamNotFoundPage";
import CommonUsersPage from "./CommonUsersPage";
import { useGetMyUogAppDataQuery } from "../redux/user/userApi";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";

const MainPage = () => {
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const appId = useSelector((state: RootState) => state.user.currentAppId);

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <DashboardPage />;
      case "Users":
        return <UsersPage />;
      case "Success Logs":
        return <SuccessLogsPage />;
      case "Unknown Logs":
        return <UnknownLogsPage />;
      case "Exam Not Found":
        return <ExamNotFoundPage />;
      case "Common Users":
        return <CommonUsersPage />;
      default:
        return <DashboardPage />;
    }
  };

  const { isLoading } = useGetMyUogAppDataQuery(undefined, {
    skip: appId !== "myuog",
  });


  return (
    <div className="mainPageLayout">
      <TopBar />
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="contentArea">{renderContent()}</main>
    </div>
  );
};

export default MainPage;
