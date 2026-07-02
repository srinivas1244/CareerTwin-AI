"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function finish() {
      // `detectSessionInUrl` on the Supabase client parses the OAuth redirect
      // and establishes the session before this resolves.
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      router.replace(data.session ? "/dashboard" : "/login");
    }
    finish();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="grid flex-1 place-items-center py-32">
      <Loader2 className="h-6 w-6 animate-spin text-muted" />
    </div>
  );
}
