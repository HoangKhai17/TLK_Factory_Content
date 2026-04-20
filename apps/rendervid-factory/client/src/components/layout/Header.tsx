import { useLocation, Link } from "react-router-dom";

const ROUTE_LABELS: Record<string, string[]> = {
  "/dashboard":  ["Dashboard"],
  "/projects":   ["Dashboard", "Projects"],
  "/settings":   ["Dashboard", "Settings"],
  "/account":    ["Dashboard", "Account"],
};

function getBreadcrumbs(pathname: string): string[] {
  if (pathname.startsWith("/projects/")) return ["Dashboard", "Projects", "Detail"];
  return ROUTE_LABELS[pathname] ?? ["Dashboard"];
}

function getRoutePath(label: string): string {
  const map: Record<string, string> = {
    Dashboard: "/dashboard",
    Projects:  "/projects",
    Settings:  "/settings",
    Account:   "/account",
  };
  return map[label] ?? "/dashboard";
}

export default function Header() {
  const { pathname } = useLocation();
  const crumbs = getBreadcrumbs(pathname);

  return (
    <header className="app-header">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        {crumbs.map((label, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span className="breadcrumb-sep">/</span>}
              {isLast ? (
                <span className="breadcrumb-current">{label}</span>
              ) : (
                <Link to={getRoutePath(label)} style={{ transition: "color 0.15s" }} className="breadcrumb-link">
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="header-right">
        {/* Notification bell */}
        <button className="btn btn-ghost btn-icon btn-sm" title="Notifications">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* User menu */}
        <div className="user-menu">
          <div className="user-avatar">K</div>
          <span className="user-name">Khai</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-3)" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </header>
  );
}
