Drop product photos here — the landing page grid picks them up automatically
(falls back to a simple icon if a file is missing). Currently wired up:

  coca-cola.jpg.avif   <- already added
  fanta-orange.jpg
  sprite.jpg
  pet-0.3l.jpg
  pet-1.5l.jpg
  pet-0.45l.jpg
  pet-1l.jpg
  vibe.jpg
  cans.jpg

Recommended: roughly square, at least 440x440px.

IMPORTANT: the filename must match EXACTLY what's saved here, extension included.
Many sites (Google Images included) actually serve AVIF/WEBP even when the URL
or suggested filename says .jpg — if your browser saves it as something like
"sprite.jpg.avif" or "sprite.webp", either rename the file to plain "sprite.jpg",
or tell Claude the real filename so the `image:` path in
client/src/pages/landing/LandingPage.jsx gets updated to match (that's what
happened with coca-cola.jpg.avif above).
