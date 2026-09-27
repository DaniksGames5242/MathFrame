[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 3 }
new Point { name = "P"; pos = (6, 2); dynamic = true; collideWithPoints = false; text = true("P") }
float d = 0; float a = 0; float half = 0; string info = "";
new Point { name = "T"; pos = (3, 0); dynamic = false; collision = false; color = #f59e0b; text = true("T") }
new Line { name = "ot"; pos = (O, T) }
new Line { name = "pt"; pos = (P, T); color = #3b82f6; thickness = 3 }
Update {
  float rmin = 3.05; float dx = P.pos.x - O.pos.x; float dy = P.pos.y - O.pos.y; d = sqrt(dx * dx + dy * dy);
  if (d < rmin) { P.pos.x = P.pos.x * rmin / d; P.pos.y = P.pos.y * rmin / d; d = rmin; }
  a = atan2(dy, dx); half = acos(3 / d);
  T.pos.x = 3 * cos(a - half); T.pos.y = 3 * sin(a - half);
  float len = sqrt(d * d - 9);
  info = "**Касательная** PT — прямая, у которой с окружностью (r = 3) ровно одна общая точка T (точка касания). В T радиус OT перпендикулярен касательной: ∠OTP = 90°.\n\nДлина касательной, проведённой из точки P, выражается через расстояние d = OP и радиус: PT = √(d² − r²) = " + format(len, 2) + " при d = " + format(d, 2) + ".";
}
]
