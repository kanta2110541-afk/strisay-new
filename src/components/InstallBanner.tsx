"use client";

import { useEffect, useState } from "react";

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa_banner_dismissed");
    if (dismissed) {
      const dismissedAt = Number(dismissed);
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void });
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    deferredPrompt?.prompt();
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_banner_dismissed", String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-slate-800 border border-slate-600 rounded-2xl p-4 flex items-center justify-between shadow-lg z-50 max-w-lg mx-auto">
      <div className="space-y-0.5">
        <p className="text-white text-sm font-medium">ホーム画面に追加</p>
        <p className="text-slate-400 text-xs">アプリとして使えます</p>
      </div>
      <div className="flex gap-2">
        <button onClick={handleDismiss} className="text-slate-400 text-xs px-3 py-1.5">後で</button>
        <button onClick={handleInstall} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg">追加</button>
      </div>
    </div>
  );
}
