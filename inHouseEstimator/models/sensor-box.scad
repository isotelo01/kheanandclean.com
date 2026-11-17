// Khean & Clean - heat sensor box (no charger) for the Adafruit AMG8833 8x8 board (25.6 x 25.3 mm)
// Units: mm. Bottom faces the player's lap; the open top screws flat against the underside of the rail.
// Board drops in face-down onto 4 posts, held with 4 M2.5 self-tapping screws. Not test-rendered: check before printing.
CLR=0.5; BW=25.6+2*CLR; BL=25.3+2*CLR; WALL=2.5; FLOOR=2; POST_H=4.5; H=17;
HOLE=20.32/2;      // hole spacing: measure your board
WIN=14;            // sensor window (square)
EAR=11; EAR_T=4; SCREW_D=4; CSK_D=8;   // #6 wood screws
CAB_W=7; CAB_H=7;  // cable notch (Cat5e)
OW=BW+2*WALL; OL=BL+2*WALL;
$fn=48;
difference(){
  union(){
    translate([-OW/2,-OL/2,0]) cube([OW,OL,H]);
    translate([-OW/2-EAR,-8,H-EAR_T]) cube([OW+2*EAR,16,EAR_T]);
  }
  translate([-BW/2,-BL/2,FLOOR]) cube([BW,BL,H]);                       // pocket
  translate([-WIN/2,-WIN/2,-1]) cube([WIN,WIN,FLOOR+2]);                 // window
  translate([-CAB_W/2,OL/2-WALL-1,H-CAB_H]) cube([CAB_W,WALL+2,CAB_H+1]); // cable notch
  for(ex=[-OW/2-EAR/2,OW/2+EAR/2]){
    translate([ex,0,H-EAR_T-1]) cylinder(d=SCREW_D+CLR,h=EAR_T+2);
    translate([ex,0,H-EAR_T-0.01]) cylinder(d1=CSK_D,d2=SCREW_D,h=2);
  }
}
for(px=[-HOLE,HOLE]) for(py=[-HOLE,HOLE]) translate([px,py,FLOOR-0.5])
  difference(){ cylinder(r=2.6,h=POST_H+0.5); translate([0,0,1.3]) cylinder(d=2.1,h=POST_H); }
