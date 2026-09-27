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
new Angle { name = "ang4"; lines = (sec, l1L) }
new Angle { name = "ang5"; lines = (sec, l2L) }
new Angle { name = "ang6"; lines = (sec, l2R) }
draw Angle { name = "da3"; angle = "ang3"; count = 1 }
draw Angle { name = "da4"; angle = "ang4"; count = 2 }
draw Angle { name = "da5"; angle = "ang5"; count = 1 }
draw Angle { name = "da6"; angle = "ang6"; count = 2 }
new UI { type = slider; label = "наклон нижней прямой k"; variable = k; min = -0.4; max = 0.4; step = 0.02; default = 0.2 }
Update {
  D.pos.y = -3 - 6 * k; E.pos.y = -3 + 6 * k;
  string par = "не параллельны"; if (abs(k) < 0.01) { par = "параллельны"; }
  info = "**Секущая пересекает две прямые** в точках V1 и V2 — всего восемь углов, связанных смежностью, вертикальностью и накрест лежащим/соответственным/односторонним расположением.\n\nСмежные при V1: ang3 + ang4 = " + format(ang3.measure + ang4.measure, 1) + "° (всегда 180°). Накрест лежащие ang3 (у V1) и ang5 (у V2): " + format(ang3.measure, 1) + "° и " + format(ang5.measure, 1) + "°.\n\nПрямые " + par + ": накрест лежащие углы равны тогда и только тогда, когда прямые параллельны.";
}
]
