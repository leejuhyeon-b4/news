"use client";

import { useState } from "react";

export default function SearchBar({ value, onChange, onSubmit, disabled }) {
  const [showBlankWarning, setShowBlankWarning] = useState(false);

  const handleChange = (next) => {
    if (showBlankWarning) setShowBlankWarning(false);
    onChange(next);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!value.trim()) {
      setShowBlankWarning(true);
      return;
    }
    setShowBlankWarning(false);
    onSubmit(value);
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-2">
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
        <div className="relative flex-1">
          <label htmlFor="news-search" className="sr-only">
            뉴스 검색어
          </label>
          <input
            id="news-search"
            type="text"
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            placeholder="검색어를 입력하세요"
            aria-label="뉴스 검색어"
            className="w-full rounded-full border border-gray-300 bg-white px-4 py-3 pr-11 text-base text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {value && (
            <button
              type="button"
              onClick={() => handleChange("")}
              aria-label="검색어 전체 지우기"
              className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="h-11 min-w-[44px] shrink-0 rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          검색
        </button>
      </form>
      {showBlankWarning && (
        <p role="alert" className="text-sm text-red-500">
          검색어를 입력해 주세요.
        </p>
      )}
    </div>
  );
}
