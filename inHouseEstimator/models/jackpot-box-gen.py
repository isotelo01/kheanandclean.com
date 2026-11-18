# 2.0 jackpot sensor box: built only from convex pieces (union), so STL shells overlap and slicers merge them.
import numpy as np, itertools, struct, sys
P=[]  # list of point arrays (each a convex piece)
def cube(x0,y0,z0,x1,y1,z1): P.append(np.array(list(itertools.product([x0,x1],[y0,y1],[z0,z1])),float))
def cyl(cx,cy,z0,z1,r,n=24):
    a=np.linspace(0,2*np.pi,n,endpoint=False); ring=np.c_[cx+r*np.cos(a),cy+r*np.sin(a)]
    P.append(np.vstack([np.c_[ring,np.full(n,z0)],np.c_[ring,np.full(n,z1)]]))
# ---- base box (mm). +y = toward the players, +x = dealer's left... width along x.
W=2.5; FL=2.5
IX,IY,IH=94,74,30            # inside size
OX,OY=IX+2*W,IY+2*W; H=FL+IH
x0,x1,y0,y1=-OX/2,OX/2,-OY/2,OY/2
cube(x0,y0,0,x1,y1,FL)                                   # floor
cube(x0,y0,0,x0+W,y1,H); cube(x1-W,y0,0,x1,y1,H)         # side walls
cube(x0,y1-W,0,x1,y1,H)                                  # front wall (radar looks through it)
# back wall with a gap for the power cord + Pi's power plug (Pi ports face the back)
PIX0=-IX/2+2; GAPX=(PIX0+2, PIX0+24); GAPZ=FL+5
cube(x0,y0,0,GAPX[0],y0+W,H); cube(GAPX[1],y0,0,x1,y0+W,H); cube(GAPX[0],y0,GAPZ+16,GAPX[1],y0+W,H)
# Raspberry Pi 3B (85 x 56): 4 posts with pegs that drop into its mounting holes (58 x 49)
piy0=-IY/2+2
for hx in (3.5,61.5):
  for hy in (3.5,52.5):
    cx,cy=PIX0+hx,piy0+hy; cyl(cx,cy,FL-0.5,FL+5,3); cyl(cx,cy,FL+5,FL+8,1.15)
# radar (Hi-Link LD2450, 44 x 15 board) held flat against the inside of the front wall by two side clips + a ledge
RW,RH,RT=44+1,15+1,1.6+0.6; rz0=FL+8; ry=y1-W
for sx in (-1,1):
  ex=sx*(RW/2); cube(min(ex,ex+sx*2),ry-RT-1.5,rz0,max(ex,ex+sx*2),ry,rz0+RH)          # side wall
  cube(min(ex,ex-sx*2),ry-RT-1.5,rz0,max(ex,ex-sx*2),ry-RT,rz0+RH)                    # lip over the board edge
cube(-RW/2-2,ry-RT-1.5,rz0-2,RW/2+2,ry,rz0)                                           # ledge it stands on
# ---- lid: separate part, printed beside the box. Top plate + a ring that drops inside the walls
L=[]; Pbox=P; P=L
LX=OX+40   # print it next to the box
T=2.5
def lc(a,b,c,d,e,f): cube(a+LX,b,c,d+LX,e,f)
SL=(-7,7); SLY=(y1-30,y1-20)   # cable slot for the two sensor cables, centre front
lc(x0,y0,0,x1,SLY[0],T); lc(x0,SLY[1],0,x1,y1,T); lc(x0,SLY[0],0,SL[0],SLY[1],T); lc(SL[1],SLY[0],0,x1,SLY[1],T)
# two sensor cradles on the lid, wall-eyed: each turned YAW out from straight ahead and tilted TILT down
YAW,TILT=35,40
BW_,BH_,BT=28+1,16+1,1.6     # MLX90640-D110 board 28 x 16 mm (+0.5 mm play each side)
GAP=5                        # room behind the board for its plug/wires
FW,FH=BW_+6,BH_+4            # face plate size
def frame(sx):
  y=np.radians(YAW)*sx; t=np.radians(TILT)
  fwd=np.array([np.sin(y),np.cos(y),0.0])
  n=np.cos(t)*fwd+np.array([0,0,-np.sin(t)])          # where the sensor looks
  u=np.sin(t)*fwd+np.array([0,0,np.cos(t)])           # "up" along the face
  v=np.cross(u,n)                                     # across the face
  return n,u,v
def boxf(c,n,u,v,a0,a1,b0,b1,c0,c1):   # cuboid in face frame: v from a0..a1, u from b0..b1, n from c0..c1
  P.append(np.array([c+v*a+u*b+n*cc for a in (a0,a1) for b in (b0,b1) for cc in (c0,c1)]))
