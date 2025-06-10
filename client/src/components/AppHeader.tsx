import { useJWTAuth } from "@/hooks/useJWTAuth";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function AppHeader() {
  const { user, logout } = useJWTAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: "⚡" },
    { path: "/send-ping", label: "Send Ping", icon: "📡" },
    { path: "/trails", label: "Mission Trails", icon: "🔗" },
    { path: "/all-pings", label: "All Pings", icon: "📊" },
    { path: "/security", label: "Security Center", icon: "🛡️" },
  ];

  return (
    <>
      <header className="glass border-b border-mission-surface sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-mission-green via-mission-gold to-mission-blue rounded-lg flex items-center justify-center glow-green">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="bond-title text-lg font-light text-white">MISSION CONTROL</h1>
                <p className="text-xs text-mission-silver -mt-1">MI6 Network</p>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`group relative px-4 py-2 rounded-lg transition-all-smooth ${
                    isActive(item.path)
                      ? "bg-mission-green/20 text-mission-green glow-green"
                      : "text-mission-silver hover:text-white hover:bg-mission-surface/50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-mission-green rounded-full"></div>
                  )}
                </Link>
              ))}
            </nav>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256"
                    alt="Agent profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-mission-green/50"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-mission-green rounded-full border-2 border-mission-dark pulse-glow"></div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">
                    {user?.firstName || user?.lastName 
                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                      : user?.username || "Agent 007"
                    }
                  </p>
                  <p className="text-xs text-mission-silver">
                    Level 9 Clearance
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-mission-silver hover:text-mission-red transition-all-smooth hover:bg-mission-surface/50 rounded-lg group"
                title="Secure Logout"
              >
                <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
              </button>
            </div>
            
            <button
              className="md:hidden p-2 text-mission-silver hover:text-white transition-colors rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-b border-mission-surface backdrop-blur-xl">
          <div className="px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 w-full text-left px-4 py-3 rounded-lg transition-all-smooth ${
                  isActive(item.path)
                    ? "bg-mission-green/20 text-mission-green glow-green"
                    : "text-mission-silver hover:text-white hover:bg-mission-surface/50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
            
            {/* Mobile user info and logout */}
            <div className="border-t border-mission-surface/50 pt-3 mt-3">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-mission-green via-mission-gold to-mission-blue rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {user?.firstName?.[0] || user?.username?.[0] || "A"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {user?.firstName || user?.lastName 
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                        : user?.username || "Agent 007"
                      }
                    </p>
                    <p className="text-xs text-mission-silver">Level 9 Clearance</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 text-mission-silver hover:text-mission-red transition-colors rounded-lg"
                  title="Secure Logout"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
