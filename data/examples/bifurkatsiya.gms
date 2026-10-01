[
description = "{info}"

field width = 16;
field height = 9;
camera type = fixed;

// ---- Слева — паутинная диаграмма xₙ₊₁ = r·xₙ(1 − xₙ) в квадрате [0; 1]², справа —
// бифуркационная диаграмма: предельные значения xₙ при каждом r ∈ [2.5; 4] ----
new Point { name = "A0"; pos = (-7.5, -3.6); dynamic = false; collision = false; active = false }
new Point { name = "A1"; pos = (-1, -3.6); dynamic = false; collision = false; active = false }
new Point { name = "A2"; pos = (-1, 2.9); dynamic = false; collision = false; active = false }
new Point { name = "A3"; pos = (-7.5, 2.9); dynamic = false; collision = false; active = false }
new Line { name = "xAxis"; pos = (A0, A1); interact = false; thickness = 1.5 }
new Line { name = "a12"; pos = (A1, A2); interact = false; thickness = 1 }
new Line { name = "a23"; pos = (A2, A3); interact = false; thickness = 1 }
new Line { name = "a30"; pos = (A3, A0); interact = false; thickness = 1.5 }
new Line { name = "diag"; pos = (A0, A2); interact = false; thickness = 1 }
new Curve { name = "par"; type = parametric; x = "-7.5 + 6.5 * t"; y = "-3.6 + 6.5 * r * t * (1 - t)"; segments = 120; color = #3b82f6; thickness = 2.5 }
draw Graph { name = "gCob"; graph = "gc"; edgeColor = #ef4444; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 22 }
new Point { name = "X"; line = "xAxis"; t = 0.2; text = true("x₀"); pauseOnDrag = false; color = #ef4444 }
draw Text { name = "lx"; pos = (-4.25, 3.4); text = "xₙ₊₁ = r·xₙ(1 − xₙ)"; size = 1.1 }

new Point { name = "B0"; pos = (0.5, -3.6); dynamic = false; collision = false; active = false }
new Point { name = "B1"; pos = (7.5, -3.6); dynamic = false; collision = false; active = false }
new Point { name = "B2"; pos = (7.5, 2.9); dynamic = false; collision = false; active = false }
new Point { name = "B3"; pos = (0.5, 2.9); dynamic = false; collision = false; active = false }
new Line { name = "rAxis"; pos = (B0, B1); interact = false; thickness = 1.5 }
new Line { name = "b12"; pos = (B1, B2); interact = false; thickness = 1 }
new Line { name = "b23"; pos = (B2, B3); interact = false; thickness = 1 }
new Line { name = "b30"; pos = (B3, B0); interact = false; thickness = 1.5 }
draw Bifurcation { name = "bif"; f = "lf"; box = (0.5, -3.6, 7.5, 2.9); rmin = 2.5; rmax = 4; ymin = 0; ymax = 1; skip = 300; keep = 150; quality = 1; color = #3b82f6; layer = 10 }
new Point { name = "V0"; pos = (3, -3.6); dynamic = false; collision = false; active = false }
new Point { name = "V1"; pos = (3, 2.9); dynamic = false; collision = false; active = false }
new Line { name = "rLine"; pos = (V0, V1); color = #f59e0b; thickness = 2; interact = false; layer = 25 }
new Point { name = "R"; line = "rAxis"; t = 0.4; text = true("r"); pauseOnDrag = false; color = #f59e0b }
draw Text { name = "r1"; pos = (0.5, -4.1); text = "2.5"; size = 0.9 }
draw Text { name = "r2"; pos = (2.83, -4.1); text = "3"; size = 0.9 }
draw Text { name = "r3"; pos = (7.5, -4.1); text = "4"; size = 0.9 }
draw Text { name = "lr"; pos = (4, 3.4); text = "предельные значения xₙ при данном r"; size = 1.1 }

// ---- Логика ----
float r = 3.1;
float x0 = 0.2;
float lastKey = -1;
float period = 0;
string cyc = "";
string info = "";

Function lf(rr, x) { return rr * x * (1 - x); }
Function mx(x) { return -7.5 + 6.5 * x; }
Function my(y) { return -3.6 + 6.5 * y; }
Function nk(k) { return "c" + format(k, 0); }

Update {
  r = 2.5 + 1.5 * R.t;
  x0 = X.t;
  V0.pos.x = 0.5 + 7 * R.t; V1.pos.x = V0.pos.x;
  if (r * 1000 + x0 != lastKey) {
    // Паутина: (xₖ, xₖ) → (xₖ, xₖ₊₁) → (xₖ₊₁, xₖ₊₁)
    gc = newGraph();
    float x = x0; float k = 0;
    addNode(gc, nk(0), [mx(x), my(0)]);
    repeat (70) {
      float y = lf(r, x);
      k = k + 1; addNode(gc, nk(k), [mx(x), my(y)]); addEdge(gc, nk(k - 1), nk(k));
      k = k + 1; addNode(gc, nk(k), [mx(y), my(y)]); addEdge(gc, nk(k - 1), nk(k));
      x = y;
    }
    // Период предельного цикла: ищем наименьшее p ≤ 64 с x_{n+p} ≈ x_n
    float z = 0.3;
    repeat (3000) { z = lf(r, z); }
    float z0 = z; period = 0;
    repeat (64) { z = lf(r, z); if (period == 0 && abs(z - z0) < 0.000001) { period = i + 1; } }
    cyc = "";
    if (period > 0 && period <= 4) {
      repeat (period) { if (cyc != "") { cyc = cyc + ", "; } cyc = cyc + format(z, 3); z = lf(r, z); }
    }
    lastKey = r * 1000 + x0;
  }

  info = "**Бифуркация** — качественное изменение поведения динамической системы при плавном изменении параметра. Для логистического отображения xₙ₊₁ = r·xₙ(1 − xₙ): при r < 3 все траектории сходятся к одной неподвижной точке, при r = 3 она теряет устойчивость и рождается цикл периода 2, при r ≈ 3,449 — периода 4, и так далее (удвоение периода). Около r ≈ 3,5699 удвоения накапливаются и начинается хаос; внутри него есть «окна» порядка, например цикл периода 3 при r ≈ 3,83.\n\nr = " + format(r, 3) + ": ";
  if (period == 1) { info = info + "траектория сходится к неподвижной точке x* = " + cyc + "."; }
  if (period > 1 && period <= 4) { info = info + "устойчивый цикл периода " + format(period, 0) + ": " + cyc + "."; }
  if (period > 4) { info = info + "устойчивый цикл периода " + format(period, 0) + "."; }
  if (period == 0) { info = info + "цикла нет — хаотическое поведение: траектория не повторяется и чувствительна к x₀."; }
}
]
