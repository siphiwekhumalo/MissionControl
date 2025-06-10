import { useEffect, memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useJWTAuth } from "@/hooks/useJWTAuth";
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
  const { user, isAuthenticated, isLoading: authLoading } = useJWTAuth();

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

  const totalPings = Array.isArray(allPings) ? allPings.length : 0;
  const activeTrails = Array.isArray(allPings) ? allPings.filter((p: Ping) => !p.parentPingId).length : 0;
  const lastPing = Array.isArray(latestPings) && latestPings[0] ? formatTimeAgo(latestPings[0].createdAt) : "Never";

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
      <div className="absolute inset-0 hexagon-pattern opacity-20 z-10 pointer-events-none"></div>
      
      <AppHeader />
      
      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="bond-title text-4xl font-light text-white mb-3">Dashboard</h2>
          <p className="bond-subtitle text-mission-silver text-lg">Mission Intelligence & Transmission Status</p>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-mission-green to-transparent mt-4"></div>
        </div>

        {/* Mission Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Link href="/all-pings">
            <div className="glass gradient-border rounded-2xl p-6 glow-green hover:bg-mission-surface/30 transition-all-smooth cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-mission-silver text-sm font-medium mb-1 group-hover:text-mission-green transition-colors">Total Transmissions</p>
                  <p className="text-3xl font-light text-white">{totalPings}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-mission-green rounded-full pulse-glow"></div>
                    <span className="text-xs text-mission-green">OPERATIONAL</span>
                  </div>
                </div>
              <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-mission-green/20 to-mission-blue/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:from-mission-green/30 group-hover:to-mission-blue/30 transition-all">
                    <svg className="w-6 h-6 text-mission-green" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/all-pings?filter=trails">
            <div className="glass gradient-border rounded-2xl p-6 glow-blue hover:bg-mission-surface/30 transition-all-smooth cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-mission-silver text-sm font-medium mb-1 group-hover:text-mission-blue transition-colors">Active Trails</p>
                  <p className="text-3xl font-light text-white">{activeTrails}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-mission-blue rounded-full pulse-glow"></div>
                    <span className="text-xs text-mission-blue">TRACKING</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-mission-blue/20 to-mission-gold/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:from-mission-blue/30 group-hover:to-mission-gold/30 transition-all">
                    <svg className="w-6 h-6 text-mission-blue" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/send-ping">
            <div className="glass gradient-border rounded-2xl p-6 glow-gold hover:bg-mission-surface/30 transition-all-smooth cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-mission-silver text-sm font-medium mb-1 group-hover:text-mission-gold transition-colors">Last Transmission</p>
                  <p className="text-3xl font-light text-white">{lastPing}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-mission-gold rounded-full pulse-glow"></div>
                    <span className="text-xs text-mission-gold">SYNCHRONIZED</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-mission-gold/20 to-mission-green/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:from-mission-gold/30 group-hover:to-mission-green/30 transition-all">
                    <svg className="w-6 h-6 text-mission-gold" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
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
                  <Link href="/all-pings" className="group inline-flex items-center space-x-2 px-4 py-2 bg-mission-green/20 hover:bg-mission-green/30 text-mission-green rounded-lg transition-all-smooth glow-green cursor-pointer pointer-events-auto relative z-30">
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
                ) : Array.isArray(latestPings) && latestPings.length > 0 ? (
                  latestPings.map((ping: Ping, index: number) => {
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
                          {index === 0 ? (
                            <Link href="/send-ping?type=response" className="inline-block">
                              <button 
                                className="p-2 text-mission-silver/60 hover:text-mission-green transition-colors opacity-0 group-hover:opacity-100 rounded-lg hover:bg-mission-surface/50 cursor-pointer"
                                title="Respond to latest transmission"
                                type="button"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                                </svg>
                              </button>
                            </Link>
                          ) : (
                            <div className="p-2 text-mission-surface/40 rounded-lg cursor-not-allowed opacity-0 group-hover:opacity-100" title="Only latest transmission can be responded to">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-13h4v6h-4zm0 8h4v2h-4z"/>
                              </svg>
                            </div>
                          )}
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
                    <Link href="/send-ping" className="inline-flex items-center justify-center bg-gradient-to-r from-mission-green to-mission-blue hover:from-mission-blue hover:to-mission-green text-white font-medium px-6 py-2 rounded-lg transition-all-smooth cursor-pointer pointer-events-auto relative z-30">
                      Initialize Transmission
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Mission Control Panel */}
            <div className="glass gradient-border rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="bond-title text-lg font-light text-white mb-1">Mission Control</h3>
                <p className="bond-subtitle text-mission-silver text-sm">Tactical operations</p>
              </div>
              <div className="space-y-4">
                <Link href="/send-ping" className="w-full bg-gradient-to-r from-mission-green to-mission-blue hover:from-mission-blue hover:to-mission-green text-white font-medium py-4 px-6 rounded-xl transition-all-smooth glow-green group cursor-pointer flex items-center justify-center space-x-3 pointer-events-auto relative z-30">
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                  <span>Initiate Transmission</span>
                </Link>
                <Link href="/all-pings" className="w-full bg-mission-surface/50 hover:bg-mission-surface border border-mission-surface hover:border-mission-gold text-mission-silver hover:text-white font-medium py-3 px-6 rounded-xl transition-all-smooth cursor-pointer flex items-center justify-center space-x-3 pointer-events-auto relative z-30">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                  </svg>
                  <span>Access Archive</span>
                </Link>
              </div>
            </div>
            
            {/* System Status */}
            <div className="glass gradient-border rounded-2xl p-6">
              <div className="mb-6">
                <h3 className="bond-title text-lg font-light text-white mb-1">System Status</h3>
                <p className="bond-subtitle text-mission-silver text-sm">Network diagnostics</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-mission-green rounded-full pulse-glow"></div>
                    <span className="text-mission-silver">Security Level</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-mission-green font-medium text-sm">LEVEL 9</span>
                    <svg className="w-4 h-4 text-mission-green" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-mission-blue rounded-full pulse-glow"></div>
                    <span className="text-mission-silver">Network</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-mission-blue font-medium text-sm">QUANTUM</span>
                    <svg className="w-4 h-4 text-mission-blue" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-mission-gold rounded-full pulse-glow"></div>
                    <span className="text-mission-silver">Encryption</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-mission-gold font-medium text-sm">AES-256</span>
                    <svg className="w-4 h-4 text-mission-gold" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-mission-surface/30 pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-mission-green rounded-full pulse-glow"></div>
                    <span className="text-mission-silver">Last Sync</span>
                  </div>
                  <span className="text-white font-medium text-sm">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
