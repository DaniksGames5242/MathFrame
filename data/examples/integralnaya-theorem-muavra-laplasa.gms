[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// Столбики — биномиальные вероятности P(Sₙ = k) в нормированных координатах z = (k − np)/√(npq);
// кривая — плотность стандартного нормального закона. Границы a и b тянутся по оси.
float n = 40; float p = 0.5; float sx = 1.5; float ky = 20; float y0 = -4.5;
float key = -1; float pa = -1.5; float pb = 1.5; float ex = 0; float ap = 0;
string info = "";

func dens(x) = y0 + ky * exp(-(x / sx) * (x / sx) / 2) / sqrt(2 * pi);
draw Function { name = "gauss"; f = "dens"; xmin = -10; xmax = 10; thickness = 3; color = #f59e0b }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 26; edgeCap = butt; labels = false; interactive = false; showWeights = false; active = n <= 25 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 12; edgeCap = butt; labels = false; interactive = false; showWeights = false; active = n > 25 && n <= 70 }
draw Graph { name = "gC"; graph = "gc"; nodeRadius = 0; edgeWidth = 5; edgeCap = butt; labels = false; interactive = false; showWeights = false; active = n > 70 }
draw Graph { name = "gX"; graph = "gx"; nodeRadius = 0; edgeWidth = 1; labels = false; interactive = false; showWeights = false; edgeColor = #3b82f688 }
new Point { name = "A"; pos = (-2.25, -4.5); pauseOnDrag = false; collideWithPoints = false; color = #22c55e }
new Point { name = "B"; pos = (2.25, -4.5); pauseOnDrag = false; collideWithPoints = false; color = #22c55e }
draw Text { name = "ta"; pos = (A.pos.x, -5.35); text = "a"; size = 1 }
draw Text { name = "tb"; pos = (B.pos.x, -5.35); text = "b"; size = 1 }
new UI { type = slider; label = "n (испытаний)"; variable = n; min = 10; max = 200; step = 1; default = 40 }
new UI { type = slider; label = "p (вероятность успеха)"; variable = p; min = 0.1; max = 0.9; step = 0.05; default = 0.5 }

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(A.pos.y - y0) > 0.0001) { A.pos.y = y0; }
  if (abs(B.pos.y - y0) > 0.0001) { B.pos.y = y0; }
  if (A.pos.x > B.pos.x - 0.6) {
    if (abs(A.pos.x - pa) > abs(B.pos.x - pb)) { A.pos.x = B.pos.x - 0.6; } else { B.pos.x = A.pos.x + 0.6; }
  }
  pa = A.pos.x; pb = B.pos.x;
  float za = A.pos.x / sx; float zb = B.pos.x / sx;
  float q = 1 - p; float sg = sqrt(n * p * q);
  if (key != n * 1000 + p * 100 + round(A.pos.x * 40) * 0.001 + round(B.pos.x * 40) * 0.000001) {
    ga = newGraph(); gb = newGraph(); gc = newGraph(); gx = newGraph();
    addNode(gx, "l1", [-10, y0]); addNode(gx, "l2", [10, y0]); addEdge(gx, "l1", "l2");
    ex = 0;
    repeat (n + 1) {
      float k = i; float z = (k - n * p) / sg; float x = sx * z;
      float pk = binomialPmf(k, n, p);
      string col = "#3b82f6";
      if (z >= za && z <= zb) { col = "#22c55e"; ex = ex + pk; }
      if (abs(x) < 9.7) {
        string id = "k" + format(k, 0);
        float h = ky * sg * pk;
        if (n <= 25) { addNode(ga, "a" + id, [x, y0]); addNode(ga, "b" + id, [x, y0 + h]); addEdge(ga, "a" + id, "b" + id, 1, col); }
        if (n > 25 && n <= 70) { addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, y0 + h]); addEdge(gb, "a" + id, "b" + id, 1, col); }
        if (n > 70) { addNode(gc, "a" + id, [x, y0]); addNode(gc, "b" + id, [x, y0 + h]); addEdge(gc, "a" + id, "b" + id, 1, col); }
      }
    }
    ap = 0.5 * (erf(zb / sqrt(2)) - erf(za / sqrt(2)));
    key = n * 1000 + p * 100 + round(A.pos.x * 40) * 0.001 + round(B.pos.x * 40) * 0.000001;
  }
  info = "**Интегральная теорема Муавра — Лапласа.** Для схемы Бернулли (n = **" + format(n, 0) + "**, p = **" + format(p, 2) + "**) число успехов Sₙ имеет среднее np = " + format(n * p, 2) + " и σ = √(npq) = " + format(sg, 3) + ". При n → ∞ вероятность P(a ≤ (Sₙ − np)/σ ≤ b) стремится к Φ(b) − Φ(a) = ∫ от a до b от (1/√(2π))·e^(−x²/2) dx.\n\n";
  info = info + "Границы: a = **" + num(za, 2) + "**, b = **" + num(zb, 2) + "**. Точная вероятность (зелёные столбики) P = **" + format(ex, 4) + "**, приближение Φ(b) − Φ(a) = **" + format(ap, 4) + "**, разность " + format(abs(ex - ap), 4) + ". При n → ∞ она стремится к нулю.";
}
]
