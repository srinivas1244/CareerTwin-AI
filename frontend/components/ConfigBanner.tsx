"use client";

import { AlertTriangle } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export function ConfigBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-5 py-2 text-center text-sm text-amber-200">
      <AlertTriangle className="mr-2 inline h-4 w-4" />
      Supabase env vars are missing. Copy{" "}
      <code className="rounded bg-black/30 px-1">.env.local.example</code> to{" "}
      <code className="rounded bg-black/30 px-1">.env.local</code> and add your keys.
    </div>
  );
}
