const STEPS = ['Name', 'Phone', 'ID Card', 'Address', 'Review'];

export default function StepWizard({ currentStep }) {
  return (
    <div className="w-full px-4 pt-6 pb-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-col items-center z-10">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300
                ${i < currentStep ? 'bg-brand border-brand text-white' : ''}
                ${i === currentStep ? 'bg-brand border-brand text-white scale-110 shadow-lg' : ''}
                ${i > currentStep ? 'bg-white border-gray-300 text-gray-400' : ''}`}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className={`mt-1 text-xs font-semibold ${i === currentStep ? 'text-brand' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
