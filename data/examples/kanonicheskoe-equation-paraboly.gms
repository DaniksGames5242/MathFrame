[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float p = 3; string info = "";
func f1(x) = sqrt(2 * p * x);
func f2(x) = -f1(x);
draw Function { name = "g1"; f = "f1"; xmin = 0.001; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "g2"; f = "f2"; xmin = 0.001; xmax = 8; color = #3b82f6; thickness = 3 }
new Point { name = "F"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "параметр p"; variable = p; min = 0.5; max = 6; step = 0.1; default = 3 }
Update {
  F.pos.x = p / 2; F.pos.y = 0;
  info = "**Каноническое уравнение параболы:** y² = 2px при p = " + format(p, 1) + ".\n\nФокус (жёлтая точка) — в точке (p/2; 0) = (" + format(p / 2, 2) + "; 0), директриса — прямая x = −" + format(p / 2, 2) + ".";
}
]
