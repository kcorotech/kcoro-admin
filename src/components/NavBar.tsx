import "../CSS/NavBar.css";

export const NavBar = () => {
  return (
    <nav className="navBarWrapper">
      <ul className="itemContainer">
        <li className="navItem active">Dashboard</li>
        <li className="navItem">Users</li>
        <li className="navItem">Success Logs</li>
        <li className="navItem">Unknown Logs</li>
        <li className="navItem">Exam Not Found</li>
        <li className="navItem">Common Users</li>
      </ul>
    </nav>
  );
};