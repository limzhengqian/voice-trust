import { useState } from 'react';
import CameraCapture from './CameraCapture';

export default function DocumentScanner({ onDocumentCaptured, onPhotoSelected }) {
  const [mode, setMode] = useState('choice'); // 'choice' | 'camera' | 'upload' | 'preview'
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const handleCameraCapture = (blob) => {
    setFile(blob);
    setPreview(URL.createObjectURL(blob));
    setMode('preview');
    onPhotoSelected?.(blob);
  };

  const handleFileUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMode('preview');
    onPhotoSelected?.(f);
  };

  const handleConfirm = () => onDocumentCaptured(file);

  if (mode === 'camera') {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode('choice')} className="flex items-center gap-2 text-brand font-semibold text-lg">
          ← Back
        </button>
        <CameraCapture
          onCapture={handleCameraCapture}
          facingMode="environment"
          aspectRatio={1.58}
          hint="Hold your IC flat. Make sure all text is clear and visible."
        />
      </div>
    );
  }

  if (mode === 'preview') {
    return (
      <div className="space-y-5">
        <p className="text-xl font-bold text-center">Does your IC look clear?</p>
        <img src={preview} alt="Document preview" className="w-full rounded-2xl shadow-md border border-gray-200 object-cover" />
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setMode('choice'); setPreview(null); }} className="btn-secondary text-base py-3">
            Retake
          </button>
          <button onClick={handleConfirm} className="btn-primary text-base py-3">
            Looks Good!
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'upload') {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode('choice')} className="flex items-center gap-2 text-brand font-semibold text-lg">
          ← Back
        </button>
        <label className="card flex flex-col items-center justify-center gap-4 cursor-pointer border-2 border-dashed border-brand min-h-48">
          <span className="text-5xl">📎</span>
          <span className="text-xl font-semibold text-brand">Tap to choose photo</span>
          <span className="text-gray-400 text-sm">JPG or PNG, max 8MB</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card text-center py-6 space-y-2">
        <p className="text-5xl">🪪</p>
        <p className="text-xl font-bold">Show us your MyKad</p>
        <p className="text-gray-500">We need to take a photo of your Malaysian Identity Card (front side)</p>
      </div>
      <button onClick={() => setMode('camera')} className="btn-primary">
        📷  Use Camera
      </button>
      <button onClick={() => setMode('upload')} className="btn-secondary">
        📁  Upload from Gallery
      </button>
    </div>
  );
}
