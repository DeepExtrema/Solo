# Parallax Gate Design System

> **"The gate is open. Awaken, Hunter."**

A dark-fantasy "System Interface" design system inspired by **Solo Leveling**, extracted from the [DeepExtrema/Solo](https://github.com/DeepExtrema/Solo) codebase (project codename: **Parallax Gate**).

Parallax Gate is a single-user career-RPG dashboard that gamifies a developer's real life — it wires **Fitbit biometrics** and **LeetCode solves** into six hunter attributes (`STR / VIT / INT / AGI / SEN / CHA`), then presents progress as an S-rank awakening ceremony. This system captures the visual + tonal DNA of that UI so we can keep building inside it.

---

## Sources

- **Codebase:** `github.com/DeepExtrema/Solo` (branch `main`) — React + Vite frontend in `client/`, Express backend in `server/`. Imported files live under `client/` in this project.
- **Key style files read:** `client/src/styles/theme.css`, `global.css`, `layout.css`.
- **Key lore files:** `client/src/data/lore.js`, `ranks.js`, `classes.js`, `stats.js`.
- **No Figma.** Everything here is lifted from code and string literals.

---

## Index

| File / Folder | Purpose |
|---|---|
| `README.md` | This file — brand context, content + visual foundations, iconography |
| `colors_and_type.css` | All CSS variables: palette, type scale, semantic tokens |
| `SKILL.md` | Agent Skill entrypoint (cross-compatible with Claude Code) |
| `fonts/` | Webfonts — (Google Fonts; linked, not vendored — see note below) |
| `assets/` | Logos, glyphs, background motifs (SVG) |
| `preview/` | HTML card specimens surfaced in the Design System tab |
| `ui_kits/parallax-gate/` | Hi-fi React recreation of the Parallax Gate app UI |
| `client/` | Imported source code (read-only reference) |

---

## Brand Context

**Name:** PARALLAX GATE
**Subtitle:** `:: SYSTEM INTERFACE //` — the product speaks as an in-world HUD.
**Genre:** Dark fantasy ✕ cyberpunk terminal ✕ Korean manhwa ("Solo Leveling").
**Audience:** A hunter-of-one. The product addresses a single user, by name, like a magical system binding itself to its bearer.

**The metaphor:** the user is a "Hunter." Real-life behaviors (gym sessions, sleep, algorithm solves, job apps) are dungeon-grinding. Ranks climb **E → D → C → B → A → S** (MONARCH). A "class change" unlocks at B-rank (ARCHITECT, IRON SOVEREIGN, SHADOW RAIDER).

---

## CONTENT FUNDAMENTALS

**Voice:** Second-person, addressing the user as "Hunter" / "you." Terse, declarative, imperative. Every sentence earns its place — no filler, no exposition dumps outside the dedicated Lore panel.

**Casing:** **ALL CAPS IS LOAD-BEARING.** Interface labels, status pills, nav items, rank names, and headings are uppercase with tracked-out letter-spacing (`0.2em`–`0.3em`). Body copy in lore + journal entries is sentence case.

**Tone:** Mythic but sparse. Half-HUD-text, half-aphorism. Shift in register between two modes:
1. **System-speak** (HUD chrome, buttons, status) — curt, technical, sigil-punctuated.
2. **Lore-speak** (journal entries, rank unlocks, quotes) — literary, cadenced, almost scriptural.

**Vocabulary:**
- `HUNTER`, `GATE`, `DUNGEON`, `RAID`, `QUEST`, `MONARCH`, `AWAKENED`, `RANK-UP`
- `SYSTEM` (always capitalized, the all-knowing narrator)
- `FITBIT SYNC ACTIVE`, `LEETCODE SYNC ACTIVE`, `STALE`, `ONLINE`
- `DEBUFFED`, `READINESS`, `RECOVERY`, `STREAK`

**Examples (from the codebase):**

System chrome:
- `:: SYSTEM INTERFACE // HUNTER TEKRON CLASSIFIED ACTIVE ::`
- `▸ INITIALIZE FITBIT SYNC`
- `◆ FITBIT SYNC ACTIVE`
- `◇ STALE`
- `▼ [DEBUFFED -12]`

Stat flavor:
- > *"Recovery is a hunter's inheritance. Rest is strategy."* (VIT)
- > *"Cadence. Consistency. The reflex of shipping daily."* (AGI)
- > *"Voice earns rooms. The monarch does not persuade — they are heard."* (CHA)

Rank-up lore:
- **D-Rank:** *"The smallest gates obey you now. The hunt has its rhythm. Continue."*
- **C-Rank:** *"No more parties. The gate opens for you alone. The System has no parental settings."*
- **S-Rank:** *"MONARCH. The city rises. The desert remembers the boy who refused to leave."*

Closing epigraph (used on the setup page):
- > *"Khudi ko kar buland itna ke har taqdeer se pehle — Khuda bande se khud poochhe, bataa teri raza kya hai."* — Iqbal

**Rules of thumb:**
- **I vs you:** Always "you." The System never says "I." The user never speaks — the System narrates _at_ them.
- **Emoji:** Never. Emoji would break the mythic register. Substituted with **unicode sigils** (see Iconography).
- **Exclamation marks:** Extremely rare; this is not a cheerful product. Power shows as quiet statement, not excitement.
- **Second-person imperatives:** OK ("Continue.", "Solve it.", "Awaken, Hunter."). Feel like system prompts or scripture.

---

## VISUAL FOUNDATIONS

**The aesthetic:** "A magical HUD projected into a void." Near-black background, cyan system glow, rank-color accents that swap with the user's rank. Everything is sharp-cornered, small-font, letter-spaced, slightly scanlined.

### Color

- **Background is almost-black:** `#05060a` (`--bg-void`). Panels are a hair warmer (`#0d0f18` → `#121524` gradient) — never pure black, never gray.
- **Borders are translucent cool blue** (`rgba(80,120,200,0.15)` → `rgba(120,220,255,0.60)` at hot). They glow, they don't rule the layout.
- **System cyan** (`#5ee1ff`) is the neutral narrator color — panel titles, interactive edges, the brand dot, input focus.
- **Rank colors are a progression, not a palette.** Ash → Viridian → Azure → Amethyst → Amber → Crimson. One rank color dominates at a time via `body[data-rank="X"]`; everything else stays cool.
- **Legendary gold** (`#ffd76a`) is reserved for earned moments: allocation buttons, all-stat glow, reward-box shatter.

### Type

- **Display:** Orbitron 500/700/900 — widescreen sci-fi geometry. Used for headings, rank names, stat numbers, brand lockup. Always tracked out (`0.12em`+).
- **Mono:** JetBrains Mono 300–800 — the workhorse. Body, labels, nav, code. Terminal-adjacent but humane.
- **Size floor is small:** base body is 14px, labels are 9–11px. Restraint leaves room for display numerics to *land* (28–48px+).
- **Letter-spacing is aggressive** on all uppercase: 0.15em minimum, 0.30em on brand.

### Spacing & Layout

- Base unit ≈ 4px. Common paddings: 8 / 12 / 16 / 20 / 24.
- **Shell:** 44px topbar + 220px sidebar + fluid main (padding `20px 24px 40px`).
- **Panels** live inside a 12-col-ish grid (`grid-2`, `grid-3` utilities). Gap: 16px.
- **Breakpoint:** collapse to single column at 1000px.

### Backgrounds

Not images — **emergent patterns.** Three layered effects stack on the whole page:
1. **Void base:** `#05060a`.
2. **Grid drift:** 48×48 translucent cyan grid, drifts 480px over 80s, masked by radial gradient so it fades at edges.
3. **Scanline:** 3px repeating horizontal lines at `rgba(255,255,255,0.012)`.

No brand photography. No full-bleed image cards. No hand-drawn illustration. **The void is the canvas.**

### Animation

- **Ease:** `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-out`) for UI state, `(0.22, 0.61, 0.36, 1)` (`--ease-snap`) for confirm-snaps.
- **Duration:** 160–220ms for hover; 600–900ms for ceremonial moments.
- **Motion vocabulary:**
  - `pulseGlow` — slow 1.8s breathing box-shadow on LEDs, brand dot, rank badges.
  - `shimmer` — horizontal gradient slide across filled bars at 2.4–3s.
  - `runeFloat` — 22s linear rise of Orbitron sigils from bottom to top across viewport.
  - `fadeInUp` — 8px translate + opacity on panel mount.
  - `boxRise` / `boxShatter` — reward box summons and breaks (600ms / 900ms).
  - `debuffFlicker` — 3.6s low-opacity hue-rotate on debuffed stats.
  - `crackGlow` — red vignette + shattered-glass pseudo-overlay for fatigue/failure.
