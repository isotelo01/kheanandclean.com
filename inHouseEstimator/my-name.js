/* First name of whoever is signed in to the app, for "this is ___ with Khean & Clean" texts.
   Tyda's login says Tyda, Tyler's says Tyler, everyone else (and signed out) says Israel. */
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const NAMES = {
  "6lZy8VTy4gTBeLg4HrEGnTNPixg1": "Israel",   // kheanandclean@gmail.com
  "eoYah1xNcaT7R4lAMOVFFMS7ITN2": "Tyda",     // tydakhean@gmail.com
  "5SNJ2DzfrycMrEfbex73Lywf7KB3": "Tyler"     // tyler@licatacreativedesign.com
};

export function myName() {
  try { const u = getAuth().currentUser; return (u && NAMES[u.uid]) || "Israel"; }
  catch (e) { return "Israel"; }
}
