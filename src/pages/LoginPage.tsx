import { useState } from "react";
import "../CSS/LoginPage.css";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

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
          />

          <button
            type="button"
            className="passwordToggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button type="button" className="login-btn">
        Sign in
      </button>

      <div className="authFooter">
        Secure access · Sessions expire after 7 days
      </div>
    </div>
  );
}

export default LoginPage;
