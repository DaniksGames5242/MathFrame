[
description = "{info}"
field width = 20; field height = 10;
camera type = fixed;
float a = 5; float b = 3.5; float c = 4.5; string info = "";
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
new UI { type = slider; label = "AC (b)"; variable = b; min = 2; max = 6; step = 0.1; default = 3.5 }
new UI { type = slider; label = "AB (c)"; variable = c; min = 2; max = 6; step = 0.1; default = 4.5 }
new UI { type = slider; label = "BC (a)"; variable = a; min = abs(b - c) + 0.3; max = b + c - 0.3; step = 0.1; default = 5 }
Update {
  float cosA = (b * b + c * c - a * a) / (2 * b * c);
  float ra = acos(max(-1, min(1, cosA)));
  C1.pos.x = A1.pos.x + b * cos(ra); C1.pos.y = A1.pos.y + b * sin(ra); B1.pos.x = A1.pos.x + c; B1.pos.y = A1.pos.y;
  C2.pos.x = A2.pos.x + b * cos(ra); C2.pos.y = A2.pos.y + b * sin(ra); B2.pos.x = A2.pos.x + c; B2.pos.y = A2.pos.y;
  info = "**Третий признак равенства треугольников (по трём сторонам, SSS)**: AB = A₂B₂ = " + format(c, 1) + ", BC = B₂C₂ = " + format(a, 1) + ", AC = A₂C₂ = " + format(b, 1) + ".\n\nВсе три пары сторон равны, поэтому треугольники равны целиком, в том числе все углы совпадают: угол A = угол A₂ = " + format(ra * 180 / pi, 0) + "°.";
}
]