- **Framer Motion** used for bar fills (`spring damping:22 stiffness:90`) and XP progress.
- **No bounces, no cheerful overshoots.** Motion is either ceremonial or utilitarian.

### Hover & Press

- **Buttons (default):** border `--border-mid`, text `--text-primary`.
  - **Hover:** border → `--border-hot`, color → `--sys-cyan`, `box-shadow: 0 0 18px var(--sys-cyan-glow)`.
  - **Disabled:** `opacity: 0.35`, no glow.
  - **Press:** no separate state in the codebase; the glow + color shift reads as commit.
- **Nav items:** left-border-accent flips from transparent to cyan on hover, to `--rank-color` when active, plus a whisper of background tint (`rgba(94,225,255,0.04)`).
- **Stat bars (high state, ≥80):** full color, shimmering gradient, cast a `0 0 18px` rank glow. Below 20: `opacity 0.7`.

### Borders, Shadows, Protection

- **Corner radius:** **sharp.** Panels use `2px` (`--radius-hair`), buttons are 0. Only LEDs and the brand dot are pills.
- **Outer shadow = glow, not depth.** `box-shadow: 0 0 18px <rank-glow>` in place of soft drop shadows. Light emanates; things don't hover over a ground plane.
- **Inner shadow:** `inset 0 0 12px rgba(94,225,255,0.05)` for "powered" surfaces (rank badge interior, high-stat bar).
- **Panel top highlight:** a 1px top border at `--border-hot` opacity 0.3, drawn via `::before` — the panel looks "plugged in" along the top edge.
- **No protection gradients on images** — because imagery is rare to nonexistent. Capsules are drawn as bordered boxes, never white/blur overlays.

