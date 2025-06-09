import { Link, useLocation } from "wouter";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: "fas fa-tachometer-alt" },
    { path: "/send-ping", label: "Send Ping", icon: "fas fa-paper-plane" },
    { path: "/all-pings", label: "All Pings", icon: "fas fa-list" },
  ];

  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-mission-secondary border-b border-slate-700">
      <div className="px-4 py-3 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
              isActive(item.path)
                ? "text-mission-green bg-mission-dark"
                : "text-slate-300 hover:text-slate-50 hover:bg-mission-dark"
            }`}
            onClick={onClose}
          >
            <i className={`${item.icon} mr-2`}></i>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
