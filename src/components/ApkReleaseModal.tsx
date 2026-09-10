import React, { useState, useEffect } from "react";
import {
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Github,
  X,
  Terminal,
  Download,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

interface ApkReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkReleaseModal: React.FC<ApkReleaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      alert("तपाईंको ब्राउजरको मेनू (३ थोप्ला ⋮) बाट 'Add to Home Screen' वा 'Install App' रोजेर तत्काल इन्स्टल गर्न सक्नुहुन्छ!");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Android APK Release & Setup
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Fixed
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                GitHub Actions मार्फत APK निर्माण र रिलिज गर्ने समाधान
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Issue Root Cause Banner */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-semibold text-amber-200">
                समस्याको कारण र समाधान (Fix for Lock file error):
              </p>
              <p className="text-amber-300/80 leading-relaxed">
                पछिल्लो बिल्डमा <code>Dependencies lock file is not found (package-lock.json missing)</code> भनी १३ सेकेन्डमै फेल भएको थियो। हामीले <strong>`package-lock.json`</strong> तयार गरेका छौँ र वर्कफ्लोबाट क्यास अवरोध हटाई <strong>`actions/setup-java@v5`</strong> मा अपग्रेड गरेका छौँ। अब बिल्ड बिना कुनै अवरोध सफल हुनेछ!
              </p>
            </div>
          </div>

          {/* Fix Applied */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>हामीले गरेको समाधान (Fix Applied):</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 pl-4 list-disc">
              <li>
                <strong>`.github/workflows/build-apk.yml`</strong> तयार गरियो, जसले कोड पुश हुँदा वा म्यानुअल रूपमा "Run workflow" थिच्दा स्वचालित रूपमा Android APK कम्पाइल गर्छ।
              </li>
              <li>
                <strong>Capacitor Android</strong> र Gradle बिल्ड कन्फिगरेसन (<code>android/</code>) पूरा सेटअप गरियो।
              </li>
              <li>
                GitHub Releases (<code>github.com/bhapuma/l/releases</code>) मा सिधै <strong>`AI-Video-Studio-app.apk`</strong> स्वतः अपलोड हुने सुविधा जोडिएको छ।
              </li>
            </ul>
          </div>

          {/* How to Run & Download Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              APK प्राप्त गर्ने २ वटा सजिला तरिकाहरू:
            </h4>

            {/* Option 1: GitHub Actions */}
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Github className="w-4 h-4 text-slate-300" />
                  <span>तरिका १: GitHub Actions बाट सिधै APK निकाल्नुहोस्</span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                  स्वचालित (Auto)
                </span>
              </div>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  तपाईंको GitHub Actions पृष्ठ खोल्नुहोस्:
                  <a
                    href="https://github.com/bhapuma/l/actions"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 ml-1 font-mono font-medium underline"
                  >
                    github.com/bhapuma/l/actions
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  बायाँतर्फ <strong>"Build & Release Android APK"</strong> देखिनेछ, त्यसमा क्लिक गर्नुहोस्।
                </li>
                <li>
                  दायाँ छेउमा रहेको <strong>"Run workflow"</strong> निलो बटन थिच्नुहोस्।
                </li>
                <li>
                  बिल्ड पूरा भएपछि <strong>Releases</strong> वा <strong>Artifacts</strong> बाट सिधै <span className="text-emerald-400 font-mono">AI-Video-Studio-app.apk</span> डाउनलोड गर्नुहोस्!
                </li>
              </ol>

              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href="https://github.com/bhapuma/l/actions"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Actions खोल्नुहोस्</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://github.com/bhapuma/l/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>GitHub Releases हेर्नुहोस्</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Option 2: 1-Click Instant Mobile Install */}
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>तरिका २: मोबाइलमा सिधै १-क्लिकमा इन्स्टल गर्नुहोस् (Web App)</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                  तत्काल (Instant)
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                यदि तपाईं मोबाइल फोन वा ट्याब्लेटमा हुनुहुन्छ भने APK डाउनलोड नगरीकनै पनि सिधै आफ्नो फोनको होम स्क्रिनमा एप जस्तै इन्स्टल गर्न सक्नुहुन्छ:
              </p>
              <button
                onClick={handleInstallPWA}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>📱 मोबाइलमा इन्स्टल गर्नुहोस् (Install to Phone)</span>
              </button>
              <p className="text-[11px] text-slate-400">
                💡 सुझाव: यदि बटनले काम नगरे मोबाइल क्रोम ब्राउजरको ३ थोप्ला (⋮) थिचेर <strong>"Add to Home screen"</strong> वा <strong>"Install app"</strong> छनोट गर्नुहोस्।
              </p>
            </div>

            {/* Option 3: Local Android Studio Build */}
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>तरिका ३: आफ्नै कम्प्युटर वा Android Studio बाट बनाउन (Local Build)</span>
              </div>
              <div className="relative bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                <pre className="space-y-1">
                  <code>npm run build</code>{"\n"}
                  <code>npx cap sync android</code>{"\n"}
                  <code>cd android && ./gradlew assembleDebug</code>
                </pre>
                <button
                  onClick={() =>
                    copyCode(
                      "npm run build && npx cap sync android && cd android && ./gradlew assembleDebug",
                      1
                    )
                  }
                  className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy command"
                >
                  {copiedIndex === 1 ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span className="text-xs text-slate-400">
            AI Video Studio v1.0.0 • Ready for Android APK
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            बन्द गर्नुहोस् (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
