import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useJWTAuth } from "@/hooks/useJWTAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import SendPing from "@/pages/SendPing";
import AllPings from "@/pages/AllPings";
import TrailView from "@/pages/TrailView";

import { Skeleton } from "@/components/ui/skeleton";

function Router() {
  const { isAuthenticated, isLoading } = useJWTAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mission-black flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 bg-mission-surface/50" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 bg-mission-surface/50" />
            <Skeleton className="h-32 bg-mission-surface/50" />
            <Skeleton className="h-32 bg-mission-surface/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated ? (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/send-ping" component={SendPing} />
          <Route path="/all-pings" component={AllPings} />
          <Route path="/trails" component={TrailView} />
          <Route path="/security" component={SecurityDashboard} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
          <Route component={Landing} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
