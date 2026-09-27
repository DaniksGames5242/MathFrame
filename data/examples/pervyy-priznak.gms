[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float a = 5; float b = 4; float g = 60; string info = "";
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
new UI { type = slider; label = "сторона AB"; variable = a; min = 2; max = 7; step = 0.1; default = 5 }
new UI { type = slider; label = "сторона AC"; variable = b; min = 2; max = 7; step = 0.1; default = 4 }
new UI { type = slider; label = "угол A"; variable = g; min = 20; max = 140; step = 1; default = 60 }
Update {
  float rad = g * pi / 180;
  B1.pos.x = A1.pos.x + a; B1.pos.y = A1.pos.y; C1.pos.x = A1.pos.x + b * cos(rad); C1.pos.y = A1.pos.y + b * sin(rad);
  B2.pos.x = A2.pos.x + a; B2.pos.y = A2.pos.y; C2.pos.x = A2.pos.x + b * cos(rad); C2.pos.y = A2.pos.y + b * sin(rad);
  info = "**Первый признак равенства (по двум сторонам и углу между ними)**: AB = A₂B₂ = " + format(a, 1) + ", AC = A₂C₂ = " + format(b, 1) + ", угол A = угол A₂ = " + format(g, 0) + "°.\n\nПри равенстве этих трёх элементов треугольники всегда совпадают целиком — равны и третьи стороны, и остальные углы.";
}
]
