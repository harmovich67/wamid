"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { api } from "@/lib/client";

export function ProfileForm({ user }) {
  const router = useRouter();
  const [profile, setProfile] = useState(user);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(null);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving("profile");
    try {
      await api("/api/me", { method: "PATCH", body: profile });
      toast.success("تم حفظ التغييرات");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error("كلمتا المرور غير متطابقتين");
    setSaving("password");
    try {
      await api("/api/me", { method: "PATCH", body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } });
      toast.success("تم تغيير كلمة المرور");
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={saveProfile} className="space-y-4 rounded-[2rem] border border-line bg-surface p-6 shadow-card">
        <h3 className="font-semibold">بياناتي</h3>
        <Field label="الاسم">
          <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
        </Field>
        <Field label="الصورة الرمزية">
          <AvatarPicker
            color={profile.avatarColor}
            avatar={profile.avatar}
            onChange={({ avatarColor, avatar }) => setProfile({ ...profile, avatarColor, avatar })}
          />
        </Field>
        <Button type="submit" loading={saving === "profile"}>حفظ</Button>
      </form>

      <form onSubmit={savePassword} className="space-y-4 rounded-[2rem] border border-line bg-surface p-6 shadow-card">
        <h3 className="font-semibold">تغيير كلمة المرور</h3>
        <Field label="كلمة المرور الحالية">
          <Input type="password" dir="ltr" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
        </Field>
        <Field label="كلمة المرور الجديدة" hint="6 أحرف على الأقل">
          <Input type="password" dir="ltr" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required minLength={6} />
        </Field>
        <Field label="تأكيد كلمة المرور">
          <Input type="password" dir="ltr" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
        </Field>
        <Button type="submit" variant="secondary" loading={saving === "password"}>تغيير</Button>
      </form>
    </div>
  );
}
