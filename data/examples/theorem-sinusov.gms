[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-1, 4) }
new Point { name = "B"; pos = (-6, -4) }
new Point { name = "C"; pos = (6, -4) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "t"; elements = (ab, bc, ca) }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { angle = "angA"; count = 1 }
draw Angle { angle = "angB"; count = 1 }
draw Angle { angle = "angC"; count = 1 }
Update {
  float pi = 3.14159265;
  float ra = 3.14159265 * angA.measure / 180; float rb = 3.14159265 * angB.measure / 180; float rc = 3.14159265 * angC.measure / 180;
  float k1 = bc.length / sin(ra); float k2 = ca.length / sin(rb); float k3 = ab.length / sin(rc);
  info = "Каждая сторона треугольника относится к синусу противолежащего угла одинаково: BC/sin A = " + format(k1, 2) + ", CA/sin B = " + format(k2, 2) + ", AB/sin C = " + format(k3, 2) + " — это и есть удвоенный радиус R = " + format((k1 + k2 + k3) / 6, 2) + " описанной окружности.";
}
]
