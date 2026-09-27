[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 0.2; string info = "";
new Point { name = "A"; pos = (-9, 3); dynamic = false; collision = false }
new Point { name = "V1"; pos = (0, 3); dynamic = false; collision = false }
new Point { name = "C"; pos = (9, 3); dynamic = false; collision = false }
new Point { name = "V2"; pos = (0, -3); dynamic = false; collision = false }
new Point { name = "D"; pos = (-6, -3); dynamic = false; collision = false }
new Point { name = "E"; pos = (6, -3); dynamic = false; collision = false }
new Line { name = "l1L"; pos = (A, V1) }
new Line { name = "l1R"; pos = (V1, C) }
new Line { name = "sec"; pos = (V1, V2) }
new Line { name = "l2L"; pos = (D, V2) }
new Line { name = "l2R"; pos = (V2, E) }
new Angle { name = "ang3"; lines = (sec, l1R) }
new Angle { name = "ang5"; lines = (sec, l2L) }
draw Angle { name = "da3"; angle = "ang3" }
draw Angle { name = "da5"; angle = "ang5" }
new UI { type = slider; label = "наклон нижней прямой k"; variable = k; min = -0.4; max = 0.4; step = 0.02; default = 0.2 }
Update {
  D.pos.y = -3 - 6 * k; E.pos.y = -3 + 6 * k;
  string eq = "не равны"; string par = "не параллельны";
  if (abs(k) < 0.01) { eq = "равны"; par = "параллельны"; }
  info = "**Накрест лежащие углы** — угол ang3 у верхней прямой (справа от секущей) и угол ang5 у нижней прямой (слева от секущей): оба внутри полосы между прямыми, по разные стороны от секущей.\n\nang3 = " + format(ang3.measure, 1) + "°, ang5 = " + format(ang5.measure, 1) + "° — они " + eq + ", так как прямые " + par + ".";
}
]
