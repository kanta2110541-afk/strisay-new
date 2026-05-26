"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-green-600 tracking-tight">
            Striday
          </h1>
          <p className="text-slate-500 text-sm">毎日一歩、着実に前へ</p>
        </div>

        <div className="space-y-4">
          <p className="text-slate-600 text-center text-sm">
            TOEIC700点を目指す、5分間の英単語学習
          </p>
          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base rounded-xl"
          >
            Googleでログイン
          </Button>
        </div>

        <p className="text-slate-400 text-xs text-center">
          毎日少しずつ積み上げる。それだけでいい。
        </p>
      </div>
    </div>
  );
}