### Transparency & Blur

- Panel backgrounds use `rgba(10,12,22,0.9)` so the grid shows through subtly.
- Occasional `mix-blend-mode: screen` on the crack-overlay for failure states.
- **No backdrop-blur.** The design commits to hard edges.

### Cards

A "card" = a `.panel`: linear gradient bg, 1px dim border, 2px radius, a cyan top-edge highlight, and a `.panel-title` header with `▸` prefix in uppercase 11px cyan.

```
┌─── ▸ STATUS VITALS ────────────────────── 14:22:08 ─┐
│                                                     │
│  STR  ██████████░░░░░░░░░░  42 / 100    FITBIT LIVE│
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

### Imagery

The codebase ships **no raster imagery.** Everything is CSS + SVG + webfont. The visual vibe is cool, borderline B&W-with-cyan-tint, never warm, never photographic. If imagery were added, it would be: high-contrast, desaturated, cyan/red-shifted, grain-heavy — never lifestyle, never product photography.

---

## ICONOGRAPHY

**Parallax Gate uses NO icon font and NO icon library.** Icons are entirely **typographic unicode sigils** in the Orbitron/JetBrains Mono families, occasionally supplemented by tiny SVG (radar polygons, charts). This is intentional: the System speaks in glyphs, not pictograms.

### The sigil vocabulary (from code)

| Sigil | Unicode | Meaning / usage |
|---|---|---|
| `▸` | U+25B8 | Panel title prefix — "the System speaks." Universal affordance: sections, action buttons (`▸ INITIALIZE FITBIT SYNC`). |
| `▼` `▲` | U+25BC / U+25B2 | Trend arrows on stats. Paired: ▲ green = up, ▼ red = down. |
| `▬` | U+25AC | Flat trend (no change). |
| `◆` | U+25C6 | "Active / bound." Status pills (`◆ FITBIT SYNC ACTIVE`), allocation badges. |
| `◇` | U+25C7 | "Stale / hollow." Counterpart to ◆ for degraded status. |
| `◈` | U+25C8 | ARCHITECT class glyph. |
| `⬢` | U+2B22 | IRON SOVEREIGN class glyph — hex shield. |
| `▲` | U+25B2 | SHADOW RAIDER class glyph — speed prism. |
| `::` | — | Separator in labels (`SYNC :: 14:22:08`, `STR :: 42`). |
| `//` | — | Secondary separator (`:: SYSTEM // HUNTER ::`). |
| `[ ]` | — | Wraps titles + debuff labels (`[ RELENTLESS HUNTER ]`, `[DEBUFFED -12]`). |

