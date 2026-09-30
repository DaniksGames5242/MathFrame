[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Восемь наблюдений (xᵢ, yᵢ). Корреляция симметрична по X и Y (одно число r); регрессия — нет: оранжевая прямая — регрессия Y на X
// (минимум вертикальных отклонений), зелёная — регрессия X на Y (минимум горизонтальных). Режим «Y = X²» — функциональная связь при r ≈ 0. ----
new Point { name = "P1"; pos = (-5.5, -2.2); pauseOnDrag = false }
new Point { name = "P2"; pos = (-4.2, -0.2); pauseOnDrag = false }
new Point { name = "P3"; pos = (-2.6, -1.6); pauseOnDrag = false }
new Point { name = "P4"; pos = (-0.9, 0.8); pauseOnDrag = false }
new Point { name = "P5"; pos = (0.7, -0.4); pauseOnDrag = false }
new Point { name = "P6"; pos = (2.4, 2.0); pauseOnDrag = false }
new Point { name = "P7"; pos = (4.1, 0.6); pauseOnDrag = false }
new Point { name = "P8"; pos = (5.8, 3.0); pauseOnDrag = false }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gB"; graph = "gb"; edgeColor = #22c55e; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
new UI { name = "sM"; type = select; label = "данные"; variable = md; options = ("free", "sq"); labels = ("свободные", "Y = 0,14·X² − 2,2"); default = "free" }

// ---- Логика ----
string md = "free"; float key = -1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function px(k) { if (k == 0) { return P1.pos.x; } if (k == 1) { return P2.pos.x; } if (k == 2) { return P3.pos.x; } if (k == 3) { return P4.pos.x; } if (k == 4) { return P5.pos.x; } if (k == 5) { return P6.pos.x; } if (k == 6) { return P7.pos.x; } if (k == 7) { return P8.pos.x; } return 0; }
Function py(k) { if (k == 0) { return P1.pos.y; } if (k == 1) { return P2.pos.y; } if (k == 2) { return P3.pos.y; } if (k == 3) { return P4.pos.y; } if (k == 4) { return P5.pos.y; } if (k == 5) { return P6.pos.y; } if (k == 6) { return P7.pos.y; } if (k == 7) { return P8.pos.y; } return 0; }
Function clip(g, nm, x0, y0, dx, dy) {
  float t1 = -1000; float t2 = 1000;
  if (abs(dx) > 0.000001) { float a = (-fieldMaxX - x0) / dx; float b = (fieldMaxX - x0) / dx; t1 = max(t1, min(a, b)); t2 = min(t2, max(a, b)); }
  if (abs(dy) > 0.000001) { float c = (-fieldMaxY - y0) / dy; float d = (fieldMaxY - y0) / dy; t1 = max(t1, min(c, d)); t2 = min(t2, max(c, d)); }
  addNode(g, nm + "1", [x0 + t1 * dx, y0 + t1 * dy]); addNode(g, nm + "2", [x0 + t2 * dx, y0 + t2 * dy]); addEdge(g, nm + "1", nm + "2");
  return 0;
}
Function par(x) { return 0.14 * x * x - 2.2; }

Update {
  if (md == "sq") {
    if (abs(P1.pos.y - par(P1.pos.x)) > 0.0001) { P1.pos.y = par(P1.pos.x); }
    if (abs(P2.pos.y - par(P2.pos.x)) > 0.0001) { P2.pos.y = par(P2.pos.x); }
    if (abs(P3.pos.y - par(P3.pos.x)) > 0.0001) { P3.pos.y = par(P3.pos.x); }
    if (abs(P4.pos.y - par(P4.pos.x)) > 0.0001) { P4.pos.y = par(P4.pos.x); }
    if (abs(P5.pos.y - par(P5.pos.x)) > 0.0001) { P5.pos.y = par(P5.pos.x); }
    if (abs(P6.pos.y - par(P6.pos.x)) > 0.0001) { P6.pos.y = par(P6.pos.x); }
    if (abs(P7.pos.y - par(P7.pos.x)) > 0.0001) { P7.pos.y = par(P7.pos.x); }
    if (abs(P8.pos.y - par(P8.pos.x)) > 0.0001) { P8.pos.y = par(P8.pos.x); }
  }
  float k2 = 0; if (md == "sq") { k2 = 1; } repeat (8) { k2 = k2 * 1.0137 + px(i) * (i + 3) + py(i) * (i + 7.3); }
  if (k2 != key) {
    key = k2;
    float mx = 0; float my = 0; repeat (8) { mx = mx + px(i) / 8; my = my + py(i) / 8; }
    float sxy = 0; float sxx = 0; float syy = 0;
    repeat (8) { sxy = sxy + (px(i) - mx) * (py(i) - my); sxx = sxx + (px(i) - mx) * (px(i) - mx); syy = syy + (py(i) - my) * (py(i) - my); }
    float r = 0; if (sxx * syy > 0.000001) { r = sxy / sqrt(sxx * syy); }
    float byx = 0; if (sxx > 0.000001) { byx = sxy / sxx; }
    float bxy = 0; if (syy > 0.000001) { bxy = sxy / syy; }
    ga = newGraph(); gb = newGraph();
    float u = clip(ga, "a", mx, my, 1, byx); float w = clip(gb, "b", mx, my, bxy, 1);
    info = "**Корреляция** измеряет тесноту и направление связи одним числом, не деля переменные на зависимую и независимую: r = Cov(X, Y)/(sₓ·sᵧ) = " + num(r, 3) + ".\n\n";
    info = info + "**Регрессия** выделяет объясняемую переменную. Оранжевая прямая — Y на X с угловым коэффициентом β̂₁ = b = " + num(byx, 3) + ", зелёная — X на Y (коэффициент b′ = " + num(bxy, 3) + " при y); это две разные прямые, они сливаются лишь при |r| = 1. ";
    info = info + "Связь: r = sgn(Cov)·√(b·b′) = " + num(sign(sxy) * sqrt(byx * bxy), 3) + ", где b = " + num(byx, 3) + " и b′ = " + num(bxy, 3) + " — угловые коэффициенты регрессий Y на X и X на Y. R² = r² = " + format(r * r, 3) + " — доля вариации Y, объяснённая прямой.";
    if (md == "sq") { info = info + "\n\n**Нелинейная связь:** здесь Y = 0,14·X² − 2,2 — точная функциональная зависимость, но линейная корреляция r = " + num(r, 3) + " близка к нулю, когда значения X расположены симметрично относительно нуля. Корреляционный анализ линейной связи её не обнаруживает."; }
    else { info = info + "\n\n**Корреляция не означает причинности:** r одинаково описывает и «Y зависит от X», и «X зависит от Y»."; }
  }
}
]
