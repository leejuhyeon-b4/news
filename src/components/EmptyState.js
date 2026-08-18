export default function EmptyState({ query }) {
  return (
    <div className="flex flex-col items-center gap-1 py-10 text-center">
      <p className="text-base font-medium text-gray-700">
        &apos;{query}&apos;에 대한 검색 결과가 없습니다
      </p>
      <p className="text-sm text-gray-500">다른 키워드로 검색해 보세요</p>
    </div>
  );
}
