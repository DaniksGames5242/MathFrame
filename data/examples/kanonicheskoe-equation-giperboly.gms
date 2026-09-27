[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = 3; float b = 2.5; string info = "";
func f1(x) = b * sqrt(x * x / (a * a) - 1);
func f2(x) = -f1(x);
draw Function { name = "g1"; f = "f1"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "g2"; f = "f2"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 3 }
new Point { name = "F1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "F2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "полуось a"; variable = a; min = 0.5; max = 7; step = 0.1; default = 3 }
new UI { type = slider; label = "полуось b"; variable = b; min = 0.5; max = 4; step = 0.1; default = 2.5 }
Update {
  float c = sqrt(a * a + b * b);
  F1.pos.x = -c; F1.pos.y = 0; F2.pos.x = c; F2.pos.y = 0;
  info = "**Каноническое уравнение гиперболы:** x²/a² − y²/b² = 1 при a = " + format(a, 1) + ", b = " + format(b, 1) + ".\n\nВетви приближаются к асимптотам y = ±(b/a)x. Фокусы (жёлтые точки) — на расстоянии c = √(a² + b²) = " + format(c, 2) + " от центра.";
}
]
