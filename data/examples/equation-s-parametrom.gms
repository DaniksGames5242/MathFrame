[
description = "{info}"

field width = 10;
field height = 8;
camera type = fixed;

// ---- Уравнение p·x² − 2x + 1 = 0 с параметром p. Синяя кривая — все пары (x, p), удовлетворяющие
// уравнению: p = (2x − 1)/x². Точка P на оси p задаёт значение параметра; корни при этом p —
// пересечения горизонтали на высоте p с кривой. ----
float pp = 0.5; float aA = 1; float aB = 1; string info = "";
Function cv(x) { return (2 * x - 1) / (x * x); }
Function hl(x) { return pp; }
draw Function { name = "gc"; f = "cv"; xmin = -5; xmax = 5; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gh"; f = "hl"; xmin = -5; xmax = 5; color = #f59e0b; thickness = 2 }
new Point { name = "P"; pos = (0, 0.5); pauseOnDrag = false; text = true("p"); color = #f59e0b }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("x₁"); active = aA > 0.5 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; text = true("x₂"); active = aB > 0.5 }

Function num(x, d) { if (abs(x) < 0.5 * pow(10, -d)) { return format(0, d); } if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  if (abs(P.pos.x) > 0.0001) { P.pos.x = 0; }
  if (abs(P.pos.y) > 3.85) { P.pos.y = 3.85 * sign(P.pos.y); }
  pp = P.pos.y;
  float p = pp;
  float D = 1 - p;
  float xa = 0; float xb = 0; aA = 0; aB = 0;
  if (D >= 0) {
    float s = sqrt(D);
    xa = 1 / (1 + s); aA = 1;
    if (abs(p) > 0.0001) { xb = (1 + s) / p; if (abs(xb) < 4.9 && s > 0.0001) { aB = 1; } }
  }
  if (abs(R1.pos.x - xa) > 0.0001 || abs(R1.pos.y - p) > 0.0001) { R1.pos.x = xa; R1.pos.y = p; }
  if (abs(R2.pos.x - xb) > 0.0001 || abs(R2.pos.y - p) > 0.0001) { R2.pos.x = xb; R2.pos.y = p; }
  info = "**Уравнение с параметром:** p·x² − 2x + 1 = 0. Каждому p отвечает своё уравнение; его корни — точки, где горизонталь на высоте p пересекает кривую p = (2x − 1)/x². Сейчас p = " + num(p, 2) + ".\n\n";
  if (abs(p) < 0.005) { info = info + "**p = 0:** уравнение перестаёт быть квадратным, −2x + 1 = 0, единственный корень x = 0.5 (второй корень уходит в бесконечность)."; }
  else if (p > 1.0001) { info = info + "**p > 1:** D = 4(1 − p) = " + num(4 * D, 2) + " < 0 — действительных корней нет, горизонталь проходит выше кривой."; }
  else if (p > 0.9995) { info = info + "**p = 1:** D = 0, один корень x = 1 — вершина кривой."; }
  else { info = info + "**D = 4(1 − p) = " + num(4 * D, 2) + " > 0:** x₁,₂ = (1 ± √(1 − p))/p, то есть x = " + num(xa, 3) + " и x = " + num(xb, 3) + ". "; if (p < 0) { info = info + "При p < 0 корни разных знаков."; } else { info = info + "При 0 < p < 1 оба корня положительны."; } }
  info = info + "\n\nЗначения p = 0 и p = 1 — контрольные: в них меняется число корней или вид уравнения.";
}
]
