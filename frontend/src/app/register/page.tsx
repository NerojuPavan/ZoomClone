"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/dashboard/FormField";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { authApi } from "@/services/auth-api";

export default function RegisterPage() {
  const router = useRouter();
  const { login, user, isReady, enterGuest } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      router.replace("/dashboard");
    }
  }, [isReady, user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !email.trim() || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const authUser = await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });
      login(authUser);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
      title="Create account"
      subtitle="Register to access your meetings dashboard"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
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
          id="register-username"
          label="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Choose a username"
          autoComplete="username"
        />
        <FormField
          id="register-email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <FormField
          id="register-password"
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
        <FormField
          id="register-confirm-password"
          label="Re-enter password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          autoComplete="new-password"
        />
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="h-11 w-full rounded-md bg-primary font-semibold hover:bg-primary/90"
          disabled={
            isSubmitting ||
            !username.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Register
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
