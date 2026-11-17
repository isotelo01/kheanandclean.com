// Khean & Clean - seat plate (prototype): heat sensor + RJ45 screw-terminal breakout in one printed tray.
// Units mm. Bottom faces the player's lap; the open top screws flat under the rail.
// Board sizes are guesses until the parts arrive: measure and change the numbers below. Not test-rendered.
CLR=0.5; WALL=2.5; FLOOR=2; H=20;
SX=18+2*CLR; SY=17+2*CLR;   // blue GY-AMG8833 board (about 18 x 17 mm)
SEN_UP=5;                   // sensor board rests this high; the chip faces down through the window
WIN=13;                     // window under the sensor
RX=36+2*CLR; RY=26+2*CLR;   // RJ45 breakout board (guess)
RJ_UP=2; JW=16.5; JY0=0;    // pads under the RJ45 board, jack opening width, jack offset across
DIV=2; DIV_H=10; NOTCH=8;   // divider between bays, wire notch
EAR=11; EAR_T=4; SCREW_D=4; CSK_D=8;   // #6 wood screws
IY=max(SY,RY); L=WALL+SX+DIV+RX+WALL; W=IY+2*WALL;
x0=-L/2; sx0=x0+WALL; sx1=sx0+SX; dx1=sx1+DIV; rx1=dx1+RX; scx=(sx0+sx1)/2;
$fn=48;
difference(){
  union(){
    translate([-L/2,-W/2,0]) cube([L,W,H]);
    translate([-8,-W/2-EAR,H-EAR_T]) cube([16,W+2*EAR,EAR_T]);
  }
  translate([sx0,-IY/2,FLOOR]) cube([rx1-sx0,IY,H]);                          // cavity
  translate([rx1-1,JY0-JW/2,FLOOR+RJ_UP+1]) cube([WALL+3,JW,H]);               // jack opening
  translate([scx-WIN/2,-WIN/2,-1]) cube([WIN,WIN,FLOOR+2]);                    // sensor window
  for(ey=[-W/2-EAR/2,W/2+EAR/2]){
    translate([0,ey,H-EAR_T-1]) cylinder(d=SCREW_D+CLR,h=EAR_T+2);
    translate([0,ey,H-EAR_T-0.01]) cylinder(d1=CSK_D,d2=SCREW_D,h=2);
  }
}
for(px=[sx0,sx1-3]) for(py=[-SY/2,SY/2-3]) translate([px,py,FLOOR-0.5]) cube([3,3,SEN_UP+0.5]);   // sensor pads
for(sy=[-1,1]) translate([sx0,sy>0?SY/2:-SY/2-1.6,FLOOR-0.5]) cube([SX,1.6,SEN_UP+3.5]);           // sensor side walls
difference(){ translate([sx1,-IY/2,FLOOR-0.5]) cube([DIV,IY,DIV_H+0.5]);                           // divider
  translate([sx1-1,-NOTCH/2,FLOOR+SEN_UP]) cube([DIV+2,NOTCH,H]); }
for(px=[dx1,rx1-3]) for(py=[-RY/2,RY/2-3]) translate([px,py,FLOOR-0.5]) cube([3,3,RJ_UP+0.5]);   // RJ45 pads
