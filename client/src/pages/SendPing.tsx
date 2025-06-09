
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import ThreeBackground from "@/components/ThreeBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Ping {
  id: number;
  latitude: string;
  longitude: string;
  message: string | null;
  parentPingId: number | null;
  createdAt: string;
}

export default function SendPing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [pingType, setPingType] = useState<"new" | "response">("new");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState("");
  const [parentPingId, setParentPingId] = useState<string>("");

  // Check for parent parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const parentId = urlParams.get('parent');
    if (parentId) {
      setPingType("response");
      setParentPingId(parentId);
    }
  }, []);

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

  const { data: allPings } = useQuery({
    queryKey: ["/api/pings"],
    enabled: isAuthenticated,
  });

  const generateCoordinates = () => {
    const lat = (Math.random() * 180 - 90).toFixed(4);
    const lng = (Math.random() * 360 - 180).toFixed(4);
    setLatitude(lat);
    setLongitude(lng);
  };

  // Generate initial coordinates
  useEffect(() => {
    if (!latitude && !longitude) {
      generateCoordinates();
    }
  }, [latitude, longitude]);

  const sendPingMutation = useMutation({
    mutationFn: async (data: { latitude: string; longitude: string; message?: string; parentPingId?: number }) => {
      if (pingType === "response" && parentPingId) {
        return await apiRequest("POST", `/api/pings/${parentPingId}`, {
          latitude: data.latitude,
          longitude: data.longitude,
          message: data.message || null,
        });
      } else {
        return await apiRequest("POST", "/api/pings", {
          latitude: data.latitude,
          longitude: data.longitude,
          message: data.message || null,
          parentPingId: null,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Ping Transmitted",
        description: "Your secure transmission has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pings/latest"] });
      setLocation("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Transmission Failed",
        description: "Failed to send ping. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!latitude || !longitude) {
      toast({
        title: "Invalid Coordinates",
        description: "Please generate valid coordinates before transmitting.",
        variant: "destructive",
      });
      return;
    }

    if (pingType === "response" && !parentPingId) {
      toast({
        title: "Parent Ping Required",
        description: "Please select a ping to respond to.",
        variant: "destructive",
      });
      return;
    }

    sendPingMutation.mutate({
      latitude,
      longitude,
      message: message || undefined,
      parentPingId: parentPingId ? parseInt(parentPingId) : undefined,
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

  if (authLoading) {
    return <div className="min-h-screen bg-mission-dark"><AppHeader /></div>;
  }

  return (
    <div className="min-h-screen bg-mission-black relative overflow-hidden">
      {/* Three.js Background Animation */}
      <ThreeBackground scene="matrix" className="z-0" />
      
      {/* Hexagon overlay pattern */}
      <div className="absolute inset-0 hexagon-pattern opacity-20 z-10"></div>
      
      <AppHeader />
      
      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="bond-title text-4xl font-light text-white mb-3">Transmission Protocol</h2>
          <p className="bond-subtitle text-mission-silver text-lg">Secure coordinate broadcasting system</p>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-mission-green to-transparent mt-4"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="glass gradient-border rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Transmission Type Selection */}
                <div>
                  <Label className="bond-subtitle text-base font-medium text-white mb-4 block">Transmission Protocol</Label>
                  <RadioGroup value={pingType} onValueChange={(value: "new" | "response") => setPingType(value)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Label className="relative group cursor-pointer">
                        <RadioGroupItem value="new" className="sr-only" />
                        <div className={`glass gradient-border rounded-xl p-6 transition-all-smooth hover:scale-[1.02] ${
                          pingType === "new" 
                            ? "glow-green bg-mission-green/10" 
                            : "hover:bg-mission-surface/30"
                        }`}>
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-mission-green/20 to-mission-blue/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                              <svg className="w-6 h-6 text-mission-green" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-white mb-1">New Transmission</p>
                              <p className="text-sm text-mission-silver">Initialize new coordinate trail</p>
                            </div>
                            {pingType === "new" && (
                              <div className="w-2 h-2 bg-mission-green rounded-full pulse-glow"></div>
                            )}
                          </div>
                        </div>
                      </Label>
                      
                      <Label className="relative group cursor-pointer">
                        <RadioGroupItem value="response" className="sr-only" />
                        <div className={`glass gradient-border rounded-xl p-6 transition-all-smooth hover:scale-[1.02] ${
                          pingType === "response" 
                            ? "glow-blue bg-mission-blue/10" 
                            : "hover:bg-mission-surface/30"
                        }`}>
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-mission-blue/20 to-mission-gold/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                              <svg className="w-6 h-6 text-mission-blue" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-white mb-1">Response Protocol</p>
                              <p className="text-sm text-mission-silver">Reply to existing transmission</p>
                            </div>
                            {pingType === "response" && (
                              <div className="w-2 h-2 bg-mission-blue rounded-full pulse-glow"></div>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Parent Ping Selection */}
                {pingType === "response" && (
                  <div>
                    <Label htmlFor="parentPing" className="bond-subtitle text-base font-medium text-white mb-3 block">
                      Select Previous Transmission
                    </Label>
                    <Select value={parentPingId} onValueChange={setParentPingId}>
                      <SelectTrigger className="glass gradient-border bg-mission-surface/30 border-0 text-white placeholder:text-mission-silver focus:glow-blue">
                        <SelectValue placeholder="Select a ping to respond to..." />
                      </SelectTrigger>
                      <SelectContent className="glass bg-mission-dark/95 border-mission-surface backdrop-blur-xl">
                        {allPings?.map((ping: Ping) => (
                          <SelectItem key={ping.id} value={ping.id.toString()} className="text-white hover:bg-mission-surface/50">
                            <div className="flex items-center space-x-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-mission-navy/20 text-mission-navy border border-mission-navy/30">
                                #{ping.id.toString().padStart(3, '0')}
                              </span>
                              <span className="text-mission-silver">•</span>
                              <span className="text-sm">{formatTimeAgo(ping.createdAt)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Coordinate Generation */}
                <div>
                  <Label className="bond-subtitle text-base font-medium text-white mb-3 block">Mission Coordinates</Label>
                  <div className="glass gradient-border rounded-xl p-6 bg-mission-surface/20">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="block text-xs font-medium text-mission-silver mb-2 uppercase tracking-wider">Latitude</Label>
                        <input
                          type="text"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          className="w-full glass bg-mission-dark/50 border-0 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-mission-silver/50 focus:glow-green transition-all-smooth"
                          placeholder="0.0000"
                        />
                      </div>
                      <div>
                        <Label className="block text-xs font-medium text-mission-silver mb-2 uppercase tracking-wider">Longitude</Label>
                        <input
                          type="text"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          className="w-full glass bg-mission-dark/50 border-0 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-mission-silver/50 focus:glow-green transition-all-smooth"
                          placeholder="0.0000"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={generateCoordinates}
                      className="text-mission-green hover:text-emerald-400 hover:bg-mission-green/10 text-sm font-medium rounded-lg transition-all-smooth group"
                    >
                      <svg className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      Generate New Coordinates
                    </Button>
                  </div>
                </div>

                {/* Optional Message */}
                <div>
                  <Label htmlFor="message" className="bond-subtitle text-base font-medium text-white mb-3 block">
                    Mission Notes
                    <span className="text-mission-silver/60 text-sm font-normal ml-2">(Optional)</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add any mission-specific notes or tactical information..."
                    className="glass gradient-border bg-mission-surface/20 border-0 text-white placeholder:text-mission-silver/50 focus:glow-green resize-none transition-all-smooth"
                    rows={4}
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={sendPingMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-mission-green to-emerald-500 hover:from-emerald-500 hover:to-mission-green text-white font-medium py-4 px-6 rounded-xl transition-all-smooth glow-green group"
                  >
                    {sendPingMutation.isPending ? (
                      <>
                        <svg className="w-5 h-5 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Transmitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                        </svg>
                        Transmit Ping
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="px-6 py-4 glass gradient-border bg-mission-surface/20 border-0 text-mission-silver hover:text-white hover:bg-mission-surface/40 rounded-xl transition-all-smooth"
                  >
                    Cancel Mission
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Transmission Preview */}
          <div>
            <div className="glass gradient-border rounded-2xl p-6 bg-mission-surface/20 sticky top-24">
              <h3 className="bond-title text-xl font-light text-white mb-4">Transmission Preview</h3>
              
              <div className="space-y-4">
                <div className="glass rounded-xl p-4 bg-mission-dark/40">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-mission-green rounded-full pulse-glow"></div>
                    <span className="text-sm font-medium text-mission-green uppercase tracking-wider">Preparing</span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-mission-silver">Agent:</span>
                      <span className="text-white font-medium">
                        {user?.firstName || user?.lastName 
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : "Agent 007"
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mission-silver">Coordinates:</span>
                      <span className="text-mission-green font-mono text-xs">{latitude || "0.0000"}, {longitude || "0.0000"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mission-silver">Timestamp:</span>
                      <span className="text-white">Now</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mission-silver">Protocol:</span>
                      <span className={`${pingType === "new" ? "text-mission-green" : "text-mission-blue"} font-medium`}>
                        {pingType === "new" ? "New Trail" : "Response"}
                      </span>
                    </div>
                    {pingType === "response" && parentPingId && (
                      <div className="flex justify-between">
                        <span className="text-mission-silver">Parent:</span>
                        <span className="text-mission-navy font-mono">#{parentPingId.padStart(3, '0')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="glass rounded-xl p-4 bg-mission-surface/10 border border-mission-green/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-mission-green" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                    <span className="text-xs font-medium text-mission-green uppercase tracking-wider">Encryption Status</span>
                  </div>
                  <p className="text-xs text-mission-silver leading-relaxed">
                    All transmissions are encrypted using quantum-resistant algorithms. Only authorized personnel with proper clearance can decrypt this data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
