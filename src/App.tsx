import LoginPage from "./pages/LoginPage";
import "./App.css";
import { useSelector } from "react-redux";
import type { RootState } from "./redux/store";
export default function App() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.user.isAuthenticated,
  );

  console.log(isAuthenticated)
  return (
    <div className="app">{!isAuthenticated ? <LoginPage /> : <p>hello</p>}</div>
  );
}
