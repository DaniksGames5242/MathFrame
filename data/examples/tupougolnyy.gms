[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = ""; float lax = -3; float lay = -2; float lbx = 3; float lby = -2; float lcx = 0; float lcy = 0.5;
new Point { name = "A"; pos = (-3, -2); pauseOnDrag = false }
new Point { name = "B"; pos = (3, -2); pauseOnDrag = false }
new Point { name = "C"; pos = (0, 0.5); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }
Update {
  if (angA.measure <= 90 && angB.measure <= 90 && angC.measure <= 90) {
    A.pos.x = lax; A.pos.y = lay; B.pos.x = lbx; B.pos.y = lby; C.pos.x = lcx; C.pos.y = lcy;
  } else { lax = A.pos.x; lay = A.pos.y; lbx = B.pos.x; lby = B.pos.y; lcx = C.pos.x; lcy = C.pos.y; }
  info = "**Тупоугольный треугольник ABC**: ровно один угол больше 90°. A = " + format(angA.measure, 0) + "°, B = " + format(angB.measure, 0) + "°, C = " + format(angC.measure, 0) + "°.";
}
]
