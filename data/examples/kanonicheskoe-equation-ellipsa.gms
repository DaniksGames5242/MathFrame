[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = 6; float b = 3.5; string info = "";
new Curve { name = "el"; type = parametric; x = "a * cos(t * 6.2832)"; y = "b * sin(t * 6.2832)"; color = #3b82f6; thickness = 3 }
new Point { name = "F1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "F2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "полуось a"; variable = a; min = 1; max = 7.5; step = 0.1; default = 6 }
new UI { type = slider; label = "полуось b"; variable = b; min = 1; max = 4.5; step = 0.1; default = 3.5 }
show axes = true; show grid = true;
Update {
  float c = sqrt(abs(a * a - b * b));
  if (a >= b) { F1.pos.x = -c; F1.pos.y = 0; F2.pos.x = c; F2.pos.y = 0; }
  if (a < b) { F1.pos.x = 0; F1.pos.y = -c; F2.pos.x = 0; F2.pos.y = c; }
  info = "**Каноническое уравнение эллипса:** x²/a² + y²/b² = 1 при a = " + format(a, 1) + ", b = " + format(b, 1) + ".\n\nФокусы (жёлтые точки) лежат на большей оси на расстоянии c = √|a² − b²| = " + format(c, 2) + " от центра.";
}
]
