// Khean & Clean Player Tracker - seat module (heat sensor + USB-C fast charger in one case)
// One per seat, screwed up under the poker table rail. All sizes in mm.
// Open in OpenSCAD (free), change the numbers below to the real parts, then Render (F6) and Export STL.
// Print in PETG or ASA, 4 walls, 30% infill: tough enough to take knees and bags.
//
// Layout (left to right, seen from the player): charger bay | ~1 in air gap | heat sensor bay.
// The top is open: the table's underside closes it. The port faces the player, set back 3 mm.
// The heat sensor looks down at the lap through a flared window in the bottom.
// One Cat6 network cable per seat carries 12 V and the heat sensor data (see the Hardware page for the pin layout).
// Nothing has to be lined up: the charger lies in a U-shaped cradle at the hole's height, and the sensor board
// drops into a nest over the window and snaps under two small lips. Every hole has 0.5 mm of play (CLR).

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

// Play: every hole and pocket is this much bigger so the parts just drop in (doesn't need to be precise).
CLR = 0.5;
// Heat sensor board (GY-906 style MLX90614 board): width, length, thickness. It drops into a nest over the window.
BOARD = [11.5, 17, 1.6];
// RJ45 jack (panel opening) for the one Cat6 cable per seat
RJ_W = 16; RJ_H = 13.5;

CH0 = WALL; CH1 = WALL + CHARGER_BAY;
GP0 = CH1 + 3; GP1 = GP0 + GAP;
SN0 = GP1 + 3; SN1 = W - WALL;
$fn = 64;

module rbox(lo, hi, r) {
  translate(lo + [r, r, r]) minkowski() { cube(hi - lo - [2*r, 2*r, 2*r]); sphere(r); }
}

BW = BOARD[0] + 2*CLR; BL = BOARD[1] + 2*CLR; BT = BOARD[2];
SX = (SN0+SN1)/2;
CRADLE = PORT_D/2 + CLR/2 + 0.5;

difference() {
  union() {
    // Drop-in charger cradle: a U-shaped saddle that holds the charger at the hole's height, already lined up.
    difference() {
      translate([CH0, FRONT+6, WALL-1]) cube([CH1-CH0, 24, PORT_Z-WALL+1]);
      translate([(CH0+CH1)/2, FRONT, PORT_Z]) rotate([-90,0,0]) cylinder(r=CRADLE, h=40);
    }
    // Drop-in sensor nest: low walls around the window sized to the board (+ play); two small lips snap it down.
    difference() {
      translate([SX-BW/2-1.6, SENS_Y-BL/2-1.6, WALL-1]) cube([BW+3.2, BL+3.2, BT+3.4]);
      translate([SX-BW/2, SENS_Y-BL/2, WALL-0.5]) cube([BW, BL, 10]);
    }
    for (sy = [-1, 1]) translate([SX-3, sy > 0 ? SENS_Y+BL/2-0.8 : SENS_Y-BL/2, WALL+BT+0.3]) cube([6, 0.8, 1]);
    intersection() { rbox([0,0,0], [W,D,H+12], R); cube([W, D, H]); }                       // body: rounded bottom, flat top
    intersection() { rbox([-EAR,6,H-EAR_T], [W+EAR,D-6,H+6], 3); translate([-EAR,0,0]) cube([W+2*EAR, D, H]); }   // ears
  }
  rbox([CH0, FRONT, WALL], [CH1, D-WALL, H+5], 2);                                             // charger bay
  rbox([GP0, WALL, WALL], [GP1, D-WALL, H+5], 2);                                              // air gap
  rbox([SN0, WALL, WALL], [SN1, D-WALL, H+5], 2);                                              // sensor bay
  translate([(CH0+CH1)/2, -5, PORT_Z]) rotate([-90,0,0]) cylinder(d=PORT_D+CLR, h=FRONT+6);   // port hole
  translate([(CH0+CH1)/2, -5, PORT_Z]) rotate([-90,0,0]) cylinder(d=RECESS_D+CLR, h=RECESS+5); // set-back pocket
  translate([(SN0+SN1)/2, SENS_Y, -1]) cylinder(d1=SENS_D+CLR+2*WALL*1.1, d2=SENS_D+CLR, h=WALL+1.01);  // flared sensor window
  for (i = [0:5]) translate([CH0+5+i*6, FRONT+33, -2]) cube([2.5, D-FRONT-41, WALL+3]);         // vents under the charger
  for (i = [0:3]) translate([GP0+3+i*5.5, 12, -2]) cube([2.5, D-24, WALL+3]);                  // vents under the air gap
  // One cable per seat: RJ45 (network) jack opening in the back of the sensor bay, for the Cat6 cable from the hub box
  translate([SX-(RJ_W+CLR)/2, D-WALL-1, H-10-(RJ_H+CLR)]) cube([RJ_W+CLR, WALL+6, RJ_H+CLR]);
  // Wire pass through both walls of the air gap: 12 V from the seat board over to the charger
  translate([CH1-1, D-12, H-8]) rotate([0,90,0]) cylinder(d=6+CLR, h=SN0-CH1+2);
  for (ex = [-EAR/2-1, W+EAR/2+1]) for (ey = [16, D-16]) {
    translate([ex, ey, H-EAR_T-1]) cylinder(d=SCREW_D+CLR, h=EAR_T+6);                             // screw hole
    translate([ex, ey, H-EAR_T-0.01]) cylinder(d1=CSK_D, d2=SCREW_D, h=2.2);                    // countersink
  }
}
