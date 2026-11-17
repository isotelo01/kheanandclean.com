// Khean & Clean Player Tracker - seat module (heat sensor + USB-C fast charger in one case)
// One per seat, screwed up under the poker table rail. All sizes in mm.
// Open in OpenSCAD (free), change the numbers below to the real parts, then Render (F6) and Export STL.
// Print in PETG or ASA, 4 walls, 30% infill: tough enough to take knees and bags.
//
// Layout (left to right, seen from the player): charger bay | ~1 in air gap | heat sensor bay.
// The top is open: the table's underside closes it. The port faces the player, set back 3 mm.
// The heat sensor looks down at the lap through a flared window in the bottom.

W = 110; D = 70; H = 46;        // case width (along the rail), depth (player to back), height
WALL = 3.5;                     // walls and floor
R = 6;                          // rounded corners
FRONT = 6.5;                    // front wall at the port: 3 mm recess + 3.5 mm for the panel nut
GAP = 25;                       // air gap between charger and sensor (about 1 in; make it 50 if the reading drifts)

// USB-C charger: Powerwerx panel-mount USB-C PD (1-1/8 in hole). Measure yours and change these.
PORT_D = 28.6;                  // panel hole (1-1/8 in)
PORT_Z = 23;                    // hole height
RECESS_D = 36; RECESS = 3;      // set-back pocket so the port can't get knocked off
CHARGER_BAY = 42;               // inside width of the charger bay

// Heat sensor: MLX90614 (TO-39 can, 9.1 mm). Window size and spot:
SENS_D = 11;                    // window at the inside
SENS_Y = 18;                    // distance from the front

// Mounting ears: 4 x #8 wood screws up into the table, countersunk.
EAR = 18; EAR_T = 6; SCREW_D = 4.8; CSK_D = 9.2;

CH0 = WALL; CH1 = WALL + CHARGER_BAY;
GP0 = CH1 + 3; GP1 = GP0 + GAP;
SN0 = GP1 + 3; SN1 = W - WALL;
$fn = 64;

module rbox(lo, hi, r) {
  translate(lo + [r, r, r]) minkowski() { cube(hi - lo - [2*r, 2*r, 2*r]); sphere(r); }
}

difference() {
  union() {
    intersection() { rbox([0,0,0], [W,D,H+12], R); cube([W, D, H]); }                       // body: rounded bottom, flat top
    intersection() { rbox([-EAR,6,H-EAR_T], [W+EAR,D-6,H+6], 3); translate([-EAR,0,0]) cube([W+2*EAR, D, H]); }   // ears
  }
  rbox([CH0, FRONT, WALL], [CH1, D-WALL, H+5], 2);                                             // charger bay
  rbox([GP0, WALL, WALL], [GP1, D-WALL, H+5], 2);                                              // air gap
  rbox([SN0, WALL, WALL], [SN1, D-WALL, H+5], 2);                                              // sensor bay
  translate([(CH0+CH1)/2, -5, PORT_Z]) rotate([-90,0,0]) cylinder(d=PORT_D, h=FRONT+6);       // port hole
  translate([(CH0+CH1)/2, -5, PORT_Z]) rotate([-90,0,0]) cylinder(d=RECESS_D, h=RECESS+5);    // set-back pocket
  translate([(SN0+SN1)/2, SENS_Y, -1]) cylinder(d1=SENS_D+2*WALL*1.1, d2=SENS_D, h=WALL+1.01);  // flared sensor window
  for (i = [0:5]) translate([CH0+5+i*6, FRONT+12, -2]) cube([2.5, D-FRONT-24, WALL+3]);         // vents under the charger
  for (i = [0:3]) translate([GP0+3+i*5.5, 12, -2]) cube([2.5, D-24, WALL+3]);                  // vents under the air gap
  translate([(CH0+CH1)/2, D-WALL-1, H-14]) rotate([-90,0,0]) cylinder(d=10, h=WALL+6);         // back: 12 V power in
  translate([(SN0+SN1)/2, D-WALL-1, H-14]) rotate([-90,0,0]) cylinder(d=8, h=WALL+6);          // back: sensor bus cable
  for (ex = [-EAR/2-1, W+EAR/2+1]) for (ey = [16, D-16]) {
    translate([ex, ey, H-EAR_T-1]) cylinder(d=SCREW_D, h=EAR_T+6);                             // screw hole
    translate([ex, ey, H-EAR_T-0.01]) cylinder(d1=CSK_D, d2=SCREW_D, h=2.2);                    // countersink
  }
}