HOOD_IN=[]
for sx in (-1,1):
  n,u,v=frame(sx)
  c=np.array([LX+sx*24,y1-2,T+16.0])          # centre of the face plate
  corners=[c+v*a+u*b for a in (-FW/2,FW/2) for b in (-FH/2,FH/2)]
  # wedge behind the face: hull of the face, the face pushed back, and a footprint on the lid behind the face plane
  back=[p-n*8 for p in corners]
  foot=[]
  for p in corners+back:
    q=np.array([p[0],p[1],T]); 
    # slide back until it's behind the face plane
    while np.dot(n,q-c)>-0.5: q=q-np.array([n[0],n[1],0])/np.linalg.norm(n[:2])*0.5
    foot.append(q)
  P.append(np.array(corners+back+foot))
  # cradle on the face: two side rails (stand-off + wall + lip) and a stop bar at the bottom. Board slides in from the top.
  for s in (-1,1):
    e=s*BW_/2
    boxf(c,n,u,v,min(e,e+s*2),max(e,e+s*2),-FH/2,FH/2,0,GAP+BT+0.6+1.2)       # wall
    boxf(c,n,u,v,min(e,e-s*2.5),max(e,e-s*2.5),-FH/2,FH/2,0,GAP)               # ledge the board rests on
    boxf(c,n,u,v,min(e,e-s*1.5),max(e,e-s*1.5),-FH/2,FH/2,GAP+BT+0.6,GAP+BT+0.6+1.2)  # lip over the board's front edge
  boxf(c,n,u,v,-BW_/2-2,BW_/2+2,-FH/2,-FH/2+2,0,GAP+BT+0.6+1.2)                # bottom stop
  # Hood: a window frame 5 mm in front of the camera, closed in on the sides and bottom. The black HDPE sheet
  # (about 0.5 mm) is glued across the frames; heat goes through it, so the cameras can't be seen. Top stays open
  # (faces up and back) so the boards slide in and the wires come out.
  HD=GAP+BT+0.6+1.2+5; FT=1.6; OW_,OH_=13,8          # frame plane, frame thickness, half the window opening
  for a0,a1 in ((-FW/2,-OW_),(OW_,FW/2)): boxf(c,n,u,v,a0,a1,-FH/2,FH/2,HD,HD+FT)      # frame sides
  for b0,b1 in ((-FH/2,-OH_),(OH_,FH/2)): boxf(c,n,u,v,-FW/2,FW/2,b0,b1,HD,HD+FT)      # frame top and bottom
  for a0,a1 in ((-FW/2,-FW/2+1.5),(FW/2-1.5,FW/2)): boxf(c,n,u,v,a0,a1,-FH/2,FH/2,0,HD+FT)   # side skirts
  boxf(c,n,u,v,-FW/2,FW/2,-FH/2,-FH/2+1.5,0,HD+FT)                                     # bottom skirt
  inner=min((FW/2,-FW/2),key=lambda a:abs((c+v*a)[0]-LX))                             # the side toward the middle
  HOOD_IN.append([c+v*inner+u*b+n*k for b in (-FH/2,FH/2) for k in (0,HD+FT)])
P.append(np.array(HOOD_IN[0]+HOOD_IN[1]))   # bridge between the two hoods, so the sheet runs across the whole front
P=Pbox+L
# ---- convex hull (brute force, small point sets) -> triangles
def hull(pts):
  pts=np.unique(np.round(pts,5),axis=0); tris=[]; seen=[]
  ctr=pts.mean(0)
  for i,j,k in itertools.combinations(range(len(pts)),3):
    nrm=np.cross(pts[j]-pts[i],pts[k]-pts[i]); L_=np.linalg.norm(nrm)
    if L_<1e-6: continue
    nrm/=L_; d=np.dot(nrm,pts[i])
    s=pts@nrm-d
    if s.max()>1e-4 and s.min()<-1e-4: continue
    if s.max()>1e-4: nrm,d,s=-nrm,-d,-s
    if any(abs(np.dot(nrm,a)-1)<1e-6 and abs(d-b)<1e-4 for a,b in seen): continue
    seen.append((nrm,d))
    face=pts[np.abs(s)<1e-4]; fc=face.mean(0)
    ref=face[0]-fc; ref/=np.linalg.norm(ref); oth=np.cross(nrm,ref)
    ang=np.arctan2((face-fc)@oth,(face-fc)@ref); face=face[np.argsort(ang)]
    for m in range(1,len(face)-1): tris.append((face[0],face[m],face[m+1],nrm))
  return tris
T_=[]
for p in P: T_+=hull(p)
with open(sys.argv[1],'wb') as f:
  f.write(b'jackpot sensor box'.ljust(80,b' ')); f.write(struct.pack('<I',len(T_)))
  for a,b,c_,nn in T_:
    if np.dot(np.cross(b-a,c_-a),nn)<0: b,c_=c_,b
    f.write(struct.pack('<12fH',*nn,*a,*b,*c_,0))
allp=np.vstack(P); print('pieces',len(P),'tris',len(T_),'min',allp.min(0).round(1),'max',allp.max(0).round(1))
# preview
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
fig=plt.figure(figsize=(10,6),dpi=130); ax=fig.add_subplot(111,projection='3d')
light=np.array([0.4,-0.5,0.8]); light/=np.linalg.norm(light)
polys=[[a,b,c_] for a,b,c_,nn in T_]; sh=[0.45+0.5*max(0,np.dot(nn,light)) for *_,nn in T_]
ax.add_collection3d(Poly3DCollection(polys,facecolors=[(0.95*s,0.6*s,0.2*s) for s in sh],edgecolor='none'))
mn,mx=allp.min(0),allp.max(0); r=(mx-mn).max()/2; m=(mx+mn)/2
ax.set_xlim(m[0]-r,m[0]+r); ax.set_ylim(m[1]-r,m[1]+r); ax.set_zlim(0,2*r*0.6); ax.set_box_aspect((1,1,0.6))
ax.view_init(elev=28,azim=-62); ax.set_axis_off(); plt.tight_layout(); plt.savefig(sys.argv[2],facecolor='white')
