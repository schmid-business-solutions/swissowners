# SwissOwners – Android-App

Die App ist eine **Trusted Web Activity**: Sie öffnet swissowners.ch im Vollbild über Chrome (ohne Adressleiste). Jede Änderung an der Website ist sofort auch in der App. Anmeldung mit Google/LinkedIn funktioniert, weil Chrome die Seite darstellt.

- Paketname: `ch.swissowners.app`
- Start-URL, Farben, Splash: `app/src/main/AndroidManifest.xml`, `res/values/`
- Verknüpfung App ↔ Website: `public/.well-known/assetlinks.json` (SHA-256 des Signierschlüssels). Stimmt der Fingerabdruck nicht, erscheint eine Adressleiste.

## Bauen

GitHub Actions (`.github/workflows/android.yml`) baut bei jeder Änderung in `android/` und legt das Ergebnis unter **Releases** ab. Manuell: Actions → Android-App → Run workflow.

Benötigte Repository-Secrets (Settings → Secrets and variables → Actions):

| Secret | Inhalt |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Signierschlüssel `swissowners-release.jks`, Base64-kodiert |
| `ANDROID_KEYSTORE_PASSWORD` | Passwort des Schlüssels (Alias `swissowners`) |

Ohne Secrets entsteht nur eine Testversion (Debug-Signatur, mit Adressleiste).

**Den Schlüssel nie verlieren und nie ins Repo legen** (das Repo ist öffentlich). Ohne ihn können keine Updates mehr ausgeliefert werden.

## Google Play

1. In der Play Console eine App anlegen, `SwissOwners-PlayStore.aab` aus dem Release hochladen (Play App Signing aktiviert lassen).
2. Play Console → Testen und veröffentlichen → **App-Integrität** → SHA-256 des *App-Signaturschlüssels* kopieren und in `public/.well-known/assetlinks.json` als zweiten Fingerabdruck ergänzen. Sonst zeigt die Play-Version eine Adressleiste.
3. Store-Icon: `play-store-icon-512.png`.
