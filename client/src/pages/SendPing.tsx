import { useEffect, useState } from "react";
import { useJWTAuth } from "@/hooks/useJWTAuth";
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
  const { isAuthenticated, isLoading: authLoading, user } = useJWTAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [pingType, setPingType] = useState<"new" | "response">("new");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState("");
  const [parentPingId, setParentPingId] = useState<string>("");
  const [isGeneratingCoords, setIsGeneratingCoords] = useState(false);
  const [coordinateSource, setCoordinateSource] = useState<"manual" | "gps" | "random">("random");

  // Check for parent parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const parentId = urlParams.get('parent');
    if (parentId) {
      setPingType("response");
      setParentPingId(parentId);
    }
  }, []);

  // Redirect to auth if not authenticated (but wait for auth to complete)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const { data: allPings } = useQuery<Ping[]>({
    queryKey: ["/api/pings"],
    enabled: isAuthenticated,
  });

  const generateCoordinates = async () => {
    setIsGeneratingCoords(true);
    
    if (coordinateSource === "gps") {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        setLatitude(position.coords.latitude.toFixed(4));
        setLongitude(position.coords.longitude.toFixed(4));
        toast({
          title: "GPS Location Acquired",
          description: "Real coordinates captured successfully.",
        });
      } catch (error) {
        toast({
          title: "GPS Failed",
          description: "Falling back to tactical coordinates.",
          variant: "destructive",
        });
        generateRandomCoordinates();
      }
    } else {
      generateRandomCoordinates();
    }
    
    setIsGeneratingCoords(false);
  };

  const generateRandomCoordinates = () => {
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

    if (pingType === "response" && (!allPings || allPings.length === 0)) {
      toast({
        title: "No Transmissions Available",
        description: "No transmissions available for response.",
        variant: "destructive",
      });
      return;
    }

    const pingData: any = {
      latitude,
      longitude,
    };
    
    if (message) {
      pingData.message = message;
    }
    
    if (pingType === "response" && Array.isArray(allPings) && (allPings as Ping[]).length > 0) {
      pingData.parentPingId = (allPings as Ping[])[0].id;
    }
    
    sendPingMutation.mutate(pingData);
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

                {/* Latest Ping Response */}
                {pingType === "response" && (
                  <div>
                    <Label className="bond-subtitle text-base font-medium text-white mb-4 block">
                      Response Target
                    </Label>
                    {Array.isArray(allPings) && allPings.length > 0 ? (
                      <div className="glass gradient-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-medium text-mission-silver mb-1">Responding to Latest Transmission</p>
                            <p className="text-lg font-semibold text-white">
                              Ping #{allPings[0].id.toString().padStart(3, '0')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-mission-green rounded-full pulse-glow"></div>
                            <span className="text-xs text-mission-green">LATEST</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-mission-silver mb-1">Coordinates</p>
                            <p className="text-white font-mono">
                              {allPings[0].latitude}, {allPings[0].longitude}
                            </p>
                          </div>
                          <div>
                            <p className="text-mission-silver mb-1">Timestamp</p>
                            <p className="text-white">{formatTimeAgo(allPings[0].createdAt)}</p>
                          </div>
                        </div>
                        
                        {allPings[0].message && (
                          <div className="mt-4 pt-4 border-t border-mission-surface/50">
                            <p className="text-mission-silver text-xs mb-1">Original Message</p>
                            <p className="text-white text-sm italic">"{allPings[0].message}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="glass gradient-border rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-mission-surface/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-mission-silver" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                          </svg>
                        </div>
                        <p className="text-mission-silver">No transmissions available for response</p>
                        <p className="text-sm text-mission-silver/60 mt-2">Create a new transmission instead</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Coordinate Generation */}
                <div>
                  <Label className="bond-subtitle text-base font-medium text-white mb-4 block">Mission Coordinates</Label>
                  
                  {/* Coordinate Source Selection */}
                  <div className="mb-6">
                    <Label className="text-sm text-mission-silver mb-3 block">Coordinate Source</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant={coordinateSource === "random" ? "default" : "outline"}
                        onClick={() => setCoordinateSource("random")}
                        className={`h-auto p-4 flex-col space-y-2 ${
                          coordinateSource === "random" 
                            ? "bg-mission-green/20 border-mission-green text-mission-green hover:bg-mission-green/30" 
                            : "border-mission-surface text-mission-silver hover:border-mission-green hover:text-mission-green"
                        }`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                        <span className="text-xs">Tactical</span>
                      </Button>
                      
                      <Button
                        type="button"
                        variant={coordinateSource === "gps" ? "default" : "outline"}
                        onClick={() => setCoordinateSource("gps")}
                        className={`h-auto p-4 flex-col space-y-2 ${
                          coordinateSource === "gps" 
                            ? "bg-mission-blue/20 border-mission-blue text-mission-blue hover:bg-mission-blue/30" 
                            : "border-mission-surface text-mission-silver hover:border-mission-blue hover:text-mission-blue"
                        }`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span className="text-xs">GPS</span>
                      </Button>
                      
                      <Button
                        type="button"
                        variant={coordinateSource === "manual" ? "default" : "outline"}
                        onClick={() => setCoordinateSource("manual")}
                        className={`h-auto p-4 flex-col space-y-2 ${
                          coordinateSource === "manual" 
                            ? "bg-mission-gold/20 border-mission-gold text-mission-gold hover:bg-mission-gold/30" 
                            : "border-mission-surface text-mission-silver hover:border-mission-gold hover:text-mission-gold"
                        }`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        <span className="text-xs">Manual</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="glass gradient-border rounded-xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label className="text-sm font-medium text-mission-silver mb-2 block">Latitude</Label>
                        <input
                          type="text"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          disabled={coordinateSource !== "manual"}
                          className="w-full bg-mission-surface/50 border border-mission-surface rounded-lg px-4 py-3 text-white font-mono text-sm placeholder-mission-silver/50 focus:border-mission-green focus:ring-1 focus:ring-mission-green transition-colors disabled:opacity-50"
                          placeholder="0.0000"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-mission-silver mb-2 block">Longitude</Label>
                        <input
                          type="text"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          disabled={coordinateSource !== "manual"}
                          className="w-full bg-mission-surface/50 border border-mission-surface rounded-lg px-4 py-3 text-white font-mono text-sm placeholder-mission-silver/50 focus:border-mission-green focus:ring-1 focus:ring-mission-green transition-colors disabled:opacity-50"
                          placeholder="0.0000"
                        />
                      </div>
                    </div>
                    
                    {coordinateSource !== "manual" && (
                      <Button
                        type="button"
                        onClick={generateCoordinates}
                        disabled={isGeneratingCoords}
                        className="w-full bg-gradient-to-r from-mission-green to-mission-blue hover:from-mission-green/80 hover:to-mission-blue/80 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingCoords ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Acquiring Coordinates...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                            <span>
                              {coordinateSource === "gps" ? "Acquire GPS Location" : "Generate Tactical Coordinates"}
                            </span>
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Optional Message */}
                <div>
                  <Label htmlFor="message" className="bond-subtitle text-base font-medium text-white mb-4 block">
                    Mission Notes (Optional)
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add any mission-specific notes..."
                    className="bg-mission-dark border-slate-600 text-slate-50 placeholder-slate-500 focus:border-mission-green"
                    rows={3}
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={sendPingMutation.isPending}
                    className="flex-1 bg-mission-green hover:bg-emerald-600 text-white font-medium py-3 px-6"
                  >
                    {sendPingMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Transmitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Transmit Ping
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="px-6 py-3 border-slate-600 text-slate-300 hover:text-slate-50 hover:border-slate-500"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
          </div>

          {/* Transmission Preview */}
          <div>
            <div className="bg-mission-secondary rounded-lg p-6 border border-slate-700 sticky top-24">
              <h3 className="text-lg font-semibold text-slate-50 mb-4">Transmission Preview</h3>
              
              <div className="space-y-4">
                <div className="bg-mission-dark rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-mission-green rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-mission-green">PREPARING</span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-400">Agent:</span>
                      <span className="text-slate-200 ml-2">
                        {user && (user.firstName || user.lastName)
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : user?.username || "Agent 007"
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Coordinates:</span>
                      <span className="text-slate-200 ml-2 font-mono">{latitude}, {longitude}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Timestamp:</span>
                      <span className="text-slate-200 ml-2">Now</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Type:</span>
                      <span className="text-slate-200 ml-2">{pingType === "new" ? "New Trail" : "Response"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-slate-500 bg-slate-800/50 rounded p-3">
                  <i className="fas fa-shield-alt mr-2"></i>
                  All transmissions are encrypted and secure. Only you and authorized personnel can view this data.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
