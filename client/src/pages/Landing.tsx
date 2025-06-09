import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-mission-dark flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-mission-secondary border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-mission-green/20 rounded-full flex items-center justify-center">
                <i className="fas fa-satellite-dish text-mission-green text-2xl"></i>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-50 mb-2">Mission Control</h1>
            <p className="text-slate-400 mb-8">
              Secure ping transmission system for classified operations
            </p>
            
            <Button 
              onClick={handleLogin}
              className="w-full bg-mission-green hover:bg-emerald-600 text-white font-medium py-3"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Secure Login
            </Button>
            
            <div className="mt-6 text-xs text-slate-500 bg-slate-800/50 rounded p-3">
              <i className="fas fa-shield-alt mr-2"></i>
              Classified access only. Unauthorized access is prohibited.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
