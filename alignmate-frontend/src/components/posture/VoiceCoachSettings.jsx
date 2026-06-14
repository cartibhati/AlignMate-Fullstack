import { useState, useEffect } from "react";
import { Volume2, Settings, Mic, Play } from "lucide-react";

export default function VoiceCoachSettings() {
  const [voices, setVoices] = useState([]);
  const [voiceSettings, setVoiceSettings] = useState({
    voiceName: "",
    rate: 0.95,
    pitch: 1.0,
    volume: 1.0,
  });
  const [isOpen, setIsOpen] = useState(false);

  // Load voices & settings
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    const saved = localStorage.getItem("alignmate_voice_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVoiceSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse voice settings", e);
      }
    }
  }, []);

  const saveSettings = (newSettings) => {
    setVoiceSettings(newSettings);
    localStorage.setItem("alignmate_voice_settings", JSON.stringify(newSettings));
  };

  const handleTestVoice = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance("Sit straight! Keep your alignment aligned.");
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;

    if (voiceSettings.voiceName) {
      const selectedVoice = voices.find(v => v.name === voiceSettings.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="relative font-sans select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs bg-[#12141c]/80 border border-white/5 text-gray-300 px-4 py-2.5 rounded-xl font-bold hover:bg-[#1b1e2a] hover:text-white transition duration-200"
      >
        <Settings size={14} className="text-primary animate-pulse" />
        <span>Coach Settings</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-[#12141c] border border-white/10 rounded-2xl p-5 shadow-2xl z-50 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
            <Mic size={16} className="text-primary" />
            <h4 className="text-xs font-black uppercase text-white tracking-widest">Voice Coach Config</h4>
          </div>

          <div className="space-y-4">
            
            {/* Voice Select */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Coach Voice</label>
              <select
                value={voiceSettings.voiceName}
                onChange={(e) => saveSettings({ ...voiceSettings, voiceName: e.target.value })}
                className="w-full bg-[#08080a] border border-white/5 rounded-lg text-xs px-2.5 py-2 text-gray-300 font-semibold focus:outline-none focus:border-primary"
              >
                <option value="">Default System Voice</option>
                {voices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Rate / Speed */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-wider">
                <span>Speed</span>
                <span className="text-primary font-display">{voiceSettings.rate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={voiceSettings.rate}
                onChange={(e) => saveSettings({ ...voiceSettings, rate: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Pitch */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-wider">
                <span>Pitch</span>
                <span className="text-primary font-display">{voiceSettings.pitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={voiceSettings.pitch}
                onChange={(e) => saveSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Volume */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-wider flex-wrap">
                <span className="flex items-center gap-1"><Volume2 size={10} /> Volume</span>
                <span className="text-primary font-display">{Math.round(voiceSettings.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={voiceSettings.volume}
                onChange={(e) => saveSettings({ ...voiceSettings, volume: parseFloat(e.target.value) })}
                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Test button */}
            <button
              onClick={handleTestVoice}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 text-primary py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/20 transition-all shadow-neon"
            >
              <Play size={12} fill="currentColor" />
              Test Coach Voice
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
