import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ekyc_voice_enabled';

export function useVoicePreference() {
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      if (!next) window.speechSynthesis?.cancel();
      return next;
    });
  }, []);

  return { voiceEnabled, toggleVoice };
}
