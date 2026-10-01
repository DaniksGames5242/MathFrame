[
description = "{info}"
field width = 12.6; field height = 8;
camera type = fixed;
float C = 1; string info = "";
func f(x) = sin(x) + cos(x);
func g(x) = C + 0 * x;
draw Function { name = "gf"; f = "f"; xmin = -6.28; xmax = 6.28; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gc"; f = "g"; xmin = -6.28; xmax = 6.28; color = #f59e0b; thickness = 2 }
new UI { type = slider; label = "правая часть C"; variable = C; min = -1.4; max = 1.4; step = 0.1; default = 1 }
Update {
  string r = "уравнение имеет решения"; if (abs(C) > 1.4142) { r = "уравнение не имеет решений"; }
  info = "**Замена t = sin x + cos x = √2·sin(x + π/4)** сводит sin x + cos x = C к уравнению t = C.\n\nОбласть значений t — [−√2; √2] ≈ [−1,41; 1,41], поэтому при C = " + format(C, 2) + " " + r + ".";
}
]
