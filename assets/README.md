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
`src/components/ui/8bit/styles/pixel-ui.css` (see `SPECS/GRAPHICS.md`, "Interface").
- `button.png`, `button-pressed.png`, `button-highlighted-{white,purple,gold,red}.png` — ButtonA states (gold: Wyrms player)
- `group-band.png` — band showing the number of individuals on a group tile of the units grid (Black/GridPanelInactive)
- `panel-plain.png` — plain dark panel around the Spirit Stones balance (home and summon screens) (Black/Panel)
- `panel.png`, `panel-gold.png` — card / unit tile panel (Black and Gold/PanelLarge; gold for a legendary unit)
- `badge.png`, `badge-secondary.png`, `badge-wyrms.png`, `badge-undead.png` — badge banners
- `bar-background.png`, `bar-foreground.png`, `bar-fill-{purple,undead,wyrms}.png` — value bars (RegularBarA): Spirit Fountain (purple), XP (Green; Orange recolored to gold for Wyrms)
- `divider-black.png` — separator between the header and the content of the meta screens (Decorators/Gold/DividerD recolored to dark grey: no black variant in the pack)
- `portrait-frame.png` — sovereign portrait frame on the home screen (Black/Frame)
- `war-slot-{yellow,purple,grey}.png`, `war-slot-won-{yellow,purple}.png`, `war-selector-{yellow,purple,grey}.png`, `war-connector-{vertical,horizontal}-{yellow,purple,grey}.png` — "Partir en guerre" map (SkillTree: SkillSlotSharp, SkillSlotSharpPlaceholder, SelectorSharp, ConnectorVertical/Horizontal)
- `war-boss-slot-{yellow,purple,grey}.png`, `war-boss-slot-won-{yellow,purple}.png`, `war-boss-selector-{yellow,purple,grey}.png` — larger boss slot on the war map (SkillTree: SkillSlotLarge, SkillSlotLargePlaceholder, SelectorLarge)
- `corner-{gold,purple}-{top,bottom}-{left,right}.png` — decorative corners (Decorators/Gold and Purple/BorderC): gold on a legendary unit tile; gold (Wyrms) or purple (Undead) around the selected species on the summon screen
- `scrollbar-track.png`, `scrollbar-handle-{purple,gold}.png`, `scrollbar-handle-highlighted-{purple,gold}.png` — command tower scrollbar (track: FormElements/Black/ScrollbarVertical padded to 7 px wide; handles: Purple and Orange recolored to gold ScrollbarHandle, ScrollbarHandleHighlighted; pre-scaled 2×)
- `flask-background.png`, `flask-foreground.png` — presence gauge of the command tower (ValueBars/White: FlaskBackground, FlaskForeground; the fill is drawn in CSS in the faction colour, not the pack's FlaskFill)
- `spirit-stone.png` — Spirit Stones icon (Black/Jewel_Spin, 9 frames of 11×11; only the first frame is shown)

## effect/
Effect spritesheets: 64×64 frames, one row per color (9 colors), one column per animation step.
- `missile-burst.png` — Wyrms missile (15 frames; orange row)
- `missile-streak.png` — Undead missile (8 frames; green row)

## backgrounds/
- `battlefield-01.png` — First battlefield background (v1 scripted battle)
- `dark-castle-warm-grey.png`, `dark-castle-cold-grey.png` — home screen background, Wyrms / Undead (temporary)
- `temporary-map1.png` — "Partir en guerre" map 1 background (temporary; shown grayscale, higher contrast)
