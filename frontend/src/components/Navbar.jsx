import { href, useNavigate } from "react-router-dom";
const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div>
      <nav className="border-b p-[1rem] flex justify-between items-center">
        <div className="flex items-center gap-[2rem]">
          logo
          <h1>SKhub</h1>
        </div>
        <ul className="flex items-center gap-[6rem]">
          <li>
            <a href="/youthprofiles">Profiles</a>
          </li>
          <li>
            <a href="/dashboard">Dashboard</a>
          </li>
          <li>
            <a href="/project">Project</a>
          </li>
          <div className="flex gap-[1rem]">
            <a href="/profile">user Profile</a>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
