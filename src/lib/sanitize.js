// 네이버 뉴스 검색 API 응답의 title/description에는 검색어 강조용 <b> 태그와
// HTML 엔티티(&quot; &amp; &lt; &gt; &#39; 등)가 섞여 들어온다.
// dangerouslySetInnerHTML을 쓰지 않고 안전하게 렌더링하기 위해
// 태그를 모두 제거하고 엔티티를 디코딩한 순수 텍스트로 변환한다.

const NAMED_ENTITIES = {
  quot: '"',
  amp: "&",
  lt: "<",
  gt: ">",
  apos: "'",
  nbsp: " ",
};

function stripTags(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

function decodeEntities(text) {
  if (!text) return "";
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === "#") {
      const isHex = entity[1] === "x" || entity[1] === "X";
      const code = isHex
        ? parseInt(entity.slice(2), 16)
        : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    const key = entity.toLowerCase();
    return key in NAMED_ENTITIES ? NAMED_ENTITIES[key] : match;
  });
}

// HTML 태그 제거 + 엔티티 디코딩 + 앞뒤 공백 정리까지 한 번에 처리한다.
export function sanitizeText(html) {
  return decodeEntities(stripTags(html)).trim();
}
