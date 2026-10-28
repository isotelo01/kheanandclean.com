# Floor plan stitching — notes for the estimator

Test job: EDH Casino — Sal Palma, Q-1103 (on-site estimate, `quotes/tVvTL2NqY3m3fFJHEK2y`).

## What the app already saves per room (job sheet spots)
- `sketch` (JSON): `d` (Claude's measurement + floor info), `pts` (outline corners in feet), `cuts`, `doors`.
- `doors`: `{w: wall index, t: 0–1 position along that wall}`. Wall 0 runs from pts[0] to pts[1], and so on.
- `sketchSqft`, `sketchSvg`, `sketchFloor`, plus Threshold / Adjacent / Before photos.
- Each room's sketch is drawn on its own. Nothing records how rooms connect.

## How the stitch was done (by hand, Oct 27 2026)
1. Pulled each room's outline (pts) at the same scale (6 px per ft).
2. Asked Israel where each room sits and which wall it shares:
   - Main Room 29.5 × 52 ft (long side north–south).
   - Open entryway at the right end of the Main Room's south wall.
   - Poker room (saved as "Conference Room") 29 × 13 ft, on the Main Room's right (east) wall, open to the Main Room along that wall.
   - Glass office 13 × 10 ft, below the poker room, same east wall, sticks out 3 ft past the Main Room's south wall. Its door opens into the Main Room.
   - Fireplace on the Main Room's left (west) wall (size still needed).
   - Break room off the Main Room (not photographed or measured).
   - Three sets of double doors (locations still needed).
3. Placed rooms by shared walls; matched wall lengths (the office's 13 ft side lines up with the poker room's 13 ft depth).

## What the feature needs (ideas so far)
- Per room: "Which room is this next to, and which wall?" (N/S/E/W + offset along the wall) and "Open to it or a door?"
- Door types: door, double door, open entryway, glass door.
- Notches for features like fireplaces (depth × width) cut from the floor area.
- An "unmeasured room" box (like the break room) that shows on the plan but adds 0 sq ft.
- Use compass directions (he naturally says "south wall"); top of the plan = north.
