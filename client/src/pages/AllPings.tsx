import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function AllPings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trailFilter, setTrailFilter] = useState("all");

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

  const { data: allPings, isLoading } = useQuery({
    queryKey: ["/api/pings"],
    enabled: isAuthenticated,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().split(' ')[0] + ' UTC',
    };
  };

  const getStatus = (ping: Ping) => {
    const age = new Date().getTime() - new Date(ping.createdAt).getTime();
    if (age < 5 * 60 * 1000) return { status: "ACTIVE", color: "mission-green", pulse: true };
    if (age < 60 * 60 * 1000) return { status: "TRANSMITTED", color: "amber-500", pulse: false };
    return { status: "COMPLETED", color: "slate-500", pulse: false };
  };

  const filteredPings = allPings?.filter((ping: Ping) => {
    const matchesSearch = 
      ping.latitude.includes(searchTerm) ||
      ping.longitude.includes(searchTerm) ||
      ping.id.toString().includes(searchTerm) ||
      (ping.message && ping.message.toLowerCase().includes(searchTerm.toLowerCase()));

    const status = getStatus(ping);
    const matchesStatus = statusFilter === "all" || status.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesTrail = 
      trailFilter === "all" ||
      (trailFilter === "new" && !ping.parentPingId) ||
      (trailFilter === "responses" && ping.parentPingId);

    return matchesSearch && matchesStatus && matchesTrail;
  }) || [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-mission-dark">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <Skeleton className="h-20 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mission-dark text-slate-50">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-50 mb-2">All Transmissions</h2>
          <p className="text-slate-400">Complete history of your ping transmissions and trails</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-mission-secondary rounded-lg p-6 border border-slate-700 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                <Input
                  type="text"
                  placeholder="Search transmissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-mission-dark border-slate-600 pl-10 text-slate-50 placeholder-slate-500 focus:border-mission-green"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-mission-dark border-slate-600 text-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-mission-dark border-slate-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="transmitted">Transmitted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={trailFilter} onValueChange={setTrailFilter}>
                <SelectTrigger className="bg-mission-dark border-slate-600 text-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-mission-dark border-slate-600">
                  <SelectItem value="all">All Trails</SelectItem>
                  <SelectItem value="new">New Trails Only</SelectItem>
                  <SelectItem value="responses">Responses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Pings Table */}
        <div className="bg-mission-secondary rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-mission-dark border-b border-slate-700">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Coordinates</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Timestamp</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Trail</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Parent</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-300">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    </td>
                  </tr>
                ) : filteredPings.length > 0 ? (
                  filteredPings.map((ping: Ping) => {
                    const status = getStatus(ping);
                    const { date, time } = formatDate(ping.createdAt);
                    
                    return (
                      <tr key={ping.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 bg-${status.color} rounded-full ${status.pulse ? 'animate-pulse' : ''}`}></div>
                            <span className={`text-sm font-medium text-${status.color}`}>{status.status}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm text-slate-200">{ping.latitude}, {ping.longitude}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <div className="text-sm text-slate-200">{date}</div>
                            <div className="text-xs text-slate-400">{time}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mission-navy/20 text-mission-navy border border-mission-navy/30">
                            #{ping.id.toString().padStart(3, '0')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-slate-400">
                            {ping.parentPingId ? `#${ping.parentPingId.toString().padStart(3, '0')}` : "—"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-slate-300 max-w-xs truncate block">
                            {ping.message || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="text-slate-400">
                        <i className="fas fa-satellite-dish text-4xl mb-4 opacity-50"></i>
                        <p className="text-lg font-medium mb-2">No transmissions found</p>
                        <p className="text-sm">
                          {searchTerm || statusFilter !== "all" || trailFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "Send your first ping to get started"
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredPings.length > 0 && (
            <div className="bg-mission-dark px-6 py-4 flex items-center justify-between border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Showing <span className="font-medium text-slate-300">1</span> to{" "}
                <span className="font-medium text-slate-300">{filteredPings.length}</span> of{" "}
                <span className="font-medium text-slate-300">{filteredPings.length}</span> transmissions
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="border-slate-600 text-slate-400"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  className="bg-mission-green text-white"
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="border-slate-600 text-slate-400"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
