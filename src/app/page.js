"use client";

import { useCallback, useRef, useState } from "react";
import SearchBar from "@/components/SearchBar";
import KeywordChips from "@/components/KeywordChips";
import SortTabs from "@/components/SortTabs";
import NewsList from "@/components/NewsList";
import LoadMoreButton from "@/components/LoadMoreButton";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";

const MAX_START = 1000;

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("sim");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  // idle | loading | loadingMore | success | empty | error
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");
  const lastRequestRef = useRef(null);

  const runSearch = useCallback(async (searchQuery, searchSort, start, { append = false } = {}) => {
    lastRequestRef.current = { query: searchQuery, sort: searchSort, start, append };
    setStatus(append ? "loadingMore" : "loading");
    setLoadMoreError("");
    if (!append) setErrorMessage("");

    try {
      const params = new URLSearchParams({
        query: searchQuery,
        sort: searchSort,
        start: String(start),
      });

      let response;
      try {
        response = await fetch(`/api/news?${params.toString()}`);
      } catch {
        throw new Error("네트워크 연결을 확인해 주세요.");
      }

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error?.message || "뉴스를 불러오지 못했습니다.");
      }

      setTotal(data.total ?? 0);
      setItems((prev) => (append ? [...prev, ...(data.items ?? [])] : data.items ?? []));
      setStatus((data.total ?? 0) === 0 ? "empty" : "success");
    } catch (err) {
      const message = err.message || "뉴스를 불러오지 못했습니다.";
      if (append) {
        // 더보기 실패는 기존 목록을 유지한 채 인라인 에러로만 안내한다.
        setStatus("success");
        setLoadMoreError(message);
      } else {
        setStatus("error");
        setErrorMessage(message);
      }
    }
  }, []);

  const handleSearch = useCallback(
    (rawValue) => {
      const trimmed = rawValue.trim();
      if (!trimmed) return;
      setInputValue(trimmed);
      setQuery(trimmed);
      setItems([]);
      setTotal(0);
      runSearch(trimmed, sort, 1, { append: false });
    },
    [runSearch, sort]
  );

  const handleChipClick = useCallback(
    (keyword) => {
      handleSearch(keyword);
    },
    [handleSearch]
  );

  const handleSortChange = useCallback(
    (nextSort) => {
      if (nextSort === sort) return;
      setSort(nextSort);
      if (!query) return;
      setItems([]);
      setTotal(0);
      runSearch(query, nextSort, 1, { append: false });
    },
    [sort, query, runSearch]
  );

  const handleLoadMore = useCallback(() => {
    runSearch(query, sort, items.length + 1, { append: true });
  }, [runSearch, query, sort, items.length]);

  const handleRetry = useCallback(() => {
    const last = lastRequestRef.current;
    if (!last) return;
    runSearch(last.query, last.sort, last.start, { append: last.append });
  }, [runSearch]);

  const hasResults = items.length > 0;
  const canLoadMore = hasResults && items.length < total && items.length + 1 <= MAX_START;
  const showSortTabs = status !== "idle" && status !== "empty" && (hasResults || status === "loading");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">News Finder</h1>
        <SearchBar
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSearch}
          disabled={status === "loading"}
        />
        <KeywordChips activeKeyword={query} onSelect={handleChipClick} />
      </header>

      {showSortTabs && <SortTabs sort={sort} onChange={handleSortChange} />}

      {status === "idle" && (
        <p className="text-center text-sm text-gray-500">
          관심 있는 키워드로 뉴스를 검색해 보세요
        </p>
      )}

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {status === "empty" && <EmptyState query={query} />}

      {status === "error" && (
        <ErrorState message={errorMessage} onRetry={handleRetry} />
      )}

      {(status === "success" || status === "loadingMore") && (
        <>
          <p className="text-sm text-gray-500">
            총 {total.toLocaleString()}건 중 {items.length.toLocaleString()}건 표시
          </p>
          <NewsList items={items} />
          {loadMoreError && (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <p className="text-sm text-red-500">{loadMoreError}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="min-h-[44px] rounded-full border border-gray-300 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                다시 시도
              </button>
            </div>
          )}
          {canLoadMore && !loadMoreError && (
            <LoadMoreButton onClick={handleLoadMore} loading={status === "loadingMore"} />
          )}
        </>
      )}
    </main>
  );
}
