import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function AppHeader() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

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

  return (
    <>
      <header className="bg-mission-secondary border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <i className="fas fa-satellite-dish text-mission-green text-xl"></i>
              <h1 className="text-xl font-bold text-slate-50">Mission Control</h1>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-2 transition-colors ${
                    isActive(item.path)
                      ? "text-mission-green border-b-2 border-mission-green"
                      : "text-slate-300 hover:text-slate-50"
                  }`}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {item.label}
                </Link>
              ))}
            </nav>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.profileImageUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256"}
                  alt="Agent profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-mission-green"
                />
                <div className="hidden md:block">
                  <p className="text-sm font-medium">
                    {user?.firstName || user?.lastName 
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : "Agent 007"
                    }
                  </p>
                  <p className="text-xs text-slate-400">
                    {user?.email || "james.bond@mi6.gov.uk"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-slate-300 transition-colors"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
            
            <button
              className="md:hidden text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
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
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
