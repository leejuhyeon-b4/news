const SORT_OPTIONS = [
  { value: "sim", label: "정확도순" },
  { value: "date", label: "최신순" },
];

export default function SortTabs({ sort, onChange }) {
  return (
    <div role="tablist" aria-label="정렬 방식" className="flex justify-center gap-2">
      {SORT_OPTIONS.map((option) => {
        const isActive = option.value === sort;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors ${
              isActive
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
