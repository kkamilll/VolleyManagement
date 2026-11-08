'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare, ArrowUpRight } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // Check dismissed in localStorage (dismissed for 3 days)
    const lastDismissed = localStorage.getItem('angels_pwa_dismissed');
    if (lastDismissed) {
      const timeDiff = Date.now() - Number(lastDismissed);
      if (timeDiff < 3 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    } else {
      setDismissed(false);
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleOpenModal = () => {
      setShowModal(true);
    };
    window.addEventListener('open-pwa-install', handleOpenModal);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenModal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowModal(false);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('angels_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner for Mobile Browsers */}
      {!dismissed && (
        <aside 
          aria-label="Instalacja aplikacji Angels ZTP"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-[#0c1016]/95 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 p-0.5 overflow-hidden shrink-0 shadow-md">
              <img src="/logo.jpg" alt="Angels ZTP" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Angels ZTP</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  App
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dodaj do ekranu telefonu jak natywną aplikację.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition flex items-center gap-1 shadow-md shadow-sky-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instaluj</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-500 hover:text-white rounded-lg"
              title="Zamknij powiadomienie"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Instructional Modal (iOS Safari & Android Guide) */}
      {showModal && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700 shadow-md">
                  <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 id="pwa-install-title" className="text-sm font-black uppercase text-white">Instalacja Angels ZTP</h3>
                  <span className="text-[10px] text-slate-400">Tryb Progressive Web App (PWA)</span>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white font-black text-lg"
              >
                ✕
              </button>
            </div>

            {/* iOS Instructions */}
            {isIOS ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300">
                  Na systemie iOS (iPhone / iPad) w przeglądarce <strong>Safari</strong> dodasz aplikację w 3 prostych krokach:
                </p>

                <div className="space-y-3 bg-[#07090d] p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-white">Kliknij przycisk Udostępnij</p>
                      <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                        Ikona <Share className="w-3.5 h-3.5 text-sky-400 inline" /> na dolnym pasku przeglądarki Safari.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-white">Wybierz &quot;Do ekranu początkowego&quot;</p>
                      <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                        Przewiń menu w dół i kliknij <PlusSquare className="w-3.5 h-3.5 text-sky-400 inline" /> &quot;Do ekranu początkowego&quot; (Add to Home Screen).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-white">Kliknij &quot;Dodaj&quot; w prawym górnym rogu</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Aplikacja pojawi się na pulpicie telefonu z oficjalną ikoną Angels ZTP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : isAndroid ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300">
                  Na telefonie z systemem Android w przeglądarce <strong>Chrome</strong>:
                </p>

                <div className="space-y-3 bg-[#07090d] p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-white">Kliknij menu Chrome (3 kropki w prawym górnym rogu)</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Otwórz menu przeglądarki ⋮ w prawym górnym rogu.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-white">Wybierz &quot;Zainstaluj aplikację&quot; lub &quot;Dodaj do ekranu głównego&quot;</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        System automatycznie pobierze ikonę i skonfiguruje tryb pełnoekranowy bez paska adresu.
                      </p>
                    </div>
                  </div>
                </div>

                {deferredPrompt && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Zainstaluj jednym kliknięciem teraz</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300">
                  Możesz zainstalować aplikację Angels ZTP również na komputerze (Chrome, Edge) lub telefonie:
                </p>
                <div className="bg-[#07090d] p-4 rounded-2xl border border-slate-800 space-y-2 text-slate-400">
                  <p>
                    • W przeglądarce Chrome/Edge na komputerze kliknij ikonę <strong>Instaluj</strong> w pasku adresu (po prawej stronie obok gwiazdki).
                  </p>
                  <p>
                    • Aplikacja otworzy się w osobnym, pełnoekranowym oknie bez zakładek przeglądarki.
                  </p>
                </div>
                {deferredPrompt && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Zainstaluj aplikację</span>
                  </button>
                )}
              </div>
            )}

            {/* Why PWA Benefits */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Pełny ekran (bez paska URL)
              </span>
              <span className="flex items-center gap-1 text-sky-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Szybki start z ikony
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
