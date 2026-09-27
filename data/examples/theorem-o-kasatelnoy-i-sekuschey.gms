[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 3 }
new Point { name = "P"; pos = (6, 2); dynamic = true; collideWithPoints = false; text = true("P") }
float d = 0; float a = 0; float half = 0; string info = "";
new Point { name = "T"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("T") }
new Point { name = "S1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("S1") }
new Point { name = "S2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("S2") }
new Line { name = "pt"; pos = (P, T); color = #3b82f6; thickness = 3 }
new Line { name = "ps"; pos = (P, S2) }
Update {
  float rmin = 3.05; float dx = P.pos.x - O.pos.x; float dy = P.pos.y - O.pos.y; d = sqrt(dx * dx + dy * dy);
  if (d < rmin) { P.pos.x = P.pos.x * rmin / d; P.pos.y = P.pos.y * rmin / d; d = rmin; }
  a = atan2(dy, dx); half = acos(3 / d);
  T.pos.x = 3 * cos(a - half); T.pos.y = 3 * sin(a - half);
  S1.pos.x = 3 * cos(a); S1.pos.y = 3 * sin(a); S2.pos.x = -3 * cos(a); S2.pos.y = -3 * sin(a);
  float pt = sqrt(d * d - 9); float ps1 = d - 3; float ps2 = d + 3;
  info = "**Теорема о касательной и секущей:** из точки P проведены касательная PT и секущая через центр, пересекающая окружность в S1 (ближней) и S2 (дальней).\n\nКвадрат касательной равен произведению всей секущей на её внешнюю часть: PT² = PS1 · PS2.\n\nPT² = " + format(pt * pt, 2) + ", PS1 · PS2 = " + format(ps1, 2) + " × " + format(ps2, 2) + " = " + format(ps1 * ps2, 2) + ".";
}
]
