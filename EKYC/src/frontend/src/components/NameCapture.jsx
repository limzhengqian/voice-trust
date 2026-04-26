import { useState, useEffect } from 'react';
import VoiceGuide from './VoiceGuide';

export default function NameCapture({ onNext }) {
  const [name, setName] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-MY';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { setListening(true); setError(''); };
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => setName(e.results[0][0].transcript.toUpperCase());
    recognition.onerror = () => { setListening(false); setError('Voice capture failed. Please type your name.'); };
    recognition.start();
  };

  const handleNext = () => {
    if (!name.trim()) return setError('Please enter your full name as shown on your NRIC');
    onNext(name.trim());
  };

  return (
    <div className="space-y-5">
      <VoiceGuide text="Please say or type your full name exactly as it appears on your NRIC identity card." />

      <div className="card space-y-2">
        <p className="step-icon">👤</p>
        <p className="heading">What is your full name?</p>
        <p className="subtext">Enter your name exactly as shown on your NRIC</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value.toUpperCase()); setError(''); }}
            placeholder="E.G. LEE WEI HAN"
            className="w-full text-xl font-bold text-center border-2 border-gray-200 rounded-2xl py-4 px-4 pr-14 focus:outline-none focus:border-brand uppercase tracking-wide"
          />
          {speechSupported && (
            <button
              onClick={startListening}
              aria-label="Speak your name"
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all text-lg
                ${listening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-brand/10 text-brand hover:bg-brand/20'}`}
            >
              🎤
            </button>
          )}
        </div>

        {listening && (
          <p className="text-center text-brand font-semibold text-sm animate-pulse">
            Listening... speak your full name now
          </p>
        )}

        {error && <p className="text-red-500 text-center font-semibold text-sm">{error}</p>}

        <button
          onClick={handleNext}
          disabled={!name.trim()}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
