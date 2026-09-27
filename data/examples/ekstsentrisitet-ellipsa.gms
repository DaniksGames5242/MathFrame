[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 4; float b = 2; string info = ""; float c = 0;
new Curve { name = "el"; type = parametric; x = "a * cos(6.2832 * t)"; y = "b * sin(6.2832 * t)"; color = #3b82f6; thickness = 3 }
new Point { name = "F1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "F2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "a"; variable = a; min = 3; max = 6; step = 0.1; default = 4 }
new UI { type = slider; label = "b"; variable = b; min = 0.3; max = a - 0.1; step = 0.1; default = 2 }
Update {
  c = sqrt(a * a - b * b);
  F1.pos.x = -c; F1.pos.y = 0; F2.pos.x = c; F2.pos.y = 0;
  float e = c / a;
  info = "**Эксцентриситет эллипса** ε = c/a, где c = √(a² − b²) — расстояние от центра до фокуса F₁ или F₂.\n\nПри a = " + format(a, 1) + ", b = " + format(b, 1) + ": c = " + format(c, 2) + ", ε = " + format(e, 3) + ". При ε → 0 эллипс приближается к окружности, при ε → 1 вырождается в отрезок.";
}
]
