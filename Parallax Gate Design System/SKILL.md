---
name: parallax-gate-design
description: Use this skill to generate well-branded interfaces and assets for Parallax Gate — a Solo Leveling-inspired self-quantification HUD that turns Fitbit + LeetCode telemetry into hunter stats, ranks, and gate dungeons. Use for production UI or throwaway prototypes/mocks/concept work in this visual register.
user-invocable: true
---

Read the `README.md` file within this skill for the full brand + voice + visual foundations. Then explore the other files:

- `colors_and_type.css` — tokens (colors, type, rank colors, spacing, motion) + semantic resets
- `preview/` — design system cards (colors, type, components, brand)
- `ui_kits/parallax-gate/` — hi-fi React recreation of the app shell + panels
- `assets/` — logo marks, class glyphs, background textures
- `fonts/` — Orbitron (display) + JetBrains Mono (body)

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and build static HTML files the user can view. If working on production code, read the rules here to design with brand fidelity.

If the user invokes this skill without guidance, ask them what they want to build, ask 4–8 focused questions (surface, rank/class context, amount of lore vs system voice, etc), and act as an expert designer who outputs HTML artifacts **or** production code, depending on the need.

**Hard rules to honor:**
- Dark-only. Void background. Never white page.
- Orbitron for display/numbers; JetBrains Mono for body. Uppercase + 0.2em tracking on labels.
- Sharp corners (0–2px). Glow replaces shadow. No gradients as fills.
- Rank color (`--rank-color`) tints the whole UI — set `<body data-rank="E|D|C|B|A|S">`.
- Two voices: SYSTEM-SPEAK (uppercase, declarative, omniscient) and LORE-SPEAK (sentence case, mythic, second person). Never mix in one line.
- No emoji. Use unicode sigils: ▸ ◆ ◇ ◈ ⬢ ▲ ▼ ◉ ⊹.
