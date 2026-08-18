import { POPULAR_KEYWORDS } from "@/constants/keywords";

export default function KeywordChips({ activeKeyword, onSelect }) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible">
      {POPULAR_KEYWORDS.map((keyword) => {
        const isActive = keyword === activeKeyword;
        return (
          <button
            key={keyword}
            type="button"
            onClick={() => onSelect(keyword)}
            aria-pressed={isActive}
            className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors ${
              isActive
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {keyword}
          </button>
        );
      })}
    </div>
  );
}
