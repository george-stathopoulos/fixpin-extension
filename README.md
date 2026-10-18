# FixSpot extension

Point at a problem on any web page and share a private, expiring link with the screenshot, the marked spots and any page errors. Works in Chrome, Edge, Brave and Firefox. Part of [Fixpass for WordPress](https://george-stathopoulos.github.io/fixpass/); reports go to [fixspot](https://github.com/george-stathopoulos/fixspot).

## Use

1. Click the FixSpot button (or press **Alt+Shift+F**).
2. Reproduce the problem if it needs a click, then click it or drag a box around it (up to 5 spots).
3. Add a note, choose how long the link lasts (1, 7 or 30 days), optionally set a passcode, and press **Send**.
4. The link is copied. Paste it to your support team.

Errors (JavaScript errors, failed requests, console errors and warnings) are collected **from the moment you click**, not before.

## Privacy

Nothing leaves your browser until you press Send. Permissions: `activeTab` (screenshot and overlay on the page you click on), `scripting` (to add the overlay), `storage` (your server choice). No analytics. See the app's [privacy page](https://github.com/george-stathopoulos/fixspot/blob/main/docs/privacy.md).

## Develop

No build step. Chrome/Edge: `chrome://extensions` → Developer mode → **Load unpacked** → this folder. Firefox: `about:debugging` → **Load Temporary Add-on** → `manifest.json`.

To use your own server, set it in the popup under **Server**, or change `DEFAULT_SERVER` in `src/config.js`.

Package: `zip -r fixspot-extension.zip manifest.json src icons -x '*.DS_Store'`.

## License

GPL-2.0-or-later.
