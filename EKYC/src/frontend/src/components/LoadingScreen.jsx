export default function LoadingScreen({ message = 'Processing...' }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50 gap-6">
      <div className="w-20 h-20 border-8 border-brand-light border-t-brand rounded-full animate-spin" />
      <p className="text-2xl font-bold text-gray-700 text-center px-8">{message}</p>
    </div>
  );
}
