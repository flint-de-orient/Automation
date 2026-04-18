import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Welcome back, Alex!");
      navigate("/dashboard");
    }, 600);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-aurora">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-10 self-start">
          <Logo />
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">Sign in to Unibox</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage every lead from one beautiful inbox.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" defaultValue="alex@unibox.app" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs font-medium text-primary hover:underline">
                  Forgot?
                </a>
              </div>
              <Input id="password" type="password" placeholder="••••••••" defaultValue="demo1234" required />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to Unibox?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Demo build — any credentials will work.
        </p>
      </div>
    </div>
  );
}
