// 네이버 API의 pubDate는 RFC1123 형식(예: "Mon, 17 Aug 2026 09:12:00 +0900")으로 온다.
// 서버 실행 환경의 타임존과 무관하게 항상 한국 시간(KST) 기준 "YYYY.MM.DD HH:mm"으로 표시한다.
export function formatPubDate(pubDate) {
  if (!pubDate) return "";

  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  // 일부 로케일 구현은 자정을 "24"시로 반환하므로 보정한다.
  const hour = get("hour") === "24" ? "00" : get("hour");

  return `${get("year")}.${get("month")}.${get("day")} ${hour}:${get("minute")}`;
}
