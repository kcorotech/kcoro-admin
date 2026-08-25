import { useState } from "react";
import "../CSS/LoginPage.css";

function LoginPage() {
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
      const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem("expire_credentials", String(expiry));
      localStorage.setItem("authStatus", String("true"));
    } else {
      alert("Wrong credentials!");
      setUserName("");
      setPassword("");
    }
  };

  return (
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
  );
}

export default LoginPage;
