import { useState, useRef } from 'react';
import VoiceGuide from './VoiceGuide';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const DOCUMENT_TYPES = [
  { icon: '🏦', label: 'Bank statement (last 3 months)' },
  { icon: '💡', label: 'Utility bill (electricity, water, gas)' },
  { icon: '📱', label: 'Telco / internet bill' },
  { icon: '💳', label: 'Credit card statement' },
  { icon: '🏛️', label: 'Government-issued letter with address' },
];

export default function PoaUpload({ onDocumentCaptured, onWrongFileType }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      const ext = f.name.includes('.') ? f.name.split('.').pop().toUpperCase() : f.type;
      setError(`"${f.name}" is not accepted. Please upload a JPG, PNG, or PDF file.`);
      onWrongFileType?.(ext);
      return;
    }
    setError('');
    setFile(f);
    setPreview(f.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(f));
    onWrongFileType?.(null);
  };

  return (
    <div className="space-y-5">
      <VoiceGuide text="Please upload your proof of address. This can be a bank statement, utility bill, or any official document showing your current address, dated within the last 3 months." />

      <div className="card space-y-2">
        <p className="step-icon">📄</p>
        <p className="heading">Proof of Address</p>
        <p className="subtext">Upload a document showing your current address (not older than 3 months)</p>
      </div>

      <div className="card space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Accepted documents</p>
        {DOCUMENT_TYPES.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-gray-700 text-sm">
            <span>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {!preview ? (
        <div
          onClick={() => inputRef.current.click()}
          className="border-2 border-dashed border-brand/40 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-brand/5 active:bg-brand/10 transition-colors"
        >
          <span className="text-5xl">📤</span>
          <p className="font-bold text-gray-700 text-center">Tap to upload your document</p>
          <p className="text-sm text-gray-400">JPG, PNG, or PDF — max 8MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-3">
          {preview === 'pdf' ? (
            <div className="w-20 h-24 bg-red-50 rounded-2xl flex flex-col items-center justify-center gap-1">
              <span className="text-4xl">📄</span>
              <span className="text-xs text-gray-500 font-semibold">PDF</span>
            </div>
          ) : (
            <img src={preview} alt="Document preview" className="w-full max-h-52 object-contain rounded-xl border border-gray-100" />
          )}
          <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
            <span>✅</span>
            <span>Document selected</span>
          </div>
          <button
            onClick={() => { setPreview(null); setFile(null); setError(''); }}
            className="btn-secondary text-sm py-2"
          >
            Change Document
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-center text-sm font-semibold">{error}</p>}

      {file && !error && (
        <button onClick={() => onDocumentCaptured(file)} className="btn-primary">
          Continue →
        </button>
      )}

    </div>
  );
}
