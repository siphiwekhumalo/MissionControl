import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import ThreeBackground from "@/components/ThreeBackground";
import { registerSchema, loginSchema, type RegisterData, type LoginData } from "@shared/schema";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = async (data: LoginData) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const result = await response.json();
      
      // Store token in localStorage
      localStorage.setItem("token", result.token);
      
      toast({
        title: "Login successful",
        description: "Welcome back, agent!",
      });

      // Redirect to dashboard
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const onRegister = async (data: RegisterData) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const result = await response.json();
      
      // Store token in localStorage
      localStorage.setItem("token", result.token);
      
      toast({
        title: "Registration successful",
        description: "Welcome to MissionControl!",
      });

      // Redirect to dashboard
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
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
        <div className="w-full max-w-4xl">
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

          {/* Auth forms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Login Form */}
            <Card className="glass gradient-border rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">Agent Login</h2>
                  <p className="text-mission-silver text-sm">
                    Access your secure mission dashboard
                  </p>
                </div>
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-mission-silver">Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your username"
                              className="bg-mission-surface/50 border-mission-surface text-white placeholder:text-mission-silver/50 pointer-events-auto relative z-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-mission-silver">Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter your password"
                              className="bg-mission-surface/50 border-mission-surface text-white placeholder:text-mission-silver/50 pointer-events-auto relative z-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit"
                      disabled={loginForm.formState.isSubmitting}
                      className="w-full bg-gradient-to-r from-mission-green to-mission-blue hover:from-mission-blue hover:to-mission-green text-white font-medium py-3 rounded-xl transition-all-smooth glow-green group cursor-pointer pointer-events-auto relative z-40"
                    >
                      {loginForm.formState.isSubmitting ? "Authenticating..." : "Initialize Secure Connection"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Register Form */}
            <Card className="glass gradient-border rounded-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">Agent Registration</h2>
                  <p className="text-mission-silver text-sm">
                    Join the classified operations network
                  </p>
                </div>
                
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-mission-silver">Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Choose a username"
                              className="bg-mission-surface/50 border-mission-surface text-white placeholder:text-mission-silver/50 pointer-events-auto relative z-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-mission-silver">Email (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.email@example.com"
                              className="bg-mission-surface/50 border-mission-surface text-white placeholder:text-mission-silver/50 pointer-events-auto relative z-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-mission-silver">First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="First name"
                                className="bg-mission-surface/50 border-mission-surface text-white placeholder:text-mission-silver/50 pointer-events-auto relative z-50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-mission-silver">Last Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Last name"
                                className="bg-mission-surface/50 border-mission-surface text-white placeholder:text-mission-silver/50 pointer-events-auto relative z-50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-mission-silver">Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Choose a secure password"
                              className="bg-mission-surface/50 border-mission-surface text-white placeholder:text-mission-silver/50 pointer-events-auto relative z-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit"
                      disabled={registerForm.formState.isSubmitting}
                      className="w-full bg-gradient-to-r from-mission-gold to-mission-green hover:from-mission-green hover:to-mission-gold text-white font-medium py-3 rounded-xl transition-all-smooth glow-gold group cursor-pointer pointer-events-auto relative z-40"
                    >
                      {registerForm.formState.isSubmitting ? "Creating Account..." : "Establish Agent Credentials"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
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