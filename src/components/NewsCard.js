export default function NewsCard({ item }) {
  return (
    <a
      href={item.link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:bg-gray-50 hover:shadow-md"
    >
      <h2 className="line-clamp-2 text-base font-semibold text-gray-900">
        {item.title}
      </h2>
      {item.description && (
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
          {item.description}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        {item.press && <span>{item.press}</span>}
        {item.press && item.pubDate && <span aria-hidden="true">·</span>}
        {item.pubDate && <span>{item.pubDate}</span>}
      </div>
    </a>
  );
}
