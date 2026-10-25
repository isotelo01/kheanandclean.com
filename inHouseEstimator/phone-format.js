/* Phone boxes format themselves as you type: (916) 767-2520.
   Works on every <input type="tel"> on the page, including ones added later
   (like "Add phone" rows). A leading 1 / +1 is dropped. The dial pad is skipped. */
(function () {
  function fmt(v, del) {
    var d = String(v || "").replace(/\D/g, "");
    if (d.length > 10 && d.charAt(0) === "1") d = d.slice(1);
    d = d.slice(0, 10);
    if (!d) return "";
    if (d.length < 4) return del ? d : "(" + d;
    if (d.length < 7) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
  }
  function isPhone(el) {
    return el && el.tagName === "INPUT" && el.type === "tel" && el.id !== "dialNum";
  }
  document.addEventListener("input", function (e) {
    var el = e.target; if (!isPhone(el)) return;
    var del = e.inputType && e.inputType.indexOf("delete") === 0;
    var out = fmt(el.value, del);
    if (out !== el.value) el.value = out;
  });
  document.addEventListener("focusout", function (e) {
    var el = e.target; if (!isPhone(el) || !el.value) return;
    var out = fmt(el.value, false);
    if (out.replace(/\D/g, "").length === 10 && out !== el.value) el.value = out;
  });
  window.kcFormatPhone = function (v) { return fmt(v, false); };
})();
