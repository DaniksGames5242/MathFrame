[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-4, -3) }
new Point { name = "B"; pos = (2, -3) }
new Point { name = "C"; pos = (-1, 3) }
new Point { name = "D"; pos = (5, 3); dynamic = false; collision = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Line { name = "cd"; pos = (C, D) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "ext"; lines = (ca, cd) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcExt"; angle = "ext"; color = #f59e0b }
Update {
  float dx = C.pos.x - B.pos.x; float dy = C.pos.y - B.pos.y; float len = sqrt(dx * dx + dy * dy); if (len < 0.1) { len = 0.1; }
  D.pos.x = C.pos.x + dx / len * 3.5; D.pos.y = C.pos.y + dy / len * 3.5;
  info = "**Внешний угол** при вершине C (оранжевый) образован стороной CA и продолжением стороны BC за точку C.\n\nОн равен сумме несмежных внутренних углов: A + B = " + format(angA.measure, 0) + "° + " + format(angB.measure, 0) + "° = " + format(angA.measure + angB.measure, 0) + "°, что совпадает с внешним углом " + format(ext.measure, 0) + "°.";
}
]
