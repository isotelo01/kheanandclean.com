/* ============================================================================
   KHEAN & CLEAN — SHARED SITE FOOTER  (markup)
   Pairs with footer.css. Edit here once and every page changes.
   On each page, the footer is just:
     <div data-kc-footer></div>
     <script src="footer.js"></script>
   Do not paste footer HTML back into the pages.
   ============================================================================ */
(function(){
  var html = [
'<footer class="foot">',
'  <div class="wrap">',
'    <div class="foot__top">',
'      <div>',
'        <a class="mark--img" href="index.html">',
'          <img src="images/logo.png" alt="Khean &amp; Clean" width="492" height="439" decoding="async">',
'          <span class="mark__sub">Folsom, California</span>',
'        </a>',
'        <p class="foot__blurb">Owner-operated steam cleaning for carpet, tile, rugs and upholstery across the Folsom area.</p>',
'      </div>',
'      <div>',
'        <h4>Services</h4>',
'        <ul>',
'          <li><a href="carpet.html">Carpet cleaning</a></li>',
'          <li><a href="tile-and-grout.html">Tile &amp; grout</a></li>',
'          <li>Area rugs</li>',
'          <li><a href="upholstery.html">Upholstery</a></li>',
'          <li>Pet odor &amp; stains</li>',
'          <li>Water extraction</li>',
'        </ul>',
'      </div>',
'      <div class="foot__contact">',
'        <h4>Contact us</h4>',
'        <ul class="foot__deets">',
'          <li><a class="foot__tel" href="tel:+19167672520">(916) 767-2520</a></li>',
'          <li>Folsom, CA 95630</li>',
'          <li>9am &ndash; 9pm, seven days</li>',
'          <li>After-hours water removal</li>',
'          <li><a href="index.html#about">About us</a></li>',
'          <li><a href="reviews.html">Leave us a review</a></li>',
'        </ul>',
'        <a class="btn" href="contact.html" style="margin-top:1.3rem;">Contact us</a>',
'        <ul class="foot__social">',
'          <li><a href="https://www.instagram.com/kheanandclean_" target="_blank" rel="noopener" aria-label="Khean &amp; Clean on Instagram" title="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17.1" cy="6.9" r="0.9" fill="currentColor" stroke="none"/></svg></a></li>',
'          <li><a href="https://www.facebook.com/kheanandclean" target="_blank" rel="noopener" aria-label="Khean &amp; Clean on Facebook" title="Facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 21v-7.5h2.5l.5-3h-3V8.2c0-.87.24-1.46 1.5-1.46H17.6V4.14C17.3 4.1 16.3 4 15.13 4c-2.44 0-4.13 1.49-4.13 4.22V10.5H8.5v3H11V21"/></svg></a></li>',
'          <li><a href="https://www.tiktok.com/@kheanandclean" target="_blank" rel="noopener" aria-label="Khean &amp; Clean on TikTok" title="TikTok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3v10.5a3.5 3.5 0 1 1-2.5-3.36"/><path d="M15 3c.5 2.8 2.2 4.6 5 5"/></svg></a></li>',
'          <li><a href="https://youtube.com/@kheanandclean" target="_blank" rel="noopener" aria-label="Khean &amp; Clean on YouTube" title="YouTube"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="3.5"/><path d="M10.5 9.2v5.6l5-2.8z" fill="currentColor" stroke="none"/></svg></a></li>',
'          <li><a href="https://nextdoor.com/page/khean-clean-llc" target="_blank" rel="noopener" aria-label="Khean &amp; Clean on Nextdoor" title="Nextdoor"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 9.8V20h11V9.8"/><path d="M10 20v-5.5h4V20"/></svg></a></li>',
'          <li><a href="https://share.google/WqCEVR6luBP0HGYYN" target="_blank" rel="noopener" aria-label="Khean &amp; Clean on Google" title="Google"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.8 5.8 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.8-3.8-9s1.3-6.5 3.8-9z"/></svg></a></li>',
'        </ul>',
'      </div>',
'    </div>',
'    <div class="foot__legal">',
'      <span>&copy; ' + new Date().getFullYear() + ' Khean &amp; Clean llc</span>',
'      <span>Licensed &amp; insured</span>',
'      <span>Serving Folsom &amp; surrounding communities</span>',
'    </div>',
'  </div>',
'</footer>'
  ].join('\n');

  var spots = document.querySelectorAll('[data-kc-footer]');
  for (var i = 0; i < spots.length; i++) spots[i].outerHTML = html;
})();
