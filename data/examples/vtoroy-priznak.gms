[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float c = 6; float ba = 55; float bb = 55; string info = "";
new Point { name = "A1"; pos = (-9, -3); dynamic = false; collision = false }
new Point { name = "B1"; pos = (-9, -3); dynamic = false; collision = false }
new Point { name = "C1"; pos = (-9, -3); dynamic = false; collision = false }
new Point { name = "A2"; pos = (1, -3); dynamic = false; collision = false }
new Point { name = "B2"; pos = (1, -3); dynamic = false; collision = false }
new Point { name = "C2"; pos = (1, -3); dynamic = false; collision = false }
new Line { name = "a1b1"; pos = (A1, B1) }
new Line { name = "b1c1"; pos = (B1, C1) }
new Line { name = "c1a1"; pos = (C1, A1) }
new Line { name = "a2b2"; pos = (A2, B2) }
new Line { name = "b2c2"; pos = (B2, C2) }
new Line { name = "c2a2"; pos = (C2, A2) }
new Figure { name = "t1"; elements = (a1b1, b1c1, c1a1) }
new Figure { name = "t2"; elements = (a2b2, b2c2, c2a2) }
new UI { type = slider; label = "сторона AB"; variable = c; min = 3; max = 8; step = 0.1; default = 6 }
new UI { type = slider; label = "угол A"; variable = ba; min = 20; max = 100; step = 1; default = 55 }
new UI { type = slider; label = "угол B"; variable = bb; min = 20; max = 150 - ba; step = 1; default = 55 }
Update {
  float g = 180 - ba - bb; if (g < 5) { g = 5; }
  B1.pos.x = A1.pos.x + c; B1.pos.y = A1.pos.y; float ra = ba * pi / 180; float rb = bb * pi / 180;
  float k = c * sin(rb) / sin((ba + bb) * pi / 180);
  C1.pos.x = A1.pos.x + k * cos(ra); C1.pos.y = A1.pos.y + k * sin(ra);
  B2.pos.x = A2.pos.x + c; B2.pos.y = A2.pos.y; C2.pos.x = A2.pos.x + k * cos(ra); C2.pos.y = A2.pos.y + k * sin(ra);
  info = "**Второй признак равенства (по стороне и двум прилежащим углам)**: AB = A₂B₂ = " + format(c, 1) + ", угол A = угол A₂ = " + format(ba, 0) + "°, угол B = угол B₂ = " + format(bb, 0) + "°.\n\nТретий угол C = 180° − " + format(ba, 0) + "° − " + format(bb, 0) + "° = " + format(g, 0) + "° определён однозначно, и треугольники совпадают целиком.";
}
]
