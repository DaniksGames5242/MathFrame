[
description = "{info}"
field width = 16; field height = 18;
camera type = fixed;
new Point { name = "A"; pos = (-5, 0); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, 0); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (1, 7); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Point { name = "D"; pos = (0, -7); dynamic = false; collision = false; text = true("D") }
new Line { name = "bd"; pos = (B, D); color = #f59e0b }
new Line { name = "da"; pos = (D, A); color = #f59e0b }
string info = ""; float pAx = -5; float pAy = 0; float pBx = 5; float pBy = 0; float pCx = 1; float pCy = 7;
Update {
  float dpx = A.pos.x + B.pos.x - C.pos.x; float dpy = A.pos.y + B.pos.y - C.pos.y;
  if (abs(dpx) > 7.5 || abs(dpy) > 8.5) { A.pos.x = pAx; A.pos.y = pAy; B.pos.x = pBx; B.pos.y = pBy; C.pos.x = pCx; C.pos.y = pCy; dpx = pAx + pBx - pCx; dpy = pAy + pBy - pCy; }
  pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y; D.pos.x = dpx; D.pos.y = dpy;
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y;
  float t = ((C.pos.x - A.pos.x) * dx + (C.pos.y - A.pos.y) * dy) / (dx * dx + dy * dy);
  float hx = A.pos.x + t * dx; float hy = A.pos.y + t * dy;
  float a = ab.length;
  float h = sqrt((C.pos.x - hx) * (C.pos.x - hx) + (C.pos.y - hy) * (C.pos.y - hy));
  float S = 0.5 * a * h;
  info = "Точка D = A + B − C отражает C относительно середины AB, дополняя треугольник до **параллелограмма ACBD** (стороны BD и DA — оранжевые).\n\nПараллелограмм состоит из двух равных треугольников ABC и ABD, поэтому его площадь a·h = " + format(a, 2) + " · " + format(h, 2) + " = " + format(2 * S, 2) + " вдвое больше площади треугольника: S = ½·a·h = " + format(S, 2) + ".";
}
]
