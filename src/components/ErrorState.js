export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-sm text-gray-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[44px] rounded-full bg-gray-900 px-5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        다시 시도
      </button>
    </div>
  );
}
