# Sania Kiran — Portfolio · "The Veil & The Strike"

An Awwwards-style personal portfolio built with **Three.js + GSAP**. Dark, editorial,
abstract — translating the Burka Avenger / "knowledge as power" motif into a
premium visual language: deep charcoal base, deep magenta-maroon cape accent,
warm gold strike highlights. No literal cartoon imagery.

## Run it

It's static — any local server works. Pick one:

```bash
# Python (simplest, usually already installed)
python -m http.server 8080
# then open http://localhost:8080

# Node
npx serve

# VS Code: right-click index.html → "Open with Live Server"
```

Opening `index.html` directly via `file://` will mostly work, but the
CDN libraries and fonts expect a real origin — use a local server.

## Structure

```
portfolio/
├── index.html          # all content + section markup
├── css/
│   └── styles.css      # design tokens + all styling + responsive
├── js/
│   └── main.js         # Three.js bg, GSAP choreography, cursor, interactions
├── assets/
│   └── favicon.svg     # the SK / quill mark
└── README.md
```

## Editing content

Everything is plain HTML — no framework, no build step.

- **Text / projects / timeline / contact links** → edit `index.html`. Each
  section is clearly commented (HERO, ABOUT, EXPERIENCE TIMELINE, PROJECTS,
  SKILLS, CONTACT).
- **Colors / fonts / spacing** → edit the CSS custom properties at the top of
  `css/styles.css` under `:root`. Change `--c-cape` to repalette the whole site.
- **Background mood** → the Three.js shader lives in `js/main.js`
  (`initBackground`). Tweak `uCape`, `uCapeSoft`, `uGold`, or the fbm/noise
  params to change the flow.
- **Cursor labels on hover** → each interactive element carries
  `data-cursor-label="..."`. Change the word shown in the morphing cursor there.

## Features

- Custom morphing cursor (dot → quill glyph → labelled cape circle) on desktop
- Three.js domain-warped "veil" shader background with gold embers, pauses when
  the tab is hidden
- Skip-able 2.5s intro loader with counter + diagonal cape-wipe reveal
- Scroll-driven section choreography (per-character heading reveals, unmasking
  line reveals, cape-wipe dividers)
- Magnetic buttons, project hover-reveal panel that tracks the cursor
- Full mobile redesign (slide-over menu, reflowed grids, horizontal scroll cue)
- Accessibility: semantic HTML, keyboard-focusable anchors, visible focus
  rings, full `prefers-reduced-motion` support, graceful fallback if a CDN fails

## Tech

- Three.js r128 (CDN) — single fullscreen shader plane
- GSAP 3.12 + ScrollTrigger (CDN)
- No build tools, no dependencies to install
