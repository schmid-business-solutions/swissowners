/** Leere Werte und Platzhalter aus .env.example («bitte-ersetzen», «PASSWORT») gelten als nicht gesetzt.
    So läuft die Plattform auch, wenn Hostinger alle Schlüssel verlangt und E-Mail/Payrexx noch nicht eingerichtet sind. */
export const isPlaceholder = (v: string | undefined) => !v || !v.trim() || /bitte-ersetzen|PASSWORT/i.test(v);
export const envSet = (...names: string[]) => names.every((n) => !isPlaceholder(process.env[n]));
