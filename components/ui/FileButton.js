"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { uploadFile } from "@/lib/client";
import { Button } from "./Button";

/** Uploads one or more files to /api/uploads and reports each result via onUploaded. */
export function FileButton({ onUploaded, accept, multiple = false, label = "رفع ملف", variant = "secondary", size = "sm", className }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  async function onChange(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        const uploaded = await uploadFile(file);
        onUploaded?.(uploaded);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input ref={input} type="file" hidden accept={accept} multiple={multiple} onChange={onChange} />
      <Button type="button" variant={variant} size={size} loading={busy} onClick={() => input.current?.click()} className={className}>
        {!busy && <Upload className="size-4" />}
        {label}
      </Button>
    </>
  );
}
