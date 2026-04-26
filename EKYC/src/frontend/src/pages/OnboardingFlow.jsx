import { useState } from 'react';
import StepWizard from '../components/StepWizard';
import NameCapture from '../components/NameCapture';
import DocumentScanner from '../components/DocumentScanner';
import PoaUpload from '../components/PoaUpload';
import LoadingScreen from '../components/LoadingScreen';
import VoiceGuide from '../components/VoiceGuide';
import AiAssistant from '../components/AiAssistant';
import * as api from '../utils/api';

const STEPS = { NAME: 0, PHONE: 1, DOCUMENT: 2, POA: 3, REVIEW: 4 };

export default function OnboardingFlow({ onComplete, onBack }) {
  const [step, setStep] = useState(STEPS.NAME);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [extractedFields, setExtractedFields] = useState(null);
  const [extractionPromise, setExtractionPromise] = useState(null);
  const [poaFile, setPoaFile] = useState(null);
  const [poaPreview, setPoaPreview] = useState(null);
  const [aiContext, setAiContext] = useState(null);

  const clearError = () => setError('');

  const getLoadingMessage = () => {
    if (step === STEPS.DOCUMENT) return 'Reading your IC...';
    if (step === STEPS.REVIEW) return 'Opening your account...';
    return 'Please wait...';
  };

  // Step 0: Name
  const handleNameNext = (name) => {
    setFullName(name);
    setStep(STEPS.PHONE);
  };

  // Step 1: Phone OTP
  const handleSendOtp = async () => {
    clearError();
    if (!phone.match(/^\+?[1-9]\d{7,14}$/)) {
      return setError('Please enter a valid phone number (e.g. +60123456789)');
    }
    setLoading(true);
    try {
      await api.sendOtp(phone);
      setOtpSent(true);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    clearError();
    if (otp.length !== 6) return setError('Please enter the 6-digit code');
    setLoading(true);
    try {
      await api.verifyOtp(phone, otp);
      const res = await api.createApplication(phone);
      setApplicationId(res.applicationId);
      setStep(STEPS.DOCUMENT);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Step 2: photo selected → start Textract immediately in background
  const handleDocumentPhotoSelected = (file) => {
    setExtractionPromise(api.uploadDocument(applicationId, file));
  };

  // Step 2: "Looks Good!" → await the already-running Textract, then go to POA
  const handleDocumentCaptured = async () => {
    clearError();
    setLoading(true);
    try {
      const res = await extractionPromise;
      setExtractedFields(res.extractedFields);
      setStep(STEPS.POA);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Step 3: POA document — validate content before proceeding
  const handlePoaCaptured = async (file) => {
    setPoaFile(file);
    setPoaPreview(file.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(file));
    clearError();
    setLoading(true);
    try {
      const validation = await api.validatePoa(applicationId, file);
      if (!validation.valid) {
        setAiContext({ wrongDocContent: true });
        return;
      }
      setAiContext(null);
      setStep(STEPS.REVIEW);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // Step 4: Submit
  const handleSubmit = async () => {
    clearError();
    setLoading(true);
    try {
      await api.finalizeApplication(applicationId);
      onComplete(applicationId, { extractedFields, fullName });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {loading && <LoadingScreen message={getLoadingMessage()} />}
      <AiAssistant currentStep={step} context={aiContext} />

      <StepWizard currentStep={step} />

      <div className="flex-1 px-5 py-4 space-y-5 overflow-auto">

        {/* Step 0: Name */}
        {step === STEPS.NAME && (
          <NameCapture onNext={handleNameNext} />
        )}

        {/* Step 1: Phone */}
        {step === STEPS.PHONE && (
          <div className="space-y-5">
            <VoiceGuide text={otpSent ? 'Enter the 6-digit code sent to your phone.' : 'Enter your phone number to get started.'} />
            <div className="card space-y-2">
              <p className="step-icon">📱</p>
              <p className="heading">{otpSent ? 'Enter Your Code' : "What's your phone number?"}</p>
              <p className="subtext">
                {otpSent ? `We sent a 6-digit code to ${phone}` : "We'll send you a one-time code to verify"}
              </p>
            </div>

            {!otpSent ? (
              <div className="space-y-4">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+60 12 345 6789"
                  className="w-full text-2xl font-bold text-center border-2 border-gray-200 rounded-2xl py-4 px-4 focus:outline-none focus:border-brand"
                />
                {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
                <button onClick={handleSendOtp} className="btn-primary">Send Code →</button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="number"
                  value={otp}
                  onChange={e => setOtp(e.target.value.slice(0, 6))}
                  placeholder="------"
                  className="w-full text-3xl font-bold tracking-[0.5em] text-center border-2 border-gray-200 rounded-2xl py-4 px-4 focus:outline-none focus:border-brand"
                />
                {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
                <button onClick={handleVerifyOtp} className="btn-primary">Verify →</button>
                <button
                  onClick={() => { setOtpSent(false); setOtp(''); clearError(); }}
                  className="btn-secondary"
                >
                  Change Number
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: NRIC Document */}
        {step === STEPS.DOCUMENT && (
          <div className="space-y-5">
            <VoiceGuide text="Now take a photo of the front of your MyKad identity card. Make sure all text is visible and clear." />
            <div className="card space-y-2">
              <p className="step-icon">🪪</p>
              <p className="heading">Scan Your MyKad</p>
              <p className="subtext">Take a clear photo of the front of your IC. Lay it flat with good lighting.</p>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-600 font-semibold text-center">{error}</p>
              </div>
            )}
            <DocumentScanner onDocumentCaptured={handleDocumentCaptured} onPhotoSelected={handleDocumentPhotoSelected} />
          </div>
        )}

        {/* Step 3: POA */}
        {step === STEPS.POA && (
          <PoaUpload
            onDocumentCaptured={handlePoaCaptured}
            onWrongFileType={(ext) => setAiContext(ext ? { wrongFileType: ext } : null)}
          />
        )}

        {/* Step 4: Review */}
        {step === STEPS.REVIEW && (
          <div className="space-y-5">
            <VoiceGuide text="Please review your details. If everything looks correct, tap Submit to open your account." />
            <div className="card space-y-2">
              <p className="step-icon">✅</p>
              <p className="heading">Review & Submit</p>
              <p className="subtext">Check your details before we open your account</p>
            </div>

            <div className="card space-y-4">
              <p className="font-bold text-gray-500 text-sm uppercase tracking-wide">Your Details</p>
              <div>
                <p className="text-sm text-gray-400">Full Name (as per NRIC)</p>
                <p className="text-lg font-bold text-gray-900">{fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Phone Number</p>
                <p className="text-lg font-bold text-gray-900">{phone}</p>
              </div>
              {[
                { label: 'IC Number', value: extractedFields?.icNumber },
                { label: 'Date of Birth', value: extractedFields?.dateOfBirth },
                { label: 'Gender', value: extractedFields?.gender },
                { label: 'Address', value: extractedFields?.address },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-sm text-gray-400">{label}</p>
                  <p className={`text-lg font-bold ${value ? 'text-gray-900' : 'text-gray-300'}`}>
                    {value || '—'}
                  </p>
                </div>
              ))}
            </div>

            {poaPreview && (
              <div className="card flex flex-col items-center gap-2">
                <p className="font-bold text-gray-500 text-sm uppercase tracking-wide">Proof of Address</p>
                {poaPreview === 'pdf' ? (
                  <div className="w-16 h-20 bg-red-50 rounded-xl flex flex-col items-center justify-center gap-1">
                    <span className="text-3xl">📄</span>
                    <span className="text-xs text-gray-500">PDF</span>
                  </div>
                ) : (
                  <img src={poaPreview} alt="POA" className="w-full max-h-32 object-contain rounded-xl border border-gray-100" />
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-600 font-semibold text-center">{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} className="btn-primary">Submit Application →</button>
          </div>
        )}
      </div>

      <div className="px-5 pb-6">
        <button onClick={onBack} className="text-gray-400 text-base w-full text-center py-2">
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
