"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { api } from "@/lib/client";

export function LoginForm({ next }) {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api("/api/auth/login", { method: "POST", body: form });
      const target = next && (res.role === "ADMIN" ? next.startsWith("/admin") : !next.startsWith("/admin")) ? next : res.redirect;
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <Field label="اسم المستخدم">
        <div className="relative">
          <Input
            autoFocus
            autoComplete="username"
            dir="ltr"
            className="pl-11 text-start"
            placeholder="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <span className="absolute inset-y-0 left-0 grid w-11 place-items-center text-muted pointer-events-none">
            <User className="size-4" />
          </span>
        </div>
      </Field>
      <Field label="كلمة المرور">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            autoComplete="current-password"
            dir="ltr"
            className="pl-11 text-left"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 left-0 grid w-11 place-items-center text-muted hover:text-fg"
            aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      {error && <div className="rounded-xl bg-coral-soft px-3.5 py-2.5 text-sm text-coral">{error}</div>}
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {!loading && <LogIn className="size-5" />}
        دخول
      </Button>
    </form>
  );
}
