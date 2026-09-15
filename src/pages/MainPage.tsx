import { useState } from "react";
import { NavBar } from "../components/NavBar";
import TopBar from "../components/TopBar";
import DashboardPage from "./DashboardPage";
import UsersPage from "./UsersPage";
import SuccessLogsPage from "./SuccessLogsPage";
import UnknownLogsPage from "./UnknownLogsPage";
import ExamNotFoundPage from "./ExamNotFoundPage";
import CommonUsersPage from "./CommonUsersPage";

const MainPage = () => {
  const [activeTab, setActiveTab] = useState<string>("Dashboard");

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

  return (
    <div className="mainPageLayout">
      <TopBar />
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="contentArea">{renderContent()}</main>
    </div>
  );
};

export default MainPage;
