import VoiceGuide from '../components/VoiceGuide';


    const VOICE_TEXT = 'Welcome! Open your account in just a few easy steps. Tap Get Started when you are ready.';

export default function Landing({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-brand px-6 py-12">
      <VoiceGuide text={VOICE_TEXT} />

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 text-white">
        <div className="text-8xl">🏦</div>
        <h1 className="text-4xl font-extrabold leading-tight">
          Open Your<br />Account Today
        </h1>
        <p className="text-xl opacity-90 leading-relaxed max-w-xs">
          Fast, safe, and easy — done in under 3 minutes
        </p>

        <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-sm">
          {[
            { icon: '📱', label: 'Phone\nNumber' },
            { icon: '🪪', label: 'IC\nCard' },
            { icon: '🤳', label: 'Quick\nSelfie' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-white bg-opacity-20 rounded-2xl py-4 px-2 flex flex-col items-center gap-2">
              <span className="text-3xl">{icon}</span>
              <span className="text-xs font-semibold whitespace-pre-line text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onStart}
          className="w-full py-5 bg-white text-brand text-2xl font-extrabold rounded-2xl shadow-xl active:scale-95 transition-transform"
        >
          Get Started →
        </button>
        <p className="text-white text-center text-sm opacity-75">
          Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}
