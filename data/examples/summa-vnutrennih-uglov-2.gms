[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-5, 3) }
new Point { name = "B"; pos = (4, 4) }
new Point { name = "C"; pos = (5, -3) }
new Point { name = "D"; pos = (-4, -4) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "q"; elements = (ab, bc, cd, da) }
new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }
draw Angle { name = "arcD"; angle = "angD" }
Update {
  float s = angA.measure + angB.measure + angC.measure + angD.measure;
  info = "**Сумма внутренних углов четырёхугольника ABCD**: A = " + format(angA.measure, 0) + "°, B = " + format(angB.measure, 0) + "°, C = " + format(angC.measure, 0) + "°, D = " + format(angD.measure, 0) + "°.\n\nA + B + C + D = " + format(s, 0) + "° — сумма всегда равна 360°, независимо от формы четырёхугольника.";
}
]
