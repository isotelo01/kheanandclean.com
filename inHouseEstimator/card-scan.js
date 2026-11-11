/* Business card scanner, shared by the New lead form (leads.html) and the vCard maker (vcards.html).
   AI reads the card (the page passes its readCard backend call); if that fails, Tesseract reads it on the phone.
   KCCardScan.read(file, ai) -> { out: { name, first, last, title, business, phone, phone2, email, website,
   street, city, state, zip, license, other }, raw, card (color canvas), logo ({x,y,w,h} on card, or null), by } */
(function () {
  const loadOcr = () => window.Tesseract ? Promise.resolve() : new Promise((ok, no) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"; s.onload = ok; s.onerror = () => no(new Error("reader didn't load"));
    document.head.appendChild(s);
  });
  /* Shrink to 1800px and turn grey so the reader does better and phones don't choke.
     A color copy at the same size is kept too, for cutting out the logo. */
  const cardCanvas = f => new Promise((ok, no) => {
    const img = new Image(), u = URL.createObjectURL(f);
    img.onload = () => {
      const k = Math.min(1, 1800 / Math.max(img.width, img.height)), c = document.createElement("canvas"), color = document.createElement("canvas");
      c.width = color.width = Math.round(img.width * k); c.height = color.height = Math.round(img.height * k);
      color.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      const g = c.getContext("2d"); g.filter = "grayscale(1) contrast(1.3)"; g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); c.color = color; ok(c);
    };
    img.onerror = () => { URL.revokeObjectURL(u); no(new Error("couldn't open the photo")); };
    img.src = u;
  });
  const parseCard = text => {
    const lines = text.split(/\n/).map(s => s.replace(/[|_~]+/g, " ").replace(/\s+/g, " ").trim()).filter(s => s.length > 1);
    const out = {}, all = lines.join("\n");
    const em = all.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/); if (em) out.email = em[0].toLowerCase();
    /* Website: www./http line, or a bare domain that isn't the email. */
    const web = all.match(/(?:https?:\/\/)?(?:www\.)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:\/\S*)?/i) ||
      all.match(/\b(?!\S*@)[A-Za-z0-9-]+\.(?:com|net|org|co|us|biz|info|io|homes|realty)\b(?:\/\S*)?/i);
    if (web && !(out.email && out.email.includes(web[0].toLowerCase().replace(/^https?:\/\/(www\.)?/, "")))) out.website = web[0].replace(/[.,;]+$/, "");
    /* Phones: skip fax lines; prefer a line marked cell / mobile / c / m. */
    const phones = [];
    lines.forEach(l => { (l.match(/(?:\+?1[\s.-]*)?\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}/g) || []).forEach(p => {
      if (/\bfax\b|\bf[:.]/i.test(l)) return;
      phones.push({ d: p.replace(/\D/g, "").slice(-10), cell: /cell|mobile|\bc[:.]|\bm[:.]/i.test(l) });
    }); });
    const fmt = d => "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
    const ph = phones.find(p => p.cell) || phones[0];
    if (ph) out.phone = fmt(ph.d);
    const ph2 = phones.find(p => p !== ph && p.d !== (ph && ph.d)); if (ph2) out.phone2 = fmt(ph2.d);
    const csz = all.match(/([A-Za-z .]+),?\s+([A-Z]{2})\.?\s+(\d{5})(?:-\d{4})?/);
    if (csz) { out.city = csz[1].replace(/^.*\d\s*/, "").trim(); out.state = csz[2]; out.zip = csz[3]; }
    const st = lines.find(l => /^\d+\s+\S+.*\b(st|street|ave|avenue|way|rd|road|dr|drive|blvd|ln|lane|ct|court|pl|place|pkwy|parkway|cir|circle|hwy|suite|ste)\b/i.test(l));
    if (st) out.street = st.replace(/,?\s*[A-Za-z .]+,?\s+[A-Z]{2}\.?\s+\d{5}.*$/, "").trim();
    const BIZ = /\b(inc|llc|co|corp|company|realty|real estate|properties|property|management|group|services|homes|partners|associates|brokerage|keller|coldwell|century|compass|remax|re\/max|sotheby|berkshire|exp)\b/i;
    const JOB = /\b(agent|realtor|broker|manager|director|owner|president|ceo|associate|specialist|consultant|dre|lic|license|www|http|\.com)\b/i;
    const biz = lines.find(l => BIZ.test(l) && !/@/.test(l) && !/\d{3}/.test(l)); if (biz) out.business = biz;
    const nm = lines.find(l => l !== biz && /^[A-Za-z][A-Za-z.'-]*(\s+[A-Za-z][A-Za-z.'-]*){1,2}$/.test(l) && !BIZ.test(l) && !JOB.test(l) && l.length <= 30);
    if (nm) out.name = nm.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    /* Job title: a short line with a title word, no numbers, email or web address. */
    const TITLE = /\b(agent|realtor|broker|manager|director|owner|president|ceo|cfo|coo|founder|partner|specialist|consultant|advisor|officer|coordinator|technician|sales|vice|vp|lead|supervisor|assistant)\b/i;
    const ti = lines.find(l => l !== nm && l !== biz && TITLE.test(l) && !/[@\d]|www|http|\.com/i.test(l) && l.length <= 40);
    if (ti) out.title = ti;
    return { out, raw: lines.join("\n") };
  };
  /* Logo guess: find the biggest patch of "ink" (pixels that stand out from the card's background)
     that isn't covered by words the reader found. Returns {x, y, w, h} on the color canvas, or null. */
  const findLogo = (cv, words) => {
    const W = cv.width, H = cv.height, d = cv.getContext("2d").getImageData(0, 0, W, H).data;
    const px = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    /* Background = the most common color around the edges. */
    const tally = {};
    for (let t = 0; t < 400; t++) { const e = t % 4, q = Math.floor(t / 4) / 100;
      const [r, g, b] = e === 0 ? px(Math.floor(q * (W - 1)), 2) : e === 1 ? px(Math.floor(q * (W - 1)), H - 3) : e === 2 ? px(2, Math.floor(q * (H - 1))) : px(W - 3, Math.floor(q * (H - 1)));
      const key = (r >> 4) + "," + (g >> 4) + "," + (b >> 4); tally[key] = (tally[key] || 0) + 1; }
    const bg = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0].split(",").map(v => v * 16 + 8);
    const cs = Math.max(8, Math.round(Math.max(W, H) / 48)), cols = Math.ceil(W / cs), rows = Math.ceil(H / cs), ink = new Uint8Array(cols * rows);
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      let n = 0, hit = 0;
      for (let y = cy * cs; y < Math.min(H, (cy + 1) * cs); y += 3) for (let x = cx * cs; x < Math.min(W, (cx + 1) * cs); x += 3) {
        const [r, g, b] = px(x, y); n++; if (Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]) > 90) hit++; }
      ink[cy * cols + cx] = n && hit / n > 0.08 ? 1 : 0;
    }
    /* Knock out the words (they're the name, phone, etc., not the logo). */
    (words || []).forEach(w => { if (!w || !w.bbox || (w.confidence || 0) < 55 || String(w.text || "").replace(/\W/g, "").length < 2) return;
      for (let cy = Math.floor(w.bbox.y0 / cs); cy <= Math.floor((w.bbox.y1 - 1) / cs); cy++) for (let cx = Math.floor(w.bbox.x0 / cs); cx <= Math.floor((w.bbox.x1 - 1) / cs); cx++)
        if (cy >= 0 && cy < rows && cx >= 0 && cx < cols) ink[cy * cols + cx] = 0; });
    /* Biggest connected patch wins. */
    const seen = new Uint8Array(cols * rows); let best = null;
    for (let i = 0; i < ink.length; i++) { if (!ink[i] || seen[i]) continue;
      const st = [i], box = { x0: 1e9, y0: 1e9, x1: -1, y1: -1, n: 0 }; seen[i] = 1;
      while (st.length) { const j = st.pop(), x = j % cols, y = (j - x) / cols; box.n++;
        box.x0 = Math.min(box.x0, x); box.y0 = Math.min(box.y0, y); box.x1 = Math.max(box.x1, x); box.y1 = Math.max(box.y1, y);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy, k = ny * cols + nx;
          if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && ink[k] && !seen[k]) { seen[k] = 1; st.push(k); } } }
      if (box.n >= 4 && (!best || box.n > best.n)) best = box; }
    if (!best) return null;
    const pad = cs * 0.6, x = Math.max(0, best.x0 * cs - pad), y = Math.max(0, best.y0 * cs - pad);
    return { x, y, w: Math.min(W, (best.x1 + 1) * cs + pad) - x, h: Math.min(H, (best.y1 + 1) * cs + pad) - y };
  };
  /* Brighten a dark logo photo: stretch it so the darkest bits go near black and the lightest go white.
     Runs on the phone, no AI, no cost. */
  const brighten = c => {
    const g = c.getContext("2d"), im = g.getImageData(0, 0, c.width, c.height), d = im.data, hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) hist[(d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) | 0]++;
    const n = d.length / 4; let lo = 0, hi = 255, s = 0;
    while (lo < 255 && (s += hist[lo]) < n * 0.02) lo++;
    s = 0; while (hi > 0 && (s += hist[hi]) < n * 0.02) hi--;
    if (hi - lo < 30) return c;
    const k = 255 / (hi - lo);
    for (let i = 0; i < d.length; i += 4) for (let j = 0; j < 3; j++) d[i + j] = Math.max(0, Math.min(255, (d[i + j] - lo) * k));
    g.putImageData(im, 0, 0); return c;
  };
  /* Just the logo part of the card, brightened. */
  const logoPart = (cv, b) => {
    const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(b.w)); c.height = Math.max(1, Math.round(b.h));
    c.getContext("2d").drawImage(cv, b.x, b.y, b.w, b.h, 0, 0, c.width, c.height);
    return brighten(c);
  };
  /* Turn a saved logo picture a quarter turn to the right (for a card photo taken sideways). */
  const rotate = url => new Promise((ok, no) => {
    if (!url) return ok(url);
    const img = new Image();
    img.onload = () => { const c = document.createElement("canvas"); c.width = img.height; c.height = img.width;
      const g = c.getContext("2d"); g.translate(c.width, 0); g.rotate(Math.PI / 2); g.drawImage(img, 0, 0);
      ok(c.toDataURL("image/jpeg", 0.9)); };
    img.onerror = () => no(new Error("couldn't turn the logo")); img.src = url;
  });
  /* A cut-out logo, centered on white at 400x400 with room around it so a round contact picture doesn't clip it. */
  const logoPhoto = (cv, b) => {
    const c = document.createElement("canvas"); c.width = c.height = 400; const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, 400, 400);
    const k = Math.min(270 / b.w, 270 / b.h), w = b.w * k, h = b.h * k;
    g.imageSmoothingQuality = "high"; g.drawImage(logoPart(cv, b), (400 - w) / 2, (400 - h) / 2, w, h);
    return c.toDataURL("image/jpeg", 0.88);
  };
  /* The card for the AI: color, 1568px on the long side (what it reads best), JPEG. */
  const forAi = cv => {
    const k = Math.min(1, 1568 / Math.max(cv.width, cv.height)), c = document.createElement("canvas");
    c.width = Math.round(cv.width * k); c.height = Math.round(cv.height * k);
    c.getContext("2d").drawImage(cv, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  };
  const fmtPhone = v => { const d = String(v || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
    return d.length === 10 ? "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6) : String(v || ""); };
  window.KCCardScan = {
    async read(file, ai) {
      const cv = await cardCanvas(file);
      if (ai) {
        try {
          const a = await ai(forAi(cv.color));
          const W = cv.color.width, H = cv.color.height;
          const out = { first: a.first, last: a.last, name: [a.first, a.last].filter(Boolean).join(" "), title: a.title, business: a.company,
            phone: fmtPhone(a.mobile || a.work), phone2: a.mobile ? fmtPhone(a.work) : "", email: (a.email || "").toLowerCase(), website: a.website,
            street: a.street, city: a.city, state: a.state, zip: a.zip, license: a.license, other: a.other };
          Object.keys(out).forEach(k => { if (!out[k]) delete out[k]; });
          const raw = [out.name, a.title, a.company, a.mobile && "Mobile " + a.mobile, a.work && "Work " + a.work, a.fax && "Fax " + a.fax, a.email, a.website,
            a.street, [a.city, a.state, a.zip].filter(Boolean).join(" "), a.license, a.other].filter(Boolean).join("\n");
          let logo = a.logo ? { x: a.logo.x * W, y: a.logo.y * H, w: Math.min(a.logo.w * W, W - a.logo.x * W), h: Math.min(a.logo.h * H, H - a.logo.y * H) } : null;
          if (logo && (logo.w < 8 || logo.h < 8)) logo = null;
          return { out, raw, card: cv.color, logo, by: "ai" };
        } catch (e) { console.warn("AI card reader failed, reading on the phone instead", e); }
      }
      await loadOcr();
      const r = await window.Tesseract.recognize(cv, "eng");
      const res = parseCard(r.data.text || "");
      res.card = cv.color; res.by = "phone";
      try { res.logo = findLogo(cv.color, r.data.words); } catch (e) { res.logo = null; }
      return res;
    },
    logoPhoto,
    rotate,
    /* The logo by itself, tight, for the logo spot on the card page (up to 700 x 350). */
    logoCrop(cv, b) {
      const k = Math.min(1, 700 / b.w, 350 / b.h), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(b.w * k)); c.height = Math.max(1, Math.round(b.h * k));
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      g.imageSmoothingQuality = "high"; g.drawImage(logoPart(cv, b), 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.9);
    }
  };
})();
