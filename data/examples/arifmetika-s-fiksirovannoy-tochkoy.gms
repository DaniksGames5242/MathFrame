[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Числовая прямая ячейки формата «n разрядов, из них f дробных» (дополнительный код): точки — все
// представимые числа k · 2⁻ᶠ, их шаг постоянен. Оранжевые отрезки — за границами диапазона (переполнение).
// Точка x перетаскивается; зелёная — ближайшее представимое число (в ячейке). ----
new Point { name = "L"; pos = (-7.5, 2.5); dynamic = false; collision = false; active = false }
new Point { name = "R"; pos = (7.5, 2.5); dynamic = false; collision = false; active = false }
new Line { name = "ax"; pos = (L, R); thickness = 1.5; interact = false }
draw Graph { name = "gOv"; graph = "gov"; edgeWidth = 6; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gD"; graph = "gd"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "Y"; pos = (0, 2.5); dynamic = false; collision = false; collideWithPoints = false; size = 0.7; color = #22c55e; layer = 40; active = ov < 0.5 }
new Point { name = "Yo"; pos = (0, 2.5); dynamic = false; collision = false; collideWithPoints = false; size = 0.7; color = #f59e0b; layer = 40; active = ov > 0.5 }
new Point { name = "X"; line = "ax"; t = 0.62; pauseOnDrag = false; collideWithPoints = false; layer = 50 }
draw Text { name = "tx"; pos = (X.pos.x, 3.3); text = "x"; size = 1 }
draw Text { name = "tmin"; pos = (-6, 1.8); text = num(-Rr); size = 0.85; color = #3b82f6 }
draw Text { name = "tmax"; pos = (6, 1.8); text = num(Rr - st); size = 0.85; color = #3b82f6 }
draw Text { name = "tz"; pos = (0, 1.8); text = "0"; size = 0.85; color = #3b82f6 }
draw Text { name = "bits"; pos = (0, -1); text = bitsTxt; size = 2.4 }
draw Text { name = "bl"; pos = (0, -2.3); text = "код ячейки (двоичная точка — после " + format(n - f, 0) + "-го разряда)"; size = 0.85; color = #3b82f6 }

new UI { name = "sN"; type = slider; label = "разрядов n"; variable = n; min = 3; max = 6; step = 1; default = 6 }
new UI { name = "sF"; type = slider; label = "дробных f"; variable = f; min = 0; max = n - 1; step = 1; default = 2 }

// ---- Логика ----
float n = 6; float f = 2; float key = -1; float ov = 0; float Rr = 8; float st = 0.25;
string bitsTxt = ""; string info = "";

Function md(v, m) { return v - floor(v / m) * m; }
Function nd(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function num(v) { return nd(v, max(1, f)); }
Function sup(k) {
  string s = ""; if (k < 0) { s = "⁻"; } float a = round(abs(k));
  if (a == 0) { return s + "⁰"; } if (a == 1) { return s + "¹"; } if (a == 2) { return s + "²"; } if (a == 3) { return s + "³"; }
  if (a == 4) { return s + "⁴"; } return s + "⁵";
}
Function bitsOf(c) {
  string s = "";
  repeat (n) {
    float k = n - 1 - i;
    if (i == n - f && f > 0) { s = s + "."; }
    s = s + format(floor(c / pow(2, k)) - 2 * floor(c / pow(2, k + 1)), 0);
  }
  return s;
}
Function sx(v) { return 6 * v / Rr; }

Update {
  if (f > n - 1) { f = n - 1; }
  st = pow(2, -f); Rr = pow(2, n - f - 1);
  if (key != n * 10 + f) {
    key = n * 10 + f;
    gd = newGraph(); gov = newGraph();
    repeat (pow(2, n)) { addNode(gd, "k" + format(i, 0), [sx((i - pow(2, n - 1)) * st), 2.5]); }
    addNode(gov, "a", [-7.5, 2.5]); addNode(gov, "b", [sx(-Rr - st / 2), 2.5]); addEdge(gov, "a", "b", 1, "#f59e0b");
    addNode(gov, "c", [sx(Rr - st / 2), 2.5]); addNode(gov, "d", [7.5, 2.5]); addEdge(gov, "c", "d", 1, "#f59e0b");
  }
  float v = (X.t - 0.5) * 2.5 * Rr;
  float k = round(v / st); float kk = md(k + pow(2, n - 1), pow(2, n)) - pow(2, n - 1);
  ov = 0; if (kk != k) { ov = 1; }
  float sv = kk * st;
  if (Y.pos.x != sx(sv)) { Y.pos.x = sx(sv); Y.pos.y = 2.5; Yo.pos.x = sx(sv); Yo.pos.y = 2.5; }
  bitsTxt = bitsOf(md(kk, pow(2, n)));
  info = "**Арифметика с фиксированной точкой:** из n = " + format(n, 0) + " разрядов f = " + format(f, 0) + " дробные, двоичная точка стоит на одном и том же месте у всех чисел. Поэтому **шаг постоянен на всём диапазоне** и равен 2" + sup(-f) + " = " + format(st, 4) + ", а диапазон — от " + num(-Rr) + " до 2" + sup(n - f - 1) + " − 2" + sup(-f) + " = " + num(Rr - st) + ".\n\n";
  if (ov > 0.5) { info = info + "**x = " + nd(v, 3) + "** вне диапазона — **переполнение**: старшие разряды отброшены, в ячейке " + num(sv) + ". Переход резкий: шаг у границы тот же, но значение сразу становится противоположным по знаку."; }
  else { info = info + "**x = " + nd(v, 3) + "** → ближайшее представимое fl(x) = " + bitsTxt + "₂ = **" + num(sv) + "**. Абсолютная погрешность " + nd(abs(v - sv), 3) + " ≤ шаг/2 = " + num(st / 2) + " — одна и та же граница в любой точке диапазона."; }
  info = info + "\n\nПроизведение двух чисел с f дробными разрядами имеет 2f дробных, поэтому после умножения результат округляют обратно до f разрядов.";
}
]
