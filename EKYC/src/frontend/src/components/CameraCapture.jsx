import Webcam from 'react-webcam';
import { useCamera } from '../hooks/useCamera';

export default function CameraCapture({ onCapture, hint, facingMode = 'user', aspectRatio = 1 }) {
  const { webcamRef, isCameraReady, error, onUserMedia, onUserMediaError, captureAsBlob } = useCamera();

  const handleCapture = async () => {
    const blob = await captureAsBlob();
    if (blob) onCapture(blob);
  };

  if (error) {
    return (
      <div className="card text-center py-10 space-y-4">
        <p className="text-5xl">📷</p>
        <p className="text-red-600 font-semibold text-lg">{error}</p>
        <p className="text-gray-500">Please allow camera access in your browser settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-xl"
           style={{ aspectRatio: aspectRatio }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.92}
          videoConstraints={{ facingMode, width: 1280, height: 720 }}
          onUserMedia={onUserMedia}
          onUserMediaError={onUserMediaError}
          className="w-full h-full object-cover"
        />
        {facingMode === 'user' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-60 border-4 border-white border-dashed rounded-full opacity-60" />
          </div>
        )}
        {facingMode === 'environment' && (
          <div className="absolute inset-4 border-4 border-white border-dashed rounded-2xl opacity-60" />
        )}
        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {hint && <p className="text-center text-gray-500 text-base">{hint}</p>}
      <button
        onClick={handleCapture}
        disabled={!isCameraReady}
        className="btn-primary"
      >
        Take Photo
      </button>
    </div>
  );
}
