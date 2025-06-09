import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ThreeBackground from "@/components/ThreeBackground";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-mission-black relative overflow-hidden">
      {/* Three.js Background Animation */}
      <ThreeBackground scene="particles" className="z-0" />
      
      {/* Hexagon overlay pattern */}
      <div className="absolute inset-0 hexagon-pattern opacity-30 z-10 pointer-events-none"></div>
      
      {/* Scan lines effect */}
      <div className="absolute inset-0 scan-lines z-20 pointer-events-none"></div>
      
      {/* Main content */}
      <div className="relative z-30 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-mission-green via-mission-gold to-mission-blue rounded-full flex items-center justify-center glow-green pulse-glow">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-mission-green via-mission-gold to-mission-blue rounded-full animate-ping opacity-20"></div>
              </div>
            </div>
            
            <h1 className="bond-title text-4xl font-light text-white mb-3">
              MissionControl
            </h1>
            <p className="bond-subtitle text-mission-silver text-lg mb-2">
              Classified Operations Network
            </p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-mission-green to-transparent mx-auto"></div>
          </div>

          {/* Login card */}
          <Card className="glass gradient-border rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">Secure Access Portal</h2>
                <p className="text-mission-silver text-sm mb-8">
                  Enter your credentials to access the ping transmission system
                </p>
                
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-mission-green to-mission-blue hover:from-mission-blue hover:to-mission-green text-white font-medium py-4 rounded-xl transition-all-smooth glow-green group cursor-pointer pointer-events-auto relative z-40"
                >
                  <svg className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  Initialize Secure Connection
                </Button>
                
                {/* Security badges */}
                <div className="flex justify-center space-x-4 mt-6">
                  <div className="flex items-center space-x-2 text-xs text-mission-silver">
                    <div className="w-2 h-2 bg-mission-green rounded-full pulse-glow"></div>
                    <span>ENCRYPTED</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-mission-silver">
                    <div className="w-2 h-2 bg-mission-gold rounded-full pulse-glow"></div>
                    <span>VERIFIED</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-mission-silver">
                    <div className="w-2 h-2 bg-mission-blue rounded-full pulse-glow"></div>
                    <span>SECURE</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Bottom warning */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-mission-silver/70 bg-mission-dark/50 rounded-full px-4 py-2 backdrop-blur-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
              <span>CLASSIFIED: Level 9 Security Clearance Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
