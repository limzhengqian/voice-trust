import { useRef, useState, useCallback } from 'react';

export function useCamera() {
  const webcamRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState(null);

  const onUserMedia = useCallback(() => {
    setIsCameraReady(true);
    setError(null);
  }, []);

  const onUserMediaError = useCallback((err) => {
    setIsCameraReady(false);
    if (err.name === 'NotAllowedError') {
      setError('Camera permission denied. Please allow camera access and try again.');
    } else if (err.name === 'NotFoundError') {
      setError('No camera found on this device.');
    } else {
      setError('Could not access camera. Please try again.');
    }
  }, []);

  const capture = useCallback(() => {
    if (!webcamRef.current) return null;
    const imageSrc = webcamRef.current.getScreenshot();
    return imageSrc;
  }, []);

  const captureAsBlob = useCallback(async () => {
    const dataUrl = capture();
    if (!dataUrl) return null;
    const res = await fetch(dataUrl);
    return res.blob();
  }, [capture]);

  return { webcamRef, isCameraReady, error, onUserMedia, onUserMediaError, capture, captureAsBlob };
}
