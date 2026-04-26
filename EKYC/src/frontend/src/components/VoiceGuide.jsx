import { useEffect, useRef, useState, useCallback } from 'react';
import { useVoicePreference } from '../hooks/useVoicePreference';

function SpeakingBars() {
  return (
    <div className="flex gap-0.5 items-end h-4 flex-shrink-0" aria-hidden="true">
      <span className="w-1 bg-brand rounded-full animate-bounce" style={{ height: '6px', animationDelay: '0ms' }} />
      <span className="w-1 bg-brand rounded-full animate-bounce" style={{ height: '12px', animationDelay: '120ms' }} />
      <span className="w-1 bg-brand rounded-full animate-bounce" style={{ height: '8px', animationDelay: '240ms' }} />
      <span className="w-1 bg-brand rounded-full animate-bounce" style={{ height: '14px', animationDelay: '60ms' }} />
      <span className="w-1 bg-brand rounded-full animate-bounce" style={{ height: '6px', animationDelay: '180ms' }} />
    </div>
  );
}

export default function VoiceGuide({ text, lang = 'en-MY' }) {
  const { voiceEnabled, toggleVoice } = useVoicePreference();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timerRef = useRef(null);

  const speak = useCallback((textToSpeak) => {
    if (!textToSpeak || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [lang]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    if (!voiceEnabled || !text) return;

    timerRef.current = setTimeout(() => speak(text), 400);
    return () => {
      clearTimeout(timerRef.current);
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    };
  }, [text, voiceEnabled, speak]);

  const handleReplay = () => {
    if (voiceEnabled && text) speak(text);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={voiceEnabled ? 'Voice guide active' : 'Voice guide muted'}
      className="flex items-center gap-3 bg-blue-50 border border-brand rounded-2xl px-4 py-3"
    >
      <button
        onClick={toggleVoice}
        className="text-xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
        aria-label={voiceEnabled ? 'Mute voice guide' : 'Unmute voice guide'}
      >
        {voiceEnabled ? '🔊' : '🔇'}
      </button>

      <p className="text-sm text-brand font-medium flex-1 leading-snug line-clamp-2">
        {text}
      </p>

      <div className="flex items-center gap-2 flex-shrink-0">
        {voiceEnabled && isSpeaking ? (
          <SpeakingBars />
        ) : voiceEnabled && text ? (
          <button
            onClick={handleReplay}
            className="text-brand font-bold text-base w-8 h-8 flex items-center justify-center rounded-full hover:bg-white active:scale-95 transition-transform"
            aria-label="Replay voice guide"
          >
            ↺
          </button>
        ) : null}
      </div>
    </div>
  );
}
