import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import ThreeBackground from "@/components/ThreeBackground";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Ping {
  id: number;
  latitude: string;
  longitude: string;
  message: string | null;
  parentPingId: number | null;
  createdAt: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: latestPings, isLoading } = useQuery({
    queryKey: ["/api/pings/latest"],
    enabled: isAuthenticated,
  });

  const { data: allPings } = useQuery({
    queryKey: ["/api/pings"],
    enabled: isAuthenticated,
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatus = (ping: Ping) => {
    const age = new Date().getTime() - new Date(ping.createdAt).getTime();
    if (age < 5 * 60 * 1000) return { status: "ACTIVE", color: "mission-green", pulse: true };
    if (age < 60 * 60 * 1000) return { status: "TRANSMITTED", color: "amber-500", pulse: false };
    return { status: "COMPLETED", color: "slate-500", pulse: false };
  };

  const totalPings = allPings?.length || 0;
  const activeTrails = allPings?.filter((p: Ping) => !p.parentPingId).length || 0;
  const lastPing = latestPings?.[0] ? formatTimeAgo(latestPings[0].createdAt) : "Never";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-mission-dark">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mission-black relative overflow-hidden">
      {/* Three.js Background Animation */}
      <ThreeBackground scene="radar" className="z-0" />
      
      {/* Hexagon overlay pattern */}
      <div className="absolute inset-0 hexagon-pattern opacity-20 z-10"></div>
      
      <AppHeader />
      
      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="bond-title text-4xl font-light text-white mb-3">Command Center</h2>
          <p className="bond-subtitle text-mission-silver text-lg">Mission Intelligence & Transmission Status</p>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-mission-green to-transparent mt-4"></div>
        </div>

        {/* Mission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass gradient-border rounded-2xl p-6 glow-green">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mission-silver text-sm font-medium mb-1">Total Transmissions</p>
                <p className="text-3xl font-light text-white">{totalPings}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-mission-green rounded-full pulse-glow"></div>
                  <span className="text-xs text-mission-green">OPERATIONAL</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-mission-green/20 to-mission-blue/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-mission-green" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass gradient-border rounded-2xl p-6 glow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mission-silver text-sm font-medium mb-1">Active Trails</p>
                <p className="text-3xl font-light text-white">{activeTrails}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-mission-blue rounded-full pulse-glow"></div>
                  <span className="text-xs text-mission-blue">TRACKING</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-mission-blue/20 to-mission-gold/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-mission-blue" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass gradient-border rounded-2xl p-6 glow-gold">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mission-silver text-sm font-medium mb-1">Last Transmission</p>
                <p className="text-3xl font-light text-white">{lastPing}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-mission-gold rounded-full pulse-glow"></div>
                  <span className="text-xs text-mission-gold">SYNCHRONIZED</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-mission-gold/20 to-mission-green/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-mission-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Feed and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {/* Latest Transmissions Section */}
            <div className="glass gradient-border rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-mission-surface/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="bond-title text-xl font-light text-white">Intelligence Feed</h3>
                    <p className="bond-subtitle text-mission-silver text-sm">Recent transmission activity</p>
                  </div>
                  <Link href="/all-pings" className="group flex items-center space-x-2 px-4 py-2 bg-mission-green/20 hover:bg-mission-green/30 text-mission-green rounded-lg transition-all-smooth glow-green">
                    <span className="text-sm font-medium">View Archive</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </Link>
                </div>
              </div>
              
              <div className="divide-y divide-mission-surface/30">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    <div className="animate-pulse flex space-x-4">
                      <div className="w-12 h-12 bg-mission-surface/50 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-mission-surface/50 rounded w-3/4"></div>
                        <div className="h-3 bg-mission-surface/30 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="animate-pulse flex space-x-4">
                      <div className="w-12 h-12 bg-mission-surface/50 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-mission-surface/50 rounded w-3/4"></div>
                        <div className="h-3 bg-mission-surface/30 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ) : latestPings && latestPings.length > 0 ? (
                  latestPings.map((ping: Ping) => {
                    const status = getStatus(ping);
                    return (
                      <div key={ping.id} className="p-6 hover:bg-mission-surface/30 transition-all-smooth group">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className={`w-12 h-12 bg-gradient-to-br from-${status.color}/20 to-${status.color}/10 rounded-xl flex items-center justify-center backdrop-blur-sm`}>
                              <div className={`w-2 h-2 bg-${status.color} rounded-full ${status.pulse ? 'pulse-glow' : ''}`}></div>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-mission-dark rounded-full flex items-center justify-center">
                              <span className="text-xs font-mono text-mission-silver">#{ping.id}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`text-sm font-medium text-${status.color} uppercase tracking-wide`}>{status.status}</span>
                              <span className="text-sm text-mission-silver">{formatTimeAgo(ping.createdAt)}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-mission-silver/60" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                <span className="text-mission-silver/80">Coordinates:</span>
                                <span className="text-white font-mono text-xs">{ping.latitude}, {ping.longitude}</span>
                              </div>
                              {ping.parentPingId && (
                                <div className="flex items-center space-x-2">
                                  <svg className="w-4 h-4 text-mission-silver/60" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z"/>
                                  </svg>
                                  <span className="text-mission-silver/80">Response to:</span>
                                  <span className="text-mission-blue font-mono text-xs">#{ping.parentPingId.toString().padStart(3, '0')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button className="p-2 text-mission-silver/60 hover:text-mission-green transition-colors opacity-0 group-hover:opacity-100 rounded-lg hover:bg-mission-surface/50">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-mission-green/20 to-mission-blue/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm">
                        <svg className="w-8 h-8 text-mission-silver/60" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">No Intelligence Yet</h4>
                    <p className="text-mission-silver text-sm mb-4">Begin your first transmission to establish communication</p>
                    <Link href="/send-ping">
                      <Button className="bg-gradient-to-r from-mission-green to-mission-blue hover:from-mission-blue hover:to-mission-green text-white font-medium px-6 py-2 rounded-lg transition-all-smooth">
                        Initialize Transmission
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Quick Send Ping */}
            <div className="bg-mission-secondary rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-slate-50 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/send-ping">
                  <Button className="w-full bg-mission-green hover:bg-emerald-600 text-white font-medium py-3 px-4">
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send New Ping
                  </Button>
                </Link>
                <Link href="/all-pings">
                  <Button className="w-full bg-mission-navy hover:bg-blue-600 text-white font-medium py-3 px-4">
                    <i className="fas fa-list mr-2"></i>
                    View All Pings
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Mission Status */}
            <div className="bg-mission-secondary rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-slate-50 mb-4">Mission Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Security Level</span>
                  <span className="text-mission-green font-medium">CLASSIFIED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Connection</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-mission-green rounded-full animate-pulse"></div>
                    <span className="text-mission-green font-medium">SECURE</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Sync</span>
                  <span className="text-slate-300">Just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
