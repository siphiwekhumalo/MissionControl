import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";
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
    <div className="min-h-screen bg-mission-dark text-slate-50">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-50 mb-2">Mission Dashboard</h2>
          <p className="text-slate-400">Monitor your latest ping transmissions and mission status</p>
        </div>

        {/* Mission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-mission-secondary rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Pings</p>
                <p className="text-2xl font-bold text-slate-50">{totalPings}</p>
              </div>
              <div className="bg-mission-navy/20 p-3 rounded-lg">
                <i className="fas fa-satellite text-mission-navy text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-mission-secondary rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Active Trails</p>
                <p className="text-2xl font-bold text-slate-50">{activeTrails}</p>
              </div>
              <div className="bg-mission-green/20 p-3 rounded-lg">
                <i className="fas fa-route text-mission-green text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-mission-secondary rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Last Transmission</p>
                <p className="text-2xl font-bold text-slate-50">{lastPing}</p>
              </div>
              <div className="bg-amber-500/20 p-3 rounded-lg">
                <i className="fas fa-clock text-amber-500 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions and Latest Pings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {/* Latest Pings Section */}
            <div className="bg-mission-secondary rounded-lg border border-slate-700">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-50">Latest Transmissions</h3>
                  <Link href="/all-pings" className="text-mission-green hover:text-emerald-400 text-sm font-medium transition-colors">
                    View All <i className="fas fa-arrow-right ml-1"></i>
                  </Link>
                </div>
              </div>
              
              <div className="divide-y divide-slate-700">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                ) : latestPings && latestPings.length > 0 ? (
                  latestPings.map((ping: Ping) => {
                    const status = getStatus(ping);
                    return (
                      <div key={ping.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`w-2 h-2 bg-${status.color} rounded-full ${status.pulse ? 'animate-pulse' : ''}`}></div>
                              <span className={`text-sm font-medium text-${status.color}`}>{status.status}</span>
                              <span className="text-sm text-slate-400">{formatTimeAgo(ping.createdAt)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-slate-400">Coordinates:</span>
                                <span className="text-slate-200 font-mono ml-2">{ping.latitude}, {ping.longitude}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Trail ID:</span>
                                <span className="text-slate-200 font-mono ml-2">#{ping.id.toString().padStart(3, '0')}</span>
                              </div>
                            </div>
                          </div>
                          <button className="text-slate-400 hover:text-mission-green transition-colors">
                            <i className="fas fa-external-link-alt"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <i className="fas fa-satellite-dish text-4xl mb-4 opacity-50"></i>
                    <p>No transmissions yet</p>
                    <p className="text-sm">Send your first ping to get started</p>
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
