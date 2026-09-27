[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "A"; pos = (3, 2); pauseOnDrag = false }
new Line { name = "oa"; pos = (O, A); color = #3b82f6 }
draw Vector { name = "voa"; edge = "oa" }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float dx = A.pos.x; float dy = A.pos.y; float len = sqrt(dx*dx+dy*dy);
  if (len < 0.2) { len = 0.2; }
  float ang = atan2(dy, dx) * 180 / 3.14159265; if (ang < 0) { ang = ang + 360; }
  info = "**Направление вектора OA** задаётся углом с осью Ox: φ = " + format(ang,1) + "°.\n\nЕдиничный вектор того же направления имеет координаты (" + num(dx/len,2) + "; " + num(dy/len,2) + ") — их называют направляющими косинусами.";
}
]
