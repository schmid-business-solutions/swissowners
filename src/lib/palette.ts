/* Farbvorschau: Varianten des Rot-Verlaufs, umschaltbar im Browser (nur lokal, für die Auswahl der Leitfarbe).
   Aufruf mit ?farben=1 blendet den Umschalter ein. Die Wahl liegt in localStorage und gilt nur in diesem Browser. */
export const PALETTES = [
  { id: "aktuell", name: "Aktuell", desc: "Bordeaux, dunkel", sw: "linear-gradient(135deg,#E11A3C,#AF001E 52%,#7A0016)", theme: "#AF001E" },
  { id: "frisch", name: "A · Frisch", desc: "Klares Schweizer Rot", sw: "linear-gradient(135deg,#FF4D5E,#E8132F 52%,#BE0A26)", theme: "#E0112D" },
  { id: "hell", name: "B · Hell", desc: "Leuchtend, sehr frisch", sw: "linear-gradient(135deg,#FF6A6A,#F5283F 52%,#D4163A)", theme: "#EF2440" },
  { id: "koralle", name: "C · Koralle", desc: "Wärmer, Richtung Orange", sw: "linear-gradient(135deg,#FF8A5C,#FF4752 52%,#E0253F)", theme: "#F83F4E" },
] as const;

export const PALETTE_SCRIPT = `(function(){try{
var d=document.documentElement,q=location.search,ls=window.localStorage;
var m=q.match(/[?&]farbe=([a-z]+)/);if(m){ls.setItem("swo_palette",m[1]);ls.setItem("swo_palette_ui","1");}
if(/[?&]farben(=|&|$)/.test(q))ls.setItem("swo_palette_ui","1");
var p=ls.getItem("swo_palette");if(p&&p!=="aktuell")d.setAttribute("data-palette",p);
}catch(e){}})();`;
