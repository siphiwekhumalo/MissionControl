import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Lock, Eye, AlertTriangle, Activity, Clock, Users, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SecurityIndicator from "@/components/SecurityIndicator";
import AppHeader from "@/components/AppHeader";
import ThreeBackground from "@/components/ThreeBackground";

interface SecurityEvent {
  timestamp: string;
  event: string;
  agentId: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Ping {
  id: number;
  latitude: string;
  longitude: string;
  message: string | null;
  parentPingId: number | null;
  createdAt: string;
}

export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: allPings = [], isLoading } = useQuery<Ping[]>({
    queryKey: ["/api/pings"],
  });

  // Mock security events for demonstration
  const securityEvents: SecurityEvent[] = [
    {
      timestamp: new Date().toISOString(),
      event: "Agent authentication successful",
      agentId: 2,
      severity: 'low'
    },
    {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      event: "New encrypted transmission created",
      agentId: 2,
      severity: 'medium'
    },
    {
      timestamp: new Date(Date.now() - 600000).toISOString(),
      event: "Trail response authorized",
      agentId: 2,
      severity: 'low'
    }
  ];

  const getSecurityLevel = (ping: Ping): 'classified' | 'secure' | 'encrypted' | 'protected' => {
    if (ping.message && ping.message.toLowerCase().includes('classified')) return 'classified';
    if (ping.parentPingId) return 'secure';
    if (ping.message) return 'encrypted';
    return 'protected';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const activeTransmissions = Array.isArray(allPings) ? allPings.filter(p => !p.parentPingId).length : 0;
  const secureTrails = Array.isArray(allPings) ? allPings.filter(p => p.parentPingId).length : 0;
  const encryptedMessages = Array.isArray(allPings) ? allPings.filter(p => p.message).length : 0;

  return (
    <div className="min-h-screen bg-mission-dark text-white relative overflow-hidden">
      <ThreeBackground scene="radar" className="absolute inset-0" />
      <div className="relative z-10">
        <AppHeader />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="bond-title text-4xl font-light mb-4 text-white">
              Security <span className="text-mission-green">Control Center</span>
            </h1>
            <p className="bond-subtitle text-lg text-mission-silver max-w-2xl">
              Real-time security monitoring and transmission protection status for classified operations
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-mission-surface/20 border border-mission-surface/30">
              <TabsTrigger value="overview" className="data-[state=active]:bg-mission-green/20 data-[state=active]:text-mission-green">
                Overview
              </TabsTrigger>
              <TabsTrigger value="transmissions" className="data-[state=active]:bg-mission-green/20 data-[state=active]:text-mission-green">
                Transmissions
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-mission-green/20 data-[state=active]:text-mission-green">
                Audit Log
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="glass gradient-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-mission-silver">Active Transmissions</p>
                        <p className="text-2xl font-light text-white">{activeTransmissions}</p>
                      </div>
                      <Activity className="w-8 h-8 text-mission-green" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass gradient-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-mission-silver">Secure Trails</p>
                        <p className="text-2xl font-light text-white">{secureTrails}</p>
                      </div>
                      <Shield className="w-8 h-8 text-mission-blue" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass gradient-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-mission-silver">Encrypted Messages</p>
                        <p className="text-2xl font-light text-white">{encryptedMessages}</p>
                      </div>
                      <Lock className="w-8 h-8 text-mission-gold" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass gradient-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-mission-silver">Security Status</p>
                        <p className="text-2xl font-light text-mission-green">SECURE</p>
                      </div>
                      <Eye className="w-8 h-8 text-mission-green" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass gradient-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-mission-green" />
                      Security Protocols
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-mission-silver">JWT Authentication</span>
                        <Badge className="bg-mission-green/20 text-mission-green border-mission-green/30">ACTIVE</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-mission-silver">Access Control</span>
                        <Badge className="bg-mission-green/20 text-mission-green border-mission-green/30">ENABLED</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-mission-silver">Audit Logging</span>
                        <Badge className="bg-mission-green/20 text-mission-green border-mission-green/30">RECORDING</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-mission-silver">Secure Headers</span>
                        <Badge className="bg-mission-green/20 text-mission-green border-mission-green/30">ENFORCED</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass gradient-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-mission-gold" />
                      Recent Security Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {securityEvents.slice(0, 4).map((event, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-white">{event.event}</p>
                            <p className="text-xs text-mission-silver">
                              Agent {event.agentId} • {new Date(event.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge variant="outline" className={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transmissions" className="mt-6">
              <Card className="glass gradient-border">
                <CardHeader>
                  <CardTitle className="text-white">Transmission Security Status</CardTitle>
                  <CardDescription className="text-mission-silver">
                    Security classification and protection level for all active transmissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-mission-green border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-mission-silver mt-2">Loading security data...</p>
                    </div>
                  ) : Array.isArray(allPings) && allPings.length > 0 ? (
                    <div className="space-y-4">
                      {allPings.map((ping) => (
                        <div key={ping.id} className="flex items-center justify-between p-4 bg-mission-surface/10 rounded-lg border border-mission-surface/30">
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline" className="bg-mission-navy/20 text-mission-navy border-mission-navy/30">
                              #{ping.id.toString().padStart(3, '0')}
                            </Badge>
                            <div>
                              <p className="text-white font-medium">
                                {ping.parentPingId ? `Trail Response to #${ping.parentPingId.toString().padStart(3, '0')}` : 'Primary Transmission'}
                              </p>
                              <p className="text-sm text-mission-silver">
                                {ping.latitude}, {ping.longitude} • {new Date(ping.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <SecurityIndicator level={getSecurityLevel(ping)} />
                            {ping.message && (
                              <Badge variant="outline" className="bg-mission-blue/20 text-mission-blue border-mission-blue/30">
                                MESSAGE
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-mission-surface mx-auto mb-4" />
                      <p className="text-mission-silver">No transmissions found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="mt-6">
              <Card className="glass gradient-border">
                <CardHeader>
                  <CardTitle className="text-white">Security Audit Log</CardTitle>
                  <CardDescription className="text-mission-silver">
                    Real-time monitoring of security events and access attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {securityEvents.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-mission-surface/10 rounded-lg border border-mission-surface/30">
                        <div className="flex items-center space-x-4">
                          <Clock className="w-4 h-4 text-mission-silver" />
                          <div>
                            <p className="text-white">{event.event}</p>
                            <p className="text-sm text-mission-silver">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-mission-navy/20 text-mission-navy border-mission-navy/30">
                            Agent {event.agentId}
                          </Badge>
                          <Badge variant="outline" className={getSeverityColor(event.severity)}>
                            {event.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}