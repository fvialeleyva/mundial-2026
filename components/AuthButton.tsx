"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.events",
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-hairline animate-pulse" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full border-2 border-ink"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-cobalt border-2 border-ink flex items-center justify-center font-display font-[800] text-[13px] text-cream">
            {user.email?.charAt(0).toUpperCase()}
          </div>
        )}
        <button
          onClick={signOut}
          className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-muted hover:text-ink transition-colors cursor-pointer"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border-2 border-ink bg-card text-ink font-mono text-[9px] font-bold uppercase tracking-[0.08em] hover:bg-card-2 transition-colors cursor-pointer shadow-hard-ink"
    >
      <span className="w-4 h-4 rounded-full bg-cobalt flex items-center justify-center text-cream font-bold text-[8px] shrink-0">G</span>
      Entrar
    </button>
  );
}
