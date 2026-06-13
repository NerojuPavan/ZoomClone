"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/dashboard/FormField";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi } from "@/services/auth-api";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isReady, enterGuest } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      router.replace("/dashboard");
    }
  }, [isReady, user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const authUser = await authApi.login({
        username: username.trim(),
        password,
      });
      login(authUser);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuest = () => {
    enterGuest();
    router.push("/dashboard");
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back — enter your credentials"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
          {" · "}
          <button
            type="button"
            onClick={handleGuest}
            className="font-medium text-primary hover:underline"
          >
            Continue as guest
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          id="login-username"
          label="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          autoComplete="username"
        />
        <FormField
          id="login-password"
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="h-11 w-full rounded-md bg-primary font-semibold hover:bg-primary/90"
          disabled={isSubmitting || !username.trim() || !password}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
