[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 1; float b = 0.5; string info = "";
func f(x) = sin(k * x) - b;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = b >= -1 && b <= 1 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = b >= -1 && b <= 1 }
new UI { type = slider; label = "коэффициент k"; variable = k; min = 0.5; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "значение b"; variable = b; min = -1; max = 1; step = 0.1; default = 0.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (b >= -1 && b <= 1) {
    float asin_val = asin(b);
    float x1 = asin_val / k;
    float x2 = (3.14159 - asin_val) / k;
    R1.pos.x = x1; R1.pos.y = 0;
    R2.pos.x = x2; R2.pos.y = 0;
    info = "Неравенство: sin(" + format(k, 1) + "x) > " + format(b, 2) + ". Основные корни: x₁ = " + num(x1, 2) + ", x₂ = " + num(x2, 2) + " (в периоде).";
  }
}
]
