[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// Синяя кривая — плотность λe^(−λx). Синие столбики — «хвост» x > s. Жёлтая кривая — плотность
// остаточного времени X − s при условии X > s: f(x)/P(X > s). Ось x: 1 единица = 2.4 поля.
float lam = 1; float tt = 1; float sx = 2.4; float y0 = -4.5; float ky = 3;
float key = -99; float sv = 1;
string info = "";

func dens(x) = y0 + ky * lam * exp(-lam * (x + 10) / sx);
draw Function { name = "gd"; f = "dens"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gC"; graph = "gc"; nodeRadius = 0; edgeWidth = 3; labels = false; interactive = false; showWeights = false; layer = 35 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "A"; pos = (-7.6, -4.5); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
draw Text { name = "tS"; pos = (A.pos.x, y0 - 0.65); text = "s"; size = 0.95; color = #3b82f6 }
draw Text { name = "tT"; pos = (-10 + sx * tt, y0 - 1.25); text = "t"; size = 0.85; color = #22c55e }
draw Text { name = "tST"; pos = (A.pos.x + sx * tt, y0 - 1.25); text = "s + t"; size = 0.85; color = #f59e0b }
draw Text { name = "x0"; pos = (-9.6, y0 - 0.3); text = "0"; size = 0.7 }
draw Text { name = "x2"; pos = (-10 + 2 * sx, y0 - 0.3); text = "2"; size = 0.7 }
draw Text { name = "x4"; pos = (-10 + 4 * sx, y0 - 0.3); text = "4"; size = 0.7 }
draw Text { name = "x6"; pos = (-10 + 6 * sx, y0 - 0.3); text = "6"; size = 0.7 }
draw Text { name = "x8"; pos = (-10 + 8 * sx, y0 - 0.3); text = "8"; size = 0.7 }

new UI { type = slider; label = "λ (интенсивность)"; variable = lam; min = 0.3; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "t"; variable = tt; min = 0.2; max = 3; step = 0.1; default = 1 }

Update {
  if (abs(A.pos.y - y0) > 0.0001) { A.pos.y = y0; }
  if (A.pos.x < -9.4) { A.pos.x = -9.4; }
  if (A.pos.x > 4.4) { A.pos.x = 4.4; }
  sv = (A.pos.x + 10) / sx;
  if (key != A.pos.x * 100 + lam) {
    gb = newGraph(); gc = newGraph(); ga = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (9) { float tx = -10 + sx * i; addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0)); }
    repeat (200) {
      float x = -9.95 + 0.1 * i; string id = format(i, 0);
      if (x > A.pos.x) {
        addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, y0 + ky * lam * exp(-lam * (x + 10) / sx)]); addEdge(gb, "a" + id, "b" + id, 1, "#3b82f6");
      }
    }
    // f(x) / P(X > s) при x ≥ s
    repeat (60) {
      float x = A.pos.x + (10 - A.pos.x) * i / 59; string id = format(i, 0);
      addNode(gc, "c" + id, [x, y0 + ky * lam * exp(-lam * (x + 10) / sx) / exp(-lam * sv)]);
      if (i > 0) { addEdge(gc, "c" + format(i - 1, 0), "c" + id, 1, "#f59e0b"); }
    }
    key = A.pos.x * 100 + lam;
  }
  float pc = exp(-lam * (sv + tt)) / exp(-lam * sv); float pt = exp(-lam * tt);
  info = "**Показательное распределение** с интенсивностью λ = **" + format(lam, 1) + "**: плотность λe^(−λx) при x ≥ 0, P(X > x) = e^(−λx), среднее 1/λ = **" + format(1 / lam, 2) + "**, дисперсия 1/λ² = **" + format(1 / (lam * lam), 2) + "**.\n\n";
  info = info + "**Отсутствие последействия.** При s = **" + format(sv, 2) + "**, t = **" + format(tt, 1) + "**: P(X > s + t | X > s) = P(X > s + t)/P(X > s) = **" + format(pc, 4) + "**, а P(X > t) = **" + format(pt, 4) + "** — то же самое. Жёлтая плотность остатка X − s (после того как s уже прожито) совпадает с исходной синей, только начинается в точке s.\n\n";
  info = info + "**Интенсивность отказа** f(x)/P(X > x) = λ = **" + format(lam, 1) + "** в любой точке: вероятность отказа в ближайший момент не зависит от возраста.";
}
]
