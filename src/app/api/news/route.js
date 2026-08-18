import { NextResponse } from "next/server";
import { sanitizeText } from "@/lib/sanitize";
import { formatPubDate } from "@/lib/formatDate";

// 서버 코드에서만 접근 — NEXT_PUBLIC_ 접두사를 붙이지 않아 클라이언트 번들에는 포함되지 않는다.
// 2026-07 네이버 뉴스 검색 API가 개발자센터(openapi.naver.com)에서
// NAVER API HUB(네이버 클라우드 플랫폼)로 이관되어 엔드포인트·인증 헤더가 변경되었다.
// - 구: https://openapi.naver.com/v1/search/news.json + X-Naver-Client-Id / X-Naver-Client-Secret
// - 신: https://naverapihub.apigw.ntruss.com/search/v1/news + X-NCP-APIGW-API-KEY-ID / X-NCP-APIGW-API-KEY
// 프로젝트 내부 환경변수 이름(NAVER_CLIENT_ID/NAVER_CLIENT_SECRET)은 PRD와의 일관성을 위해 유지하고,
// 업스트림 호출 시에만 신규 헤더명으로 매핑한다.
const NAVER_NEWS_ENDPOINT = "https://naverapihub.apigw.ntruss.com/search/v1/news";
const DISPLAY_COUNT = 10;
const MAX_START = 1000;
const UPSTREAM_TIMEOUT_MS = 8000;
const VALID_SORTS = new Set(["sim", "date"]);

function errorResponse(status, code, message) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// 언론사 표기를 위해 원문 링크의 도메인만 추출한다. 실패 시 생략(undefined).
function extractPress(originallink, link) {
  const url = originallink || link;
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query")?.trim();
  if (!query) {
    return errorResponse(400, "MISSING_QUERY", "검색어를 입력해 주세요.");
  }

  const rawSort = searchParams.get("sort");
  const sort = VALID_SORTS.has(rawSort) ? rawSort : "sim";

  let start = parseInt(searchParams.get("start"), 10);
  if (!Number.isFinite(start)) start = 1;
  start = Math.min(Math.max(start, 1), MAX_START);

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // 상세 원인은 서버 로그에만 남기고 사용자에게는 일반 메시지만 노출한다.
    console.error(
      "[api/news] NAVER_CLIENT_ID / NAVER_CLIENT_SECRET이 설정되지 않았습니다. .env.local을 확인하세요."
    );
    return errorResponse(
      500,
      "AUTH_ERROR",
      "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
    );
  }

  const upstreamUrl = new URL(NAVER_NEWS_ENDPOINT);
  upstreamUrl.searchParams.set("query", query);
  upstreamUrl.searchParams.set("display", String(DISPLAY_COUNT));
  upstreamUrl.searchParams.set("start", String(start));
  upstreamUrl.searchParams.set("sort", sort);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    console.error("[api/news] 네이버 API 호출 실패:", err);
    return errorResponse(502, "UPSTREAM_ERROR", "뉴스를 불러오지 못했습니다.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
    const body = await upstreamResponse.text().catch(() => "");
    console.error("[api/news] 네이버 API 인증 실패:", upstreamResponse.status, body);
    return errorResponse(
      500,
      "AUTH_ERROR",
      "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
    );
  }

  if (upstreamResponse.status === 429) {
    return errorResponse(
      429,
      "RATE_LIMITED",
      "요청이 많아 잠시 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
    );
  }

  if (!upstreamResponse.ok) {
    const body = await upstreamResponse.text().catch(() => "");
    console.error("[api/news] 네이버 API 오류:", upstreamResponse.status, body);
    return errorResponse(502, "UPSTREAM_ERROR", "뉴스를 불러오지 못했습니다.");
  }

  let data;
  try {
    data = await upstreamResponse.json();
  } catch (err) {
    console.error("[api/news] 네이버 API 응답 파싱 실패:", err);
    return errorResponse(502, "UPSTREAM_ERROR", "뉴스를 불러오지 못했습니다.");
  }

  const items = (data.items ?? []).map((item, index) => {
    const link = item.originallink || item.link || "";
    return {
      id: link || `${start}-${index}`,
      title: sanitizeText(item.title),
      description: sanitizeText(item.description),
      link,
      press: extractPress(item.originallink, item.link),
      pubDate: formatPubDate(item.pubDate),
    };
  });

  // 키·원본 응답 헤더는 절대 포함하지 않고 클라이언트에 필요한 필드만 반환한다.
  return NextResponse.json({
    total: data.total ?? 0,
    start: data.start ?? start,
    display: data.display ?? items.length,
    items,
  });
}
