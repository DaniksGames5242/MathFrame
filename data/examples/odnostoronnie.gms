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
new Angle { name = "ang6"; lines = (sec, l2R) }
draw Angle { name = "da3"; angle = "ang3" }
draw Angle { name = "da6"; angle = "ang6" }
new UI { type = slider; label = "наклон нижней прямой k"; variable = k; min = -0.4; max = 0.4; step = 0.02; default = 0.2 }
Update {
  D.pos.y = -3 - 6 * k; E.pos.y = -3 + 6 * k;
  float s = ang3.measure + ang6.measure;
  string par = "не параллельны"; if (abs(k) < 0.01) { par = "параллельны"; }
  info = "**Односторонние углы** — угол ang3 у верхней прямой и угол ang6 у нижней прямой: оба внутри полосы между прямыми и по одну (правую) сторону от секущей.\n\nang3 = " + format(ang3.measure, 1) + "°, ang6 = " + format(ang6.measure, 1) + "°, сумма = " + format(s, 1) + "°. Прямые " + par + ": сумма равна 180° ровно тогда, когда прямые параллельны.";
}
]
