/* App-Modus der Android-App (Trusted Web Activity), erkannt im Browser-Tab selbst – nicht per Cookie,
   weil App und mobiler Chrome dieselben Cookies teilen. Merkmale der App:
   - Anzeige im Vollbild (display-mode: standalone), oder
   - Start durch die App (Referrer android-app://ch.swissowners.app, z. B. in der Testversion mit Adressleiste).
   Einmal erkannt, merkt sich der Tab den Modus in sessionStorage (gilt nur für diesen Tab, nicht für den Browser).
   Ist niemand angemeldet, geht es in der App zuerst zu Intro und Anmeldung (/app). Läuft im <head> vor dem Zeichnen. */
export const APP_PUBLIC = ["/app", "/login", "/registrieren", "/passwort-vergessen", "/passwort-neu", "/bestaetigen", "/agb", "/datenschutz", "/impressum"];

export const APP_MODE_SCRIPT = `(function(){try{
var d=document.documentElement,s=window.sessionStorage,k="swo_app";
var app=window.matchMedia("(display-mode: standalone)").matches||document.referrer.indexOf("android-app://ch.swissowners.app")===0;
try{if(app)s.setItem(k,"1");else if(s.getItem(k)==="1")app=true;}catch(e){}
if(!app)return;
d.setAttribute("data-app","1");
if(d.getAttribute("data-auth")!=="1"){
var p=location.pathname,pub=${JSON.stringify(APP_PUBLIC)};
var ok=pub.some(function(x){return p===x||p.indexOf(x+"/")===0;});
if(!ok){location.replace("/app"+(p==="/"?"":"?next="+encodeURIComponent(p+location.search)));}
}
}catch(e){}})();`;
