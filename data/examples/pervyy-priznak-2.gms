[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float ba = 50; float bb = 65; float k = 1.6; string info = "";
new Point { name = "A1"; pos = (-9, -3); dynamic = false; collision = false }
new Point { name = "B1"; pos = (-9, -3); dynamic = false; collision = false }
new Point { name = "C1"; pos = (-9, -3); dynamic = false; collision = false }
new Point { name = "A2"; pos = (2, -3); dynamic = false; collision = false }
new Point { name = "B2"; pos = (2, -3); dynamic = false; collision = false }
new Point { name = "C2"; pos = (2, -3); dynamic = false; collision = false }
new Line { name = "a1b1"; pos = (A1, B1) }
new Line { name = "b1c1"; pos = (B1, C1) }
new Line { name = "c1a1"; pos = (C1, A1) }
new Line { name = "a2b2"; pos = (A2, B2) }
new Line { name = "b2c2"; pos = (B2, C2) }
new Line { name = "c2a2"; pos = (C2, A2) }
new Figure { name = "t1"; elements = (a1b1, b1c1, c1a1) }
new Figure { name = "t2"; elements = (a2b2, b2c2, c2a2) }
new UI { type = slider; label = "A"; variable = ba; min = 20; max = 100; step = 1; default = 50 }
new UI { type = slider; label = "B"; variable = bb; min = 20; max = 150 - ba; step = 1; default = 65 }
new UI { type = slider; label = "k"; variable = k; min = 0.5; max = 2; step = 0.1; default = 1.6 }
Update {
  float ra = ba * pi / 180; float rb = bb * pi / 180; float c = 3.3; float m = c * sin(rb) / sin((ba + bb) * pi / 180);
  B1.pos.x = A1.pos.x + c; B1.pos.y = A1.pos.y; C1.pos.x = A1.pos.x + m * cos(ra); C1.pos.y = A1.pos.y + m * sin(ra);
  B2.pos.x = A2.pos.x + c * k; B2.pos.y = A2.pos.y; C2.pos.x = A2.pos.x + m * k * cos(ra); C2.pos.y = A2.pos.y + m * k * sin(ra);
  info = "**Первый признак подобия (по двум углам)**: угол A = угол A₂ = " + format(ba, 0) + "°, угол B = угол B₂ = " + format(bb, 0) + "°.\n\nПри равных углах стороны второго треугольника пропорциональны сторонам первого с коэффициентом k = " + format(k, 1) + ": A₂B₂ = k·AB = " + format(c * k, 2) + ", тогда как AB = " + format(c, 2) + ".";
}
]
