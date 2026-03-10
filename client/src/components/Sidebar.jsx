// Collapsible navigation sidebar with role-based item filtering.
// To add a page: add an entry to NAV_ITEMS with a key, label, and optional roles array.
// Omit roles to show the item to all users.
// admin = all items, manager = inventory + branches

import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = [
  { key: "inventory",  label: "Manage Inventory" },
  { key: "products",   label: "Manage Product",   roles: ["admin", "manager"] },
  { key: "branches",   label: "Manage Branch",    roles: ["admin", "manager"] },
  { key: "categories", label: "Manage Category",  roles: ["admin"] },
];

function Sidebar({ activePage, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  // Only show items the current user's role is allowed to see
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside
      className={`flex flex-col h-screen bg-brand-700 text-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header with logo and collapse toggle */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-brand-600">
        {!collapsed && (
          <span className="text-lg font-semibold tracking-wide">Stocktake</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-brand-600 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      {/* Navigation links — filtered by the user's role */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => onNavigate(item.key)}
                className={`flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activePage === item.key
                    ? "bg-brand-500 text-white"
                    : "text-brand-100 hover:bg-brand-600"
                }`}
              >
                <NavIcon itemKey={item.key} />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer: username, role, and logout */}
      <div className="border-t border-brand-600 px-4 py-4">
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-brand-300 capitalize">{user?.role}</p>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center w-full rounded-lg px-3 py-2 text-sm text-brand-200
                     hover:bg-brand-600 hover:text-white transition-colors"
          aria-label="Log out"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          {!collapsed && <span className="ml-3">Log out</span>}
        </button>
      </div>
    </aside>
  );
}

function NavIcon({ itemKey }) {
  const cls = "w-5 h-5 flex-shrink-0";

  switch (itemKey) {
    case "products":
    case "categories":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
        </svg>
      );
    case "inventory":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      );
    case "branches":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 20.25 9.35m-16.5 0a3.004 3.004 0 0 1-.621-1.101L2.083 5.85A2.25 2.25 0 0 1 4.217 3h15.566a2.25 2.25 0 0 1 2.134 2.85l-1.046 2.399a3.004 3.004 0 0 1-.621 1.1" />
        </svg>
      );
    default:
      return null;
  }
}

function CollapseIcon({ collapsed }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}

export default Sidebar;
