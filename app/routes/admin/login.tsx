import "~/admin.css";

import { Form, redirect, useNavigation } from "react-router";

import type { Route } from "./+types/login";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getSessionUser, signIn } from "~/lib/admin";

// Only same-site admin paths are allowed as the post-login destination.
function safeNext(url: string) {
  const next = new URL(url).searchParams.get("next") ?? "/admin";
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  if (await getSessionUser()) throw redirect(safeNext(request.url));
  return null;
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return null;
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const error = await signIn(email, password);
  if (error) {
    return {
      error:
        error === "Invalid login credentials"
          ? "That email and password don’t match an account."
          : error,
    };
  }
  throw redirect(safeNext(request.url));
}

export function meta() {
  return [{ title: "Sign in - Admin - American Sentinel" }, { name: "robots", content: "noindex" }];
}

export default function Login({ actionData }: Route.ComponentProps) {
  const busy = useNavigation().state !== "idle";
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">American Sentinel admin</CardTitle>
          <CardDescription>Sign in with your staff account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {actionData?.error && (
              <p role="alert" className="text-sm text-destructive">
                {actionData.error}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
