/* Business card scanner, shared by the New lead form (leads.html) and the vCard maker (vcards.html).
   Tesseract reads the photo right on the phone (nothing is sent anywhere).
   KCCardScan.read(file) -> { out: { name, title, business, phone, email, website, street, city, state, zip }, raw } */
(function () {
  const loadOcr = () => window.Tesseract ? Promise.resolve() : new Promise((ok, no) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"; s.onload = ok; s.onerror = () => no(new Error("reader didn't load"));
    document.head.appendChild(s);
  });
  /* Shrink to 1800px and turn grey so the reader does better and phones don't choke. */
  const cardCanvas = f => new Promise((ok, no) => {
    const img = new Image(), u = URL.createObjectURL(f);
    img.onload = () => {
      const k = Math.min(1, 1800 / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const g = c.getContext("2d"); g.filter = "grayscale(1) contrast(1.3)"; g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); ok(c);
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
  window.KCCardScan = {
    async read(file) {
      await loadOcr();
      const r = await window.Tesseract.recognize(await cardCanvas(file), "eng");
      return parseCard(r.data.text || "");
    }
  };
})();
