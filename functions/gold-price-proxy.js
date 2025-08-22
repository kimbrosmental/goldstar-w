// Cloudflare Workers (Modules) 버전
// 경로: https://gold-price-proxy.<account>.workers.dev/price

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== '/price') {
      return new Response('Not found', { status: 404 });
    }
    try {
        const upstream = 'https://www.soongumnara.co.kr/main/html.php?htmid=goods/gold_list.html&agencyCode=';
      const res = await fetch(upstream, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko,en;q=0.9'
        },
        cf: { cacheTtl: 0, cacheEverything: false }
      });
      const html = await res.text();
        // 오늘/어제 날짜와 금시세 추출
        function extractRows(html) {
          const rowRegex = /<div class="tabulator-row[^"]*"[\s\S]*?<\/div>\s*<\/div>/g;
          const rows = html.match(rowRegex) || [];
          let today = null, yesterday = null;
          const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
          let prevDayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10).replace(/-/g, '.');
          for (const row of rows) {
            const dateMatch = row.match(/tabulator-field="writeday"[^>]*>([\d.]+)<\/div>/);
            const priceMatch = row.match(/tabulator-field="spure"[^>]*>([\d,]+)<\/div>/);
            if (dateMatch && priceMatch) {
              const date = dateMatch[1];
              const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
              if (!today && date === todayStr) today = price;
              if (!yesterday && date === prevDayStr) yesterday = price;
            }
          }
          return { today, yesterday, todayStr, prevDayStr };
        }
        const { today, yesterday, todayStr, prevDayStr } = extractRows(html);
        let percent = null, change = null, arrow = null, color = null;
        if (today != null && yesterday != null) {
          change = today - yesterday;
          percent = yesterday !== 0 ? ((change / yesterday) * 100).toFixed(2) : null;
          if (change > 0) {
            arrow = '▲';
            color = 'red';
          } else if (change < 0) {
            arrow = '▼';
            color = 'blue';
          } else {
            arrow = '-';
            color = 'gray';
          }
        }
        const result = {
          today: today,
          yesterday: yesterday,
          percent: percent,
          change: change,
          arrow: arrow,
          color: color,
          todayStr: todayStr,
          prevDayStr: prevDayStr
        };
      return new Response(JSON.stringify(result), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'access-control-allow-origin': '*'
        }
      });
    } catch (e) {
      return new Response('fetch_error', { status: 500 });
    }
  }
};

