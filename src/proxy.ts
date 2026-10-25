import { NextResponse, type NextRequest } from "next/server";

/* Der App-Modus wird nicht mehr per Cookie erkannt (Chrome teilt Cookies zwischen App und Browser),
   sondern im Browser-Tab selbst (siehe APP_MODE_SCRIPT im Layout). Hier wird nur das alte Cookie entfernt. */
export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  if (req.cookies.has("swo_app")) res.cookies.delete("swo_app");
  return res;
}

export const config = {
  matcher: ["/((?!api/|_next/|\\.well-known/|icons/|brand/|.*\\.[a-zA-Z0-9]+$).*)"],
};
