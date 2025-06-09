import { useEffect, useState, useMemo } from "react";
import { useJWTAuth } from "@/hooks/useJWTAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import ThreeBackground from "@/components/ThreeBackground";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Ping {
  id: number;
  latitude: string;
  longitude: string;
  message: string | null;
  parentPingId: number | null;
  createdAt: string;
}

export default function TrailView() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useJWTAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedPingId, setSelectedPingId] = useState<number | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [newCoordinates, setNewCoordinates] = useState({ lat: "", lng: "" });

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const { data: allPings, isLoading: pingsLoading } = useQuery({
    queryKey: ["/api/pings"],
    enabled: isAuthenticated,
  });

  const respondMutation = useMutation({
    mutationFn: async (data: { parentId: number; latitude: string; longitude: string; message?: string }) => {
      const response = await apiRequest("POST", `/api/pings/${data.parentId}`, {
        latitude: data.latitude,
        longitude: data.longitude,
        message: data.message || null
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pings/latest"] });
      setSelectedPingId(null);
      setResponseMessage("");
      setNewCoordinates({ lat: "", lng: "" });
      toast({
        title: "Trail Extended",
        description: "Response transmission successful",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Transmission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateCoordinates = () => {
    const lat = (Math.random() * 180 - 90).toFixed(4);
    const lng = (Math.random() * 360 - 180).toFixed(4);
    setNewCoordinates({ lat, lng });
  };

  const handleRespond = () => {
    if (!selectedPingId || !newCoordinates.lat || !newCoordinates.lng) {
      toast({
        title: "Invalid Input",
        description: "Please select a ping and generate coordinates",
        variant: "destructive",
      });
      return;
    }

    respondMutation.mutate({
      parentId: selectedPingId,
      latitude: newCoordinates.lat,
      longitude: newCoordinates.lng,
      message: responseMessage || undefined
    });
  };

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
    const age = Date.now() - new Date(ping.createdAt).getTime();
    if (age < 5 * 60 * 1000) return { status: "ACTIVE", color: "mission-green", pulse: true };
    if (age < 60 * 60 * 1000) return { status: "TRANSMITTED", color: "amber-500", pulse: false };
    return { status: "COMPLETED", color: "slate-500", pulse: false };
  };

  // Build trail hierarchy
  const trailData = useMemo(() => {
    if (!Array.isArray(allPings)) return [];
    
    const pingMap = new Map(allPings.map((ping: Ping) => [ping.id, ping]));
    const trails: Array<{ root: Ping; responses: Ping[] }> = [];
    
    // Find root pings (no parent)
    const rootPings = allPings.filter((ping: Ping) => !ping.parentPingId);
    
    rootPings.forEach((root: Ping) => {
      const responses = allPings
        .filter((ping: Ping) => ping.parentPingId === root.id)
        .sort((a: Ping, b: Ping) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      trails.push({ root, responses });
    });

    return trails.sort((a, b) => new Date(b.root.createdAt).getTime() - new Date(a.root.createdAt).getTime());
  }, [allPings]);

  if (authLoading || pingsLoading) {
    return (
      <div className="min-h-screen bg-mission-dark">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mission-black relative overflow-hidden">
      <ThreeBackground scene="radar" className="z-0" />
      <div className="absolute inset-0 hexagon-pattern opacity-20 z-10"></div>
      
      <AppHeader />
      
      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="bond-title text-4xl font-light text-white mb-3">Mission Trails</h2>
          <p className="bond-subtitle text-mission-silver text-lg">Interactive ping response network</p>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-mission-green to-transparent mt-4"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trail Visualization */}
          <div className="lg:col-span-2 space-y-6">
            {trailData.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-mission-surface/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-mission-silver" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10 10 10s10-4.45 10-10V7L12 2z"/>
                  </svg>
                </div>
                <p className="text-mission-silver">No active trails. Start by creating a ping.</p>
                <Link href="/send-ping">
                  <Button className="mt-4 bg-mission-green hover:bg-mission-green/80">
                    Initialize Trail
                  </Button>
                </Link>
              </div>
            ) : (
              trailData.map(({ root, responses }) => {
                const rootStatus = getStatus(root);
                return (
                  <div key={root.id} className="glass rounded-xl p-6 space-y-4">
                    {/* Root Ping */}
                    <div 
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedPingId === root.id 
                          ? "border-mission-green bg-mission-green/10 glow-green" 
                          : "border-mission-surface/30 hover:border-mission-green/50 bg-mission-surface/10"
                      }`}
                      onClick={() => setSelectedPingId(root.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className={`text-${rootStatus.color} border-${rootStatus.color}`}>
                            <div className={`w-2 h-2 rounded-full bg-${rootStatus.color} mr-2 ${rootStatus.pulse ? 'pulse-glow' : ''}`}></div>
                            TRAIL #{root.id.toString().padStart(3, '0')}
                          </Badge>
                          <span className="text-xs text-mission-silver">{formatTimeAgo(root.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-mission-silver">
                            {responses.length} response{responses.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-mission-silver">Coordinates:</span>
                          <p className="text-white font-mono">{root.latitude}, {root.longitude}</p>
                        </div>
                        <div>
                          <span className="text-mission-silver">Status:</span>
                          <p className={`text-${rootStatus.color} font-medium`}>{rootStatus.status}</p>
                        </div>
                      </div>
                      
                      {root.message && (
                        <div className="mt-3 p-3 bg-mission-surface/20 rounded-lg">
                          <p className="text-mission-silver text-sm">{root.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Response Trail */}
                    {responses.length > 0 && (
                      <div className="ml-8 space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-px h-4 bg-mission-green/50"></div>
                          <span className="text-xs text-mission-silver font-medium">RESPONSE TRAIL</span>
                        </div>
                        
                        {responses.map((response, index) => {
                          const responseStatus = getStatus(response);
                          return (
                            <div key={response.id} className="flex items-start space-x-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-mission-green rounded-full"></div>
                                {index < responses.length - 1 && (
                                  <div className="w-px h-8 bg-mission-green/30 mt-1"></div>
                                )}
                              </div>
                              
                              <div className="flex-1 bg-mission-surface/10 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline" className={`text-${responseStatus.color} border-${responseStatus.color} text-xs`}>
                                    RESPONSE #{response.id.toString().padStart(3, '0')}
                                  </Badge>
                                  <span className="text-xs text-mission-silver">{formatTimeAgo(response.createdAt)}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="text-mission-silver">Coordinates:</span>
                                    <p className="text-white font-mono">{response.latitude}, {response.longitude}</p>
                                  </div>
                                  <div>
                                    <span className="text-mission-silver">Status:</span>
                                    <p className={`text-${responseStatus.color} font-medium`}>{responseStatus.status}</p>
                                  </div>
                                </div>
                                
                                {response.message && (
                                  <div className="mt-2 p-2 bg-mission-surface/20 rounded">
                                    <p className="text-mission-silver text-xs">{response.message}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Response Panel */}
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="bond-subtitle text-lg font-medium text-white mb-4">Extend Trail</h3>
              
              {selectedPingId ? (
                <div className="space-y-4">
                  <div className="p-3 bg-mission-green/10 border border-mission-green/30 rounded-lg">
                    <p className="text-mission-green text-sm font-medium">
                      Selected: Trail #{selectedPingId.toString().padStart(3, '0')}
                    </p>
                  </div>

                  <div>
                    <Label className="text-mission-silver text-sm">Response Coordinates</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Latitude"
                        value={newCoordinates.lat}
                        onChange={(e) => setNewCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                        className="w-full bg-mission-surface/20 border border-mission-surface/50 rounded px-3 py-2 text-white text-sm font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Longitude"
                        value={newCoordinates.lng}
                        onChange={(e) => setNewCoordinates(prev => ({ ...prev, lng: e.target.value }))}
                        className="w-full bg-mission-surface/20 border border-mission-surface/50 rounded px-3 py-2 text-white text-sm font-mono"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={generateCoordinates}
                      className="text-mission-green hover:text-mission-green/80 text-xs mt-2 p-0 h-auto"
                    >
                      Generate Random Coordinates
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="response-message" className="text-mission-silver text-sm">
                      Response Message (Optional)
                    </Label>
                    <Textarea
                      id="response-message"
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Additional mission notes..."
                      className="mt-2 bg-mission-surface/20 border-mission-surface/50 text-white placeholder-mission-silver"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleRespond}
                    disabled={respondMutation.isPending || !newCoordinates.lat || !newCoordinates.lng}
                    className="w-full bg-mission-green hover:bg-mission-green/80 text-mission-dark font-medium"
                  >
                    {respondMutation.isPending ? "Transmitting..." : "Extend Trail"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-mission-surface/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-mission-silver" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <p className="text-mission-silver text-sm">Select a trail to extend with a response</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-xl p-6">
              <h3 className="bond-subtitle text-lg font-medium text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/send-ping">
                  <Button variant="outline" className="w-full justify-start border-mission-surface/50 text-mission-silver hover:text-white">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    New Trail
                  </Button>
                </Link>
                <Link href="/all-pings">
                  <Button variant="outline" className="w-full justify-start border-mission-surface/50 text-mission-silver hover:text-white">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                    All Pings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}