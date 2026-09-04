import { FaRegCircleUser, FaRepeat } from "react-icons/fa6";
import "../CSS/TopBar.css";
import myUog_logo from "../assets/myUog_logo.png";

const TopBar = () => {
  return (
    <header className="topBarContainer">
      <div className="topBarBrand">
        <img src={myUog_logo} alt="My UOG Logo" className="topBarLogo" />

        <div className="topBarBrandText">
          <span className="topBarTitle">MyUOG: GPA & Past Papers</span>
        </div>
      </div>
      <div className="topBarActions">
        <button
          type="button"
          className="topBarIconButton"
          title="Switch Project"
        >
          <FaRepeat size={18} />
        </button>

        <button type="button" className="topBarIconButton" title="Profile">
          <FaRegCircleUser size={20} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
