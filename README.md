# MathSide Down

A Stranger Things-inspired maze game where players solve math challenges to escape the Upside Down. Built for a school exhibit — scan the QR code to play on your phone, no app install needed.

## Play
Live at: https://dumasjarednathan00-rgb.github.io/mathside-down/

## Run locally
Open `index.html` in any browser. No server or install needed.

## Regenerate the QR code
```
cd assets
python generate_qr.py https://your-hosted-url.com
```
Outputs `assets/qr-entry.png`.

## Structure
```
index.html              main game (single file)
assets/
  qr-entry.png          printable QR entry code
  generate_qr.py        regenerate the QR for a new URL
.nojekyll               disables Jekyll on GitHub Pages
```
