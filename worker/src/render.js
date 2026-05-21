export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderShell({ title, subtitle, deepLink, cta, canonicalUrl, ogImage, hero }) {
  const t = escapeHtml(title);
  const s = escapeHtml(subtitle);
  const link = escapeHtml(deepLink);
  const ctaHref = escapeHtml(cta.href);
  const ctaLabel = escapeHtml(cta.label);
  const url = escapeHtml(canonicalUrl);
  const img = escapeHtml(ogImage);
  const heroBlock = hero || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t}</title>
<meta name="description" content="${s}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${s}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<link rel="icon" type="image/png" href="/assets/icon128.png">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0a0a;color:#f5f5f5;font-family:'DM Sans',-apple-system,sans-serif;
       min-height:100vh;display:flex;align-items:center;justify-content:center}
  .c{text-align:center;max-width:480px;padding:48px 24px}
  .hero{width:240px;height:240px;margin:0 auto 24px;border-radius:16px;
        background:linear-gradient(135deg,#8b5cf6,#ec4899,#f97316);
        display:flex;align-items:center;justify-content:center;overflow:hidden}
  .hero img{width:100%;height:100%;object-fit:cover}
  h1{font-size:24px;font-weight:700;margin-bottom:12px}
  .sub{color:rgba(255,255,255,0.6);font-size:15px;margin-bottom:32px;line-height:1.5}
  .cta{display:inline-block;background:linear-gradient(135deg,#8b5cf6,#ec4899,#f97316);
       color:#fff;font-weight:700;font-size:16px;padding:14px 36px;border-radius:50px;
       text-decoration:none}
  .alt{display:block;margin-top:20px;color:rgba(255,255,255,0.5);font-size:13px;text-decoration:none}
</style>
</head>
<body>
<div class="c">
  ${heroBlock}
  <h1>${t}</h1>
  <p class="sub">${s}</p>
  <a id="open" href="${link}" hidden></a>
  <a href="${ctaHref}" class="cta">${ctaLabel}</a>
  <a href="parachord://" class="alt">Already have Parachord? Open it</a>
</div>
<script>setTimeout(_=>{location.href=${JSON.stringify(deepLink).replace(/</g, '\\u003c')}},50);</script>
</body>
</html>`;
}
