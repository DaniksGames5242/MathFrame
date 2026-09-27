[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float b = 4; string info = "";
func f(x) = 1 + 0.4 * x;
draw Function { name = "gr"; f = "f"; xmin = -7; xmax = 7; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "B"; pos = (4, 2.6); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "верхний предел b"; variable = b; min = 0.5; max = 6; step = 0.1; default = 4 }
Update {
  B.pos.x = b; B.pos.y = f(b);
  float V = 0; float M = 200;
  repeat (200) { float x = b * (i + 0.5) / M; float r = f(x); V = V + 3.14159 * r * r * (b / M); }
  info = "**Объём тела вращения**: кривая y = f(x) = 1 + 0,4x вращается вокруг оси Ox на отрезке [0; " + format(b, 1) + "]. Объём V = π∫₀ᵇ f²(x) dx ≈ " + format(V, 2) + ", радиус в точке x = b равен f(b) = " + format(f(b), 2) + ".";
}
]
