[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float b = 3; string info = "";
func f(x) = 0.25 * x * x;
draw Function { name = "gr"; f = "f"; xmin = -7; xmax = 7; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "B"; pos = (3, 2.25); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "верхний предел b"; variable = b; min = 0.2; max = 6; step = 0.1; default = 3 }
Update {
  B.pos.x = b; B.pos.y = f(b);
  float L = 0; float M = 300; float dx = b / M;
  repeat (300) { float x = i * dx; float df = (f(x + dx) - f(x)) / dx; L = L + sqrt(1 + df * df) * dx; }
  info = "**Длина дуги кривой** y = f(x) = 0,25x² на отрезке [0; " + format(b, 1) + "]: L = ∫₀ᵇ √(1 + (f′(x))²) dx ≈ " + format(L, 2) + ".";
}
]
