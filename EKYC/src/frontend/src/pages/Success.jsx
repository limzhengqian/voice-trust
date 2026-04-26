import VoiceGuide from '../components/VoiceGuide';

export default function Success({ applicationId, data, onRestart }) {
  const fields = data?.extractedFields || {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <VoiceGuide text="Congratulations! Your account has been successfully opened. Welcome aboard!" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 space-y-6">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-6xl">✅</span>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900">You're in!</h1>
          <p className="text-xl text-gray-500">Your account is now open</p>
        </div>

        {(fields.fullName || fields.icNumber) && (
          <div className="card w-full max-w-sm space-y-3">
            <p className="font-bold text-gray-500 text-sm uppercase tracking-wide">Account Details</p>
            {fields.fullName && (
              <div>
                <p className="text-sm text-gray-400">Full Name</p>
                <p className="text-lg font-bold text-gray-900">{fields.fullName}</p>
              </div>
            )}
            {fields.icNumber && (
              <div>
                <p className="text-sm text-gray-400">IC Number</p>
                <p className="text-lg font-bold text-gray-900">{fields.icNumber}</p>
              </div>
            )}
            {applicationId && (
              <div>
                <p className="text-sm text-gray-400">Application ID</p>
                <p className="text-base font-mono text-gray-700 break-all">{applicationId}</p>
              </div>
            )}
          </div>
        )}

        <div className="card w-full max-w-sm bg-blue-50 border border-blue-100">
          <p className="text-blue-800 font-semibold text-center text-base">
            Check your SMS for your account details and next steps
          </p>
        </div>
      </div>

      <div className="px-6 pb-10">
        <button onClick={onRestart} className="btn-secondary max-w-sm mx-auto block">
          Open Another Account
        </button>
      </div>
    </div>
  );
}
