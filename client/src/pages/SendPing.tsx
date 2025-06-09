import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
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
    <div className="min-h-screen bg-mission-dark text-slate-50">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-50 mb-2">Send Ping Transmission</h2>
          <p className="text-slate-400">Create a new secure transmission with coordinates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-mission-secondary rounded-lg p-6 border border-slate-700">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Ping Type Selection */}
                <div>
                  <Label className="text-sm font-medium text-slate-300 mb-3 block">Transmission Type</Label>
                  <RadioGroup value={pingType} onValueChange={(value: "new" | "response") => setPingType(value)}>
                    <div className="grid grid-cols-2 gap-4">
                      <Label className="relative">
                        <RadioGroupItem value="new" className="sr-only" />
                        <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          pingType === "new" 
                            ? "border-mission-green bg-mission-green/10" 
                            : "border-slate-600"
                        }`}>
                          <div className="flex items-center space-x-3">
                            <i className="fas fa-plus-circle text-mission-green"></i>
                            <div>
                              <p className="font-medium text-slate-50">New Trail</p>
                              <p className="text-sm text-slate-400">Start a new ping trail</p>
                            </div>
                          </div>
                        </div>
                      </Label>
                      
                      <Label className="relative">
                        <RadioGroupItem value="response" className="sr-only" />
                        <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          pingType === "response" 
                            ? "border-mission-green bg-mission-green/10" 
                            : "border-slate-600"
                        }`}>
                          <div className="flex items-center space-x-3">
                            <i className="fas fa-reply text-mission-green"></i>
                            <div>
                              <p className="font-medium text-slate-50">Response</p>
                              <p className="text-sm text-slate-400">Reply to existing ping</p>
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Parent Ping Selection */}
                {pingType === "response" && (
                  <div>
                    <Label htmlFor="parentPing" className="block text-sm font-medium text-slate-300 mb-2">
                      Select Previous Ping to Respond To
                    </Label>
                    <Select value={parentPingId} onValueChange={setParentPingId}>
                      <SelectTrigger className="w-full bg-mission-dark border-slate-600 text-slate-50">
                        <SelectValue placeholder="Select a ping..." />
                      </SelectTrigger>
                      <SelectContent className="bg-mission-dark border-slate-600">
                        {allPings?.map((ping: Ping) => (
                          <SelectItem key={ping.id} value={ping.id.toString()}>
                            Ping #{ping.id.toString().padStart(3, '0')} - {formatTimeAgo(ping.createdAt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Coordinate Generation */}
                <div>
                  <Label className="block text-sm font-medium text-slate-300 mb-3">Mission Coordinates</Label>
                  <div className="bg-mission-dark rounded-lg p-4 border border-slate-600">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="block text-xs font-medium text-slate-400 mb-2">Latitude</Label>
                        <input
                          type="text"
                          value={latitude}
                          readOnly
                          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-200 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <Label className="block text-xs font-medium text-slate-400 mb-2">Longitude</Label>
                        <input
                          type="text"
                          value={longitude}
                          readOnly
                          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-200 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={generateCoordinates}
                      className="text-mission-green hover:text-emerald-400 text-sm font-medium p-0 h-auto"
                    >
                      <i className="fas fa-dice mr-2"></i>
                      Generate New Coordinates
                    </Button>
                  </div>
                </div>

                {/* Optional Message */}
                <div>
                  <Label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
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
                        {user?.firstName || user?.lastName 
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : "Agent 007"
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
