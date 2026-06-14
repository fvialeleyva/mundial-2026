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

  if (loading) return <div className="w-8 h-8 rounded-full bg-espresso-border animate-pulse" />;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.user_metadata?.avatar_url && (
          <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full" />
        )}
        <button
          onClick={signOut}
          className="text-xs text-muted hover:text-crema transition-colors cursor-pointer"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-verde/30 bg-verde/10 text-verde text-xs font-semibold hover:bg-verde/20 transition-colors cursor-pointer"
    >
      <span>🔑</span> Entrar con Google
    </button>
  );
}
