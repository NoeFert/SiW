# Assets

Place image files here using these exact names, referenced by the code:

## sprites/
- `fafnir.png` — Fafnir the Cursed One (Wyrms, legendary)
- `athos.png` — Athos the Lord of Pain (Undead, legendary)
- `lambton-worm.png` — Ver de Lambton (Wyrms, basic)
- `new-reborn-skeleton.png` — New-reborn Skeleton (Undead, basic)
- `ampiptere.png` — Amphiptère (Wyrms, ranged)
- `necromant.png` — Necromant Initiate (Undead, ranged)
- `rocks.png` — Battlefield obstacle
- `stone-statue.png` — Spirit Fountain (home screen)
- `wyrm_sovereign.png` — Sovereign of the Wyrms (faction choice screen)
- `undead_sovereign.png` — Sovereign of the Undead (faction choice screen)

## ui/
Sprites copied from the purchased "Pixel UI & HUD" pack (Dead Revolver, itch.io), kept in full in
`asset-packs/` (local only: gitignored and outside the Vite build). Used through
`src/components/ui/8bit/styles/pixel-ui.css` and `src/ui/factionTheme.js` (see `SPECS/GRAPHICS.md`, "Interface").

Neutral sprites sit at the root of `ui/`; coloured ones are sorted into one folder per colour.
A faction's `uiColor` (`src/data/factions/`) names its palette folder (`gold` for Wyrms, `purple`
for Undead): every palette folder holds the same file names (list in `PALETTE_FILES`,
`src/ui/factionTheme.js`, checked by `tests/ui/factionTheme.test.js`), so changing `uiColor`
re-skins the whole interface of that faction.

Root (neutral):
- `button.png`, `button-pressed.png` — ButtonA states
- `group-band.png` — band showing the number of individuals on a group tile of the units grid (Black/GridPanelInactive)
- `panel-plain.png` — plain dark panel: Spirit Stones balance, settings menu, faction choice title, army rename field (Black/Panel)
- `tooltip.png` — tooltip frame (Tooltips/Black/SpeechTooltip)
- `panel.png` — card / unit tile / row / confirmation dialog panel (Black/PanelLarge)
- `badge.png`, `badge-secondary.png` — badge banners
- `bar-background.png`, `bar-foreground.png` — value bars (RegularBarA)
- `portrait-frame.png` — sovereign portrait frame on the home screen (Black/Frame)
- `scrollbar-track.png` — command tower scrollbar track (FormElements/Black/ScrollbarVertical padded to 7 px wide)
- `flask-background.png`, `flask-foreground.png` — presence gauge of the command tower (ValueBars/White: FlaskBackground, FlaskForeground; the fill is drawn in CSS in the faction colour, not the pack's FlaskFill)
- `settings.png` — settings menu icon (gear) on the home screen, next to the Spirit Stones balance (64×64, white background made transparent, shown at 32 px)
- `spirit-stone.png` — Spirit Stones icon (Black/Jewel_Spin, 9 frames of 11×11; only the first frame is shown)

Palette folders `gold/` (Wyrms) and `purple/` (Undead), same file names in both:
- `button-highlighted.png` — ButtonA hover state of the default buttons
- `badge-faction.png`, `bar-fill-faction.png` — the faction's level badge and XP bar fill, in its main colour (gold: Orange recolored; purple folder: mint, the pack's Green)
- `corner-{top,bottom}-{left,right}.png` — decorative corners (Decorators/BorderC): around the selected species on the summon screen
- `scrollbar-handle.png`, `scrollbar-handle-highlighted.png` — command tower scrollbar handle (gold: Orange recolored; pre-scaled 2×)
- `cursor-{arrow,hand,grab,unavailable}.png` — mouse cursors (Cursors: Arrow, HandUp, Grab, Unavailable; pre-scaled 2×, the size of a system cursor)
- `war-slot.png`, `war-slot-won.png`, `war-selector.png`, `war-connector-{vertical,horizontal}.png` — "Partir en guerre" map (SkillTree: SkillSlotSharp, SkillSlotSharpPlaceholder, SelectorSharp, ConnectorVertical/Horizontal; gold folder: the pack's Yellow)
- `war-boss-slot.png`, `war-boss-slot-won.png`, `war-boss-selector.png` — larger boss slot on the war map (SkillTree: SkillSlotLarge, SkillSlotLargePlaceholder, SelectorLarge)
- `gold/panel.png` — gold card panel of a legendary unit (Gold/PanelLarge); with `gold/corner-*`, used for legendaries whatever the faction
- `purple/bar-fill.png` — default bar fill, before a faction is chosen

Other colours:
- `white/` — `button-highlighted.png` (secondary buttons), `cursor-*.png` (no faction yet), `speech.png` (tutorial speech bubble, Tooltips/White/Speech)
- `red/` — `button-highlighted.png` (destructive buttons), `step-slot-{background,fill}.png` (Fafnir's ability counter, ValueSlots/Red: StepSlotA)
- `green/` — `step-slot-{background,fill}.png` (Athos's ability counter, ValueSlots/Green: StepSlotA)
- `grey/` — `war-*.png` (locked slots and connectors of the war map)
- `black/` — `divider.png` (separator between the header and the content of the meta screens; Decorators/Gold/DividerD recolored to dark grey)

## effect/
Effect spritesheets: 64×64 frames, one row per color (9 colors), one column per animation step.
- `missile-burst.png` — Wyrms missile (15 frames; orange row)
- `missile-streak.png` — Undead missile (8 frames; green row)
- `hit-slash.png` — slash on a unit hit in melee (8 frames; white row, the 6th)
- `hit-swirl.png` — swirl on a unit paralyzed by Athos (12 frames; green row)
- `hit-spikes.png` — spikes on a unit struck by Fafnir's devastating attack (13 frames; orange row, the first one)

## backgrounds/
- `battlefield-01.png` — First battlefield background (v1 scripted battle)
- `dark-castle-warm-grey.png`, `dark-castle-cold-grey.png` — home screen background, Wyrms / Undead (temporary)
- `temporary-map1.png` — "Partir en guerre" map 1 background (temporary; shown grayscale, higher contrast)
