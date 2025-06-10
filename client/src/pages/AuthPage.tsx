import { useState, useEffect } from "react";
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
import { useJWTAuth } from "@/hooks/useJWTAuth";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const { loginMutation, registerMutation, isAuthenticated } = useJWTAuth();
  const [, setLocation] = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

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
      console.log("Attempting login with data:", data);
      await loginMutation.mutateAsync(data);
      console.log("Login mutation successful, redirecting to dashboard");
      setLocation("/dashboard");
    } catch (error) {
      console.error("Login error in component:", error);
      // Error handling is already done in the mutation
    }
  };

  const onRegister = async (data: RegisterData) => {
    try {
      console.log("Attempting registration with data:", data);
      await registerMutation.mutateAsync(data);
      console.log("Registration mutation successful, redirecting to dashboard");
      setLocation("/dashboard");
    } catch (error) {
      console.error("Registration error in component:", error);
      // Error handling is already done in the mutation
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
            <Card className="glass gradient-border rounded-2xl overflow-hidden backdrop-blur-xl bg-mission-dark/20 border border-mission-green/30">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-mission-green to-mission-blue rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Login</h2>
                  <p className="text-mission-silver text-sm">
                    Enter your credentials to access MissionControl
                  </p>
                </div>
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-mission-silver font-medium">Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your username"
                              className="bg-mission-dark/60 border-mission-green/30 text-white placeholder:text-mission-silver/50 focus:border-mission-green focus:ring-2 focus:ring-mission-green/20 transition-all duration-200 pointer-events-auto relative z-50"
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
                          <FormLabel className="text-mission-silver font-medium">Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter your password"
                              className="bg-mission-dark/60 border-mission-green/30 text-white placeholder:text-mission-silver/50 focus:border-mission-green focus:ring-2 focus:ring-mission-green/20 transition-all duration-200 pointer-events-auto relative z-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full bg-gradient-to-r from-mission-green to-mission-blue hover:from-mission-blue hover:to-mission-green text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-mission-green/25 group cursor-pointer pointer-events-auto relative z-40"
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Register Form */}
            <Card className="glass gradient-border rounded-2xl overflow-hidden backdrop-blur-xl bg-mission-dark/20 border border-mission-gold/30">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-mission-gold to-mission-green rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L9 7V9C7.9 9 7 9.9 7 11V16L15 22L23 16V11C23 9.9 22.1 9 21 9Z"/>
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Sign Up</h2>
                  <p className="text-mission-silver text-sm">
                    Create your account to join MissionControl
                  </p>
                </div>
                
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-mission-silver font-medium">Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Choose a username"
                              className="bg-mission-dark/60 border-mission-gold/30 text-white placeholder:text-mission-silver/50 focus:border-mission-gold focus:ring-2 focus:ring-mission-gold/20 transition-all duration-200 pointer-events-auto relative z-50"
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
                          <FormLabel className="text-mission-silver font-medium">Email (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.email@example.com"
                              className="bg-mission-dark/60 border-mission-gold/30 text-white placeholder:text-mission-silver/50 focus:border-mission-gold focus:ring-2 focus:ring-mission-gold/20 transition-all duration-200 pointer-events-auto relative z-50"
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
                            <FormLabel className="text-mission-silver font-medium">First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="First name"
                                className="bg-mission-dark/60 border-mission-gold/30 text-white placeholder:text-mission-silver/50 focus:border-mission-gold focus:ring-2 focus:ring-mission-gold/20 transition-all duration-200 pointer-events-auto relative z-50"
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
                            <FormLabel className="text-mission-silver font-medium">Last Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Last name"
                                className="bg-mission-dark/60 border-mission-gold/30 text-white placeholder:text-mission-silver/50 focus:border-mission-gold focus:ring-2 focus:ring-mission-gold/20 transition-all duration-200 pointer-events-auto relative z-50"
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
                          <FormLabel className="text-mission-silver font-medium">Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Choose a secure password"
                              className="bg-mission-dark/60 border-mission-gold/30 text-white placeholder:text-mission-silver/50 focus:border-mission-gold focus:ring-2 focus:ring-mission-gold/20 transition-all duration-200 pointer-events-auto relative z-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full bg-gradient-to-r from-mission-gold to-mission-green hover:from-mission-green hover:to-mission-gold text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-mission-gold/25 group cursor-pointer pointer-events-auto relative z-40"
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Sign Up"}
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