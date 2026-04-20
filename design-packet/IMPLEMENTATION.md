# Parallax Gate — Implementation Guide

How to take this design system from files-in-a-folder to a running product.

---

## 1. What's in this system

| Location | Purpose |
|---|---|
| `colors_and_type.css` | Every design token — drop-in stylesheet |
| `SKILL.md` + `README.md` | Agent-readable brand rules (voice, visuals, icons) |
| `ui_kits/parallax-gate/` | React (Babel-JSX) recreation of the full app shell |
| `preview/*.html` | Design system cards (swatches, type specimens, components) |
| `client/` | Imported source reference from the original Solo repo |

---

## 2. Starting a new page from scratch (HTML)

Minimum viable Parallax Gate page:

```html
<!doctype html>
<html>
<head>
  <link rel="stylesheet" href="colors_and_type.css">
</head>
<body data-rank="C">
  <h1 class="display">:: HUNTER STATUS ::</h1>
  <p>The gate holds. Continue.</p>
</body>
</html>
```

Three rules:

1. **Set `data-rank` on `<body>`** — `E | D | C | B | A | S`. This flips `--rank-color` + `--rank-glow` globally; every themed element re-tints automatically.
2. **Dark only.** Never override `--bg-void`. Never use pure white.
3. **Pull from tokens, never literals.** `color: var(--sys-cyan)`, not `color: #5ee1ff`.

---

## 3. Using the React kit in a real app

### Option A — keep it as Babel/JSX prototyping (fastest)

The kit runs today with no build step. Copy `ui_kits/parallax-gate/` anywhere, serve it, open `index.html`. Good for mocks, demos, internal tools.

### Option B — move into a Vite/Next project (production)

```bash
npm create vite@latest my-app -- --template react
```

Then:

1. Copy `colors_and_type.css` to `src/styles/tokens.css`. Import in `main.jsx`.
2. Copy `kit.css` to `src/styles/kit.css`. Import in `main.jsx`.
3. Copy the JSX files — `components.jsx`, `panels.jsx`, `Ceremony.jsx`, `BiometricWidget.jsx`, `SkillTree.jsx` — into `src/components/`.
4. **Remove** the `Object.assign(window, {...})` block at the bottom of each file.
5. **Add** `export { ... }` for every component you need, and `import { Sidebar, TopBar, StatBar } from './components/components'` in callers.
6. Delete `<script type="text/babel">` tags — let Vite/Babel handle compilation.
7. Drop `index.html`'s React CDN scripts — use npm React.

The components are deliberately cosmetic — no hooks to external services. Wire them up by passing real data as props:

```jsx
<StatBar k="STR" value={user.strength} trend={user.strengthTrend} live={fitbitConnected} />
<XPBar xp={user.totalXP} />
<Sidebar tab={tab} setTab={setTab} xp={user.totalXP} hunterName={user.name} />
```

---

## 4. Wiring the real data sources

The kit fakes these — in production, replace with real integrations:

| Stat | Source | What to compute |
|---|---|---|
| `STR` | Fitbit active-zone minutes | `min(100, zoneMinutes / target * 100)` |
| `VIT` | Fitbit sleep + RHR | Weighted avg of sleep-score + (80 − RHR) |
| `INT` | LeetCode solves | Difficulty-weighted rolling 30d count |
| `AGI` | LeetCode pace | Solves-per-week delta, clamped 0–100 |
| `SEN` | Fitbit HRV | `(HRV − 20) / 0.8` |
| `CHA` | Manual quest completion | Event-driven |

Poll Fitbit every 15 min, LeetCode daily. Persist the six-number snapshot; the UI reads it.

---

## 5. Triggering ceremonies

```jsx
const [ceremony, setCeremony] = useState(null);

// when a rank threshold is crossed:
setCeremony({ from: 'C', to: 'B' });

return (
  <>
    <YourApp />
    {ceremony && <Ceremony fromRank={ceremony.from} toRank={ceremony.to} onClose={() => setCeremony(null)} />}
  </>
);
```

Ceremony auto-dismisses in 6s. The body's `data-rank` should flip **after** the ceremony closes, not during — preserves the "the System marked the moment" feel.

---

## 6. Extending with new components

When you need a UI the kit doesn't ship, follow these guardrails:

- **Panel anatomy**: `.panel` wrapper → `.panel-title` header (with `▸` prefix in cyan) → `.panel-body`. Never skip the title.
- **Buttons**: 1px border, uppercase 11px with 0.2em tracking, glow on hover. Never filled rectangles.
- **New accent color?** Don't. Extend within the rank spectrum or use `--legendary` / `--warn` / `--ok`.
- **New font?** Don't. Orbitron (display) or JetBrains Mono (body). Period.
- **Iconography**: unicode sigil from the vocabulary in `README.md`. Never emoji. Hand-draw 1px-stroke SVG only if a sigil genuinely can't work.

---

## 7. Using this as a Claude Agent Skill

`SKILL.md` is cross-compatible with Claude Code. To hand it off:

1. Zip the project (or just `SKILL.md`, `README.md`, `colors_and_type.css`, `ui_kits/`).
2. In Claude Code: drop the folder into `.claude/skills/parallax-gate-design/`.
3. Invoke with: *"use the parallax-gate-design skill to make me a new quest panel."*

The Skill will read `README.md`, follow voice + visual rules, and output branded HTML/JSX.

---

## 8. Checklist before shipping any surface

- [ ] `<body data-rank="…">` set
- [ ] `colors_and_type.css` imported
- [ ] All copy in ALL CAPS for chrome, sentence case for lore
- [ ] Orbitron on numbers/headings, JetBrains Mono on body
- [ ] Glow used instead of drop shadows
- [ ] Sharp corners (0–2px radius)
- [ ] No emoji, no gradients as fills, no white backgrounds
- [ ] Hover state = glow + cyan, not color swap
- [ ] Either System-speak or Lore-speak in any given line — never mixed