### Stat "icons"

The six stats are **typographic three-letter mnemonics** (STR / VIT / INT / AGI / SEN / CHA) set in Orbitron 700 with a per-stat color — not illustrated icons.

### Logos / wordmarks

The `PARALLAX GATE` wordmark is pure type: Orbitron 900, 0.3em tracking, cyan with a `0 0 18px` cyan glow, preceded by a 8px pulsing cyan dot. See `assets/logo.svg`.

### Charts / custom SVG

Only three SVG concepts exist in the codebase, all hand-drawn in React:
- **StatRadar** — hexagonal radar plot, 6 vertices, dashed grid at 25/50/75% rings.
- **SleepHistoryChart** — simple horizontal bars.
- **Runes** — floating Orbitron glyphs drifting up the viewport.

### Emoji

**Never.** Not in lore, not in quest labels, not in UI chrome. Emoji are incompatible with the mythic register.

### Substitutions / flags

- **Fonts:** Orbitron + JetBrains Mono are loaded from **Google Fonts via `<link>`** in the codebase. We follow the same approach (no self-hosted TTFs needed). If you want offline-safe builds, download from Google Fonts and drop into `fonts/`. **⚠ Flag:** no vendored fonts shipped in the repo.
- **Icons:** No library needed. If a future screen requires a pictographic icon (e.g. settings gear), match the aesthetic by hand-drawing a 1–1.5px stroke SVG in `--sys-cyan` or the current rank color — never fill, never rounded stroke caps.

---

## Using this system

1. Import `colors_and_type.css` at the top of any HTML file.
2. Set `<body data-rank="C">` (or whatever) to flip the accent color.
3. Use the utility classes (`.panel`, `.panel-title`, `.tag`, `.hl`, `.hl-rank`, `.mono`, `.display`, `.uppercase`, `.dim`, `.faint`).
4. For animated chrome (grid, scanlines, runes), copy the corresponding blocks from `client/src/styles/global.css` — they're reproduced in the UI kit's `index.html`.
5. When in doubt: **fewer words, tighter tracking, more glow.**

---

## Caveats

- No Figma file was provided — everything here is reverse-engineered from code + string literals.
- Fonts are Google-Fonts-linked, not vendored.
- No real brand imagery exists; the visual language is generative. If you need photography, establish a separate moodboard first.
- The "class change" system, instance dungeons, and recovery panel are partially explored here — the focus of this system is the core HUD (status / sidebar / topbar / stats / XP / ceremony).
