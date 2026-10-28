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

## What the poker room photos show (Oct 27 2026)
- East wall: full-length wallpapered wall with TVs (solid wall).
- One short end: the glass office's glass wall runs the full width of the poker room.
- Other short end: solid white wall with a TV.
- West side (toward the Main Room) is NOT one open wall: a pillar and the cage counter (marble half wall with under-lighting) break it up. The real walk-through opening is only part of that side. Width still to be confirmed on site.

## Now built
- Room page: Story picker (Zero, 1st, 2nd, 3rd; default 1st), saved as `spots.<key>.story`.
- Measurer (`measureRoom`) now also returns `openings`: `[{wall, from, width, type, to}]`, and it saves into the room's sketch.
  Types: door, double door, glass door, open, half wall, glass wall. Openings never change the sq ft.

## Stitching rules (for the AI that puts rooms together)
1. Top of the plan is north. Use the walls Israel names (north/south/east/west) over anything guessed from photos.
2. Each room keeps its own measured outline and sq ft. Stitching only moves and rotates rooms; it never resizes them.
3. Two rooms connect where both list an opening to each other ("to" matches the other room) or Israel says so. Line up the openings first, then slide along the shared wall.
4. Shared walls must match: if one room's wall is 13 ft and its neighbor's is 13 ft, butt them flush. If they differ, center the smaller one unless told an offset (e.g. "sticks out 3 ft past the south wall").
5. "Open" and "half wall" sides close along where the flooring, pillars or ceiling change, so floor isn't counted twice.
6. Pillars split an open side into separate openings; draw the pillar as a small solid square.
7. Fireplaces, islands and similar features are notches cut from the outline (depth × width), with a label.
8. Rooms that weren't measured (like the break room) show as a dashed box with 0 sq ft.
9. Rooms on different stories go on separate plans, one per story.
10. If a connection is unclear, ask one short question (which wall, how far along) instead of guessing.

## What the feature needs (ideas so far)
- Per room: "Which room is this next to, and which wall?" (N/S/E/W + offset along the wall) and "Open to it or a door?"
- Door types: door, double door, open entryway, glass door.
- Notches for features like fireplaces (depth × width) cut from the floor area.
- An "unmeasured room" box (like the break room) that shows on the plan but adds 0 sq ft.
- Use compass directions (he naturally says "south wall"); top of the plan = north.
