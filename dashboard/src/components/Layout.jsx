import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { adminApi } from "../lib/api";

const NAV = [
  { to: "/", label: "Overview", end: true },
  { to: "/payments", label: "Payment Reviews", badge: true },
  { to: "/shops", label: "Shops" },
  { to: "/usage", label: "Usage" },
  { to: "/activity", label: "Activity" },
  { to: "/outreach", label: "Outreach" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Poll pending count so the sidebar badge stays live.
  const { data: pendingCount } = useQuery({
    queryKey: ["pending-count"],
    queryFn: async () => {
      const { data } = await adminApi.overview();
      return data.pendingReviews;
    },
    refetchInterval: 30_000,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">🛰 ShopOS Admin</div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            {item.label}
            {item.badge && pendingCount > 0 ? (
              <span className="nav-badge">{pendingCount}</span>
            ) : null}
          </NavLink>
        ))}
        <div style={{ marginTop: "auto" }} className="panel">
          <div className="muted" style={{ fontSize: 13 }}>{user?.name}</div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            {user?.email}
          </div>
          <button onClick={handleLogout} style={{ width: "100%" }}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
