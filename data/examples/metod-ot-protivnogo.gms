[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- График f(x) = x + 1/x (x > 0) и прямая y = c. Предположение от противного:
// «найдётся x > 0, для которого f(x) < c» — точки графика под прямой. Если таких точек
// нет — предположение ложно (противоречие), и неравенство f(x) ≥ c доказано. ----
float c = 2; float D4 = 0; string info = "";
func f(x) = x + 1 / x;
func g(x) = c;
draw Function { name = "gf"; f = "f"; xmin = 0.15; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gc"; f = "g"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }

new Point { name = "X"; pos = (3, 3.333); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = c > 2.02 }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = c > 2.02 }
new Line { name = "gap"; pos = (R1, R2); color = #f59e0b; interact = false; active = c > 2.02 }

new UI { name = "sC"; type = slider; label = "c"; variable = c; min = 1; max = 3; step = 0.05; default = 2 }

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float xx = min(max(X.pos.x, 0.25), 5.5);
  float yy = xx + 1 / xx;
  if (abs(X.pos.x - xx) > 0.000001 || abs(X.pos.y - yy) > 0.000001) { X.pos.x = xx; X.pos.y = yy; }
  D4 = c * c - 4;
  if (D4 > 0.0001) {
    R1.pos.x = (c - sqrt(D4)) / 2; R1.pos.y = 0;
    R2.pos.x = (c + sqrt(D4)) / 2; R2.pos.y = 0;
  }
  info = "**Утверждение:** x + 1/x ≥ " + format(c, 2) + " при всех x > 0.\n\n**Предположение от противного:** найдётся x > 0, при котором x + 1/x < " + format(c, 2) + ". Умножив на x > 0, получаем x² − " + format(c, 2) + "·x + 1 < 0, то есть (x − " + format(c / 2, 3) + ")² < " + num(D4 / 4, 4) + ".\n\n";
  if (D4 <= 0.0001) {
    info = info + "Слева квадрат — число ≥ 0, справа " + num(D4 / 4, 4) + " ≤ 0. **Противоречие**: предположение ложно, неравенство верно при всех x > 0 (график не заходит под прямую).";
  } else {
    info = info + "Справа положительное число — противоречия нет, и предположение **выполняется** при x ∈ (" + format(R1.pos.x, 3) + "; " + format(R2.pos.x, 3) + "): неравенство неверно (на графике эти точки под прямой).";
  }
  info = info + "\n\nТочка X: x = " + format(xx, 2) + ", x + 1/x = " + format(yy, 3);
  if (yy < c - 0.0001) { info = info + " < " + format(c, 2) + " — это и есть нарушение."; } else { info = info + " ≥ " + format(c, 2) + "."; }
}
]
