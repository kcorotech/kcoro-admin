import { useState } from "react";
import "../CSS/LoginPage.css";
import { useDispatch } from "react-redux";
import { set_Is_Authenticated, set_User_Role } from "../redux/user/userSlice";
import { Auth_Status, EXPIRE_KEY } from "../utils/Keys";
import { UserRole } from "../utils/enum";

function LoginPage() {
  const dispatch = useDispatch();
  const [username, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!username || !password) {
      return alert("Fill the credentials!");
    }

    if (
      username?.toLowerCase() === "admin" &&
      password?.toLowerCase() === "myuog"
    ) {
      dispatch(set_User_Role(UserRole.ADMIN));
      const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(EXPIRE_KEY, String(expiry));
      localStorage.setItem(Auth_Status, String("true"));
      dispatch(set_Is_Authenticated(true));
    } else {
      alert("Wrong credentials!");
      setUserName("");
      setPassword("");
    }
  };

  return (
    <div className="app">
      <div className="authContainer">
        <div className="brandRow">
          <div className="brandMark">K</div>

          <div className="brandName">
            <strong>Kcoro Admin</strong>
          </div>
        </div>

        <div className="inputGroup">
          <label htmlFor="username">Username</label>

          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            className="inputField"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUserName(e?.target?.value);
            }}
          />
        </div>

        <div className="inputGroup">
          <label htmlFor="password">Password</label>

          <div className="passwordWrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="inputField"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e?.target?.value);
              }}
            />

            <button
              type="button"
              className="passwordToggle"
              onClick={() => {
                setShowPassword(!showPassword);
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="login-btn"
          onClick={() => {
            handleLogin();
          }}
        >
          Sign in
        </button>

        <div className="authFooter">
          Secure access · Sessions expire after 7 days
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
