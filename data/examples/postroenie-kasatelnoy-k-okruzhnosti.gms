[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = ""; float R = 3;
new Point { name = "O"; pos = (-2, 0); text = true("O") }
new Point { name = "P"; pos = (6, 2); text = true("P") }
new Point { name = "T1"; pos = (0, 3); dynamic = false; collision = false; color = #3b82f6; text = true("T₁") }
new Point { name = "T2"; pos = (0, -3); dynamic = false; collision = false; color = #3b82f6; text = true("T₂") }
new Circle { name = "cO"; center = O; radius = R }
new Line { name = "pt1"; pos = (P, T1); color = #3b82f6 }
new Line { name = "pt2"; pos = (P, T2); color = #3b82f6 }
new UI { type = slider; label = "радиус R"; variable = R; min = 1; max = 4; step = 0.1; default = 3 }
Update {
  float dx = P.pos.x - O.pos.x; float dy = P.pos.y - O.pos.y; float d = sqrt(dx * dx + dy * dy);
  if (d < R + 0.3) { d = R + 0.3; P.pos.x = O.pos.x + dx * d / sqrt(dx * dx + dy * dy); }
  float th = atan2(dy, dx); float a = acos(R / d);
  T1.pos.x = O.pos.x + R * cos(th + a); T1.pos.y = O.pos.y + R * sin(th + a);
  T2.pos.x = O.pos.x + R * cos(th - a); T2.pos.y = O.pos.y + R * sin(th - a);
  info = "**PT₁ и PT₂ — касательные к окружности из точки P.** Расстояние d = OP = " + format(d, 2) + ", радиус R = " + format(R, 1) + ", длина касательной t = √(d² − R²) = " + format(sqrt(d * d - R * R), 2) + ". Касательная перпендикулярна радиусу в точке касания: угол OT₁P = 90°.";
}
]
