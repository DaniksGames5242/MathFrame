[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-4, -3) }
new Point { name = "B"; pos = (4, -3) }
new Point { name = "C"; pos = (-1, 3) }
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
  float s = angA.measure + angB.measure + angC.measure;
  info = "**Сумма внутренних углов треугольника ABC**: A = " + format(angA.measure, 0) + "°, B = " + format(angB.measure, 0) + "°, C = " + format(angC.measure, 0) + "°.\n\nA + B + C = " + format(s, 0) + "° — всегда равна развёрнутому углу, 180°.";
}
]
