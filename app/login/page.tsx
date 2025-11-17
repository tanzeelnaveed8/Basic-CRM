"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { ChartColumnBig } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  if (user) {
    router.push("/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(loginForm.email, loginForm.password);

    if (error) {
      toast.error("Login failed", { description: error.message });
    } else {
      toast.success("Welcome back!");
      router.push("/dashboard");
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signUp(
      signUpForm.email,
      signUpForm.password,
      signUpForm.fullName
    );

    if (error) {
      toast.error("Sign up failed", { description: error.message });
    } else {
      toast.success("Account created successfully!");
      router.push("/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-white to-red-200 relative overflow-hidden p-4">
      {/* Background Blur Circles */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <ChartColumnBig className="h-14 w-14 text-red-600 mb-3" />
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
            Make Your CRM With Us
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage clients, grow sales, and level up your business 🚀
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1 shadow-inner">
            <TabsTrigger
              value="login"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-600 rounded-lg transition-all"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-600 rounded-lg transition-all"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card className="backdrop-blur-md bg-white/70 border border-slate-200 shadow-xl mt-4">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Welcome Back
                </CardTitle>
                <CardDescription>
                  Sign in to access your CRM account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@company.com"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, password: e.target.value })
                      }
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-md"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup">
            <Card className="backdrop-blur-md bg-white/70 border border-slate-200 shadow-xl mt-4">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Create Account
                </CardTitle>
                <CardDescription>
                  Start your CRM journey today
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpForm.fullName}
                      onChange={(e) =>
                        setSignUpForm({
                          ...signUpForm,
                          fullName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@company.com"
                      value={signUpForm.email}
                      onChange={(e) =>
                        setSignUpForm({ ...signUpForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpForm.password}
                      onChange={(e) =>
                        setSignUpForm({
                          ...signUpForm,
                          password: e.target.value,
                        })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-md"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
