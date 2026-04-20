# Parallax Gate UI Kit

Hi-fi recreation of the Parallax Gate (Solo Leveling-inspired) app shell.

**Surfaces included:**
- Shell: 44px topbar + 220px sidebar + main
- STATUS panel — core hunter vitals (radar + stat bars + XP + daily dungeon)
- PROFILE panel — rank-up history + title card + class glyph
- QUESTS panel — daily + main quests
- LORE journal — unlocked entries
- Ceremony overlay — rank-up moment

**How to view:** open `index.html`. Click sidebar tabs to flip panels. The rank proxy updates via `<body data-rank="C">` — change it to see the whole UI re-tint.

**Lifted from:** `github.com/DeepExtrema/Solo` · `client/src/components/*` + `panels/*`.

Not production code — cosmetic-fidelity only. Real interactions (Fitbit OAuth, LeetCode sync) are stubbed with demo data.
