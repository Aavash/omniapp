import { useNavigate, useLocation } from "react-router-dom";

export function SidebarItem({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === to; // Check if the current path matches `to`

  return (
    <button
      onClick={() => navigate(to)}
      className={`block w-full text-left px-4 py-2 text-sm rounded-md transition-colors duration-200 ${
        isActive
          ? "bg-blue-500 text-white" // Active state
          : "text-gray-700 hover:bg-gray-100" // Default state
      }`}
    >
      {children}
    </button>
  );
}
