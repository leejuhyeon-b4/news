export default function LoadMoreButton({ onClick, loading }) {
  return (
    <div className="flex justify-center py-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex min-h-[44px] items-center gap-2 rounded-full border border-gray-300 px-6 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
          />
        )}
        {loading ? "불러오는 중…" : "더보기"}
      </button>
    </div>
  );
}
