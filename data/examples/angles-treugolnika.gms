[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-4, -3) }
new Point { name = "B"; pos = (4, -3) }
new Point { name = "C"; pos = (0, 3) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }
Update {
  string vid = "остроугольный"; if (angA.measure > 90 || angB.measure > 90 || angC.measure > 90) { vid = "тупоугольный"; }
  info = "**Углы треугольника ABC**: A = " + format(angA.measure, 0) + "°, B = " + format(angB.measure, 0) + "°, C = " + format(angC.measure, 0) + "°.\n\nСумма всегда равна 180°: сейчас треугольник " + vid + ".";
}
]
