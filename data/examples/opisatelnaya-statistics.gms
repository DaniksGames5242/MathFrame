[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// Выборка из 10 значений — точки на оси (0…10). Числовые характеристики (среднее, медиана, квартили,
// размах, σ) и графические (гистограмма, ящик с усами) описывают один и тот же массив.
float k = 5; float ya = -3.5; string info = "";
draw Graph { name = "gH"; graph = "gh"; nodeRadius = 0; edgeWidth = 3; labels = false; interactive = false; showWeights = false; color = #3b82f6; edgeColor = #3b82f6 }
draw Graph { name = "gBx"; graph = "gbx"; nodeRadius = 0; edgeWidth = 3; labels = false; interactive = false; showWeights = false; edgeColor = #22c55e }
draw Graph { name = "gAx"; graph = "gx"; nodeRadius = 0; edgeWidth = 1; labels = false; interactive = false; showWeights = false; edgeColor = #3b82f688 }
draw Graph { name = "gMn"; graph = "gmn"; nodeRadius = 0; edgeWidth = 3; labels = false; interactive = false; showWeights = false; edgeColor = #f59e0b }
new Point { name = "P1"; pos = (-6.84, -3.5); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P2"; pos = (-4.50, -3.5); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P3"; pos = (-3.78, -3.5); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P4"; pos = (-2.88, -3.5); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P5"; pos = (-2.16, -3.5); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P6"; pos = (-1.26, -3.5); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P7"; pos = (0.18, -3.5); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P8"; pos = (1.80, -3.5); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P9"; pos = (4.32, -3.5); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P10"; pos = (7.74, -3.5); pauseOnDrag = false; collideWithPoints = false }
draw Text { name = "t0"; pos = (-9.0, -4.2); text = "0"; size = 0.9 }
draw Text { name = "t1"; pos = (-7.2, -4.2); text = "1"; size = 0.9 }
draw Text { name = "t2"; pos = (-5.4, -4.2); text = "2"; size = 0.9 }
draw Text { name = "t3"; pos = (-3.6, -4.2); text = "3"; size = 0.9 }
draw Text { name = "t4"; pos = (-1.8, -4.2); text = "4"; size = 0.9 }
draw Text { name = "t5"; pos = (0.0, -4.2); text = "5"; size = 0.9 }
draw Text { name = "t6"; pos = (1.8, -4.2); text = "6"; size = 0.9 }
draw Text { name = "t7"; pos = (3.6, -4.2); text = "7"; size = 0.9 }
draw Text { name = "t8"; pos = (5.4, -4.2); text = "8"; size = 0.9 }
draw Text { name = "t9"; pos = (7.2, -4.2); text = "9"; size = 0.9 }
draw Text { name = "t10"; pos = (9.0, -4.2); text = "10"; size = 0.9 }
new UI { type = slider; label = "интервалов гистограммы"; variable = k; min = 3; max = 10; step = 1; default = 5 }
Function xv(v) { return 1.8 * v - 9; }
Function box(g, id, a, b, y) {
  addNode(g, id + "1", [xv(a), y]); addNode(g, id + "2", [xv(b), y]); addEdge(g, id + "1", id + "2");
}
Update {
  list vs = [min(10, max(0, (P1.pos.x + 9) / 1.8))];
  push(vs, min(10, max(0, (P2.pos.x + 9) / 1.8)));
  push(vs, min(10, max(0, (P3.pos.x + 9) / 1.8)));
  push(vs, min(10, max(0, (P4.pos.x + 9) / 1.8)));
  push(vs, min(10, max(0, (P5.pos.x + 9) / 1.8)));
  push(vs, min(10, max(0, (P6.pos.x + 9) / 1.8)));
  push(vs, min(10, max(0, (P7.pos.x + 9) / 1.8)));
  push(vs, min(10, max(0, (P8.pos.x + 9) / 1.8)));
  push(vs, min(10, max(0, (P9.pos.x + 9) / 1.8)));
  push(vs, min(10, max(0, (P10.pos.x + 9) / 1.8)));
  if (abs(P1.pos.y - ya) > 0.0001) { P1.pos.y = ya; }
  if (abs(P2.pos.y - ya) > 0.0001) { P2.pos.y = ya; }
  if (abs(P3.pos.y - ya) > 0.0001) { P3.pos.y = ya; }
  if (abs(P4.pos.y - ya) > 0.0001) { P4.pos.y = ya; }
  if (abs(P5.pos.y - ya) > 0.0001) { P5.pos.y = ya; }
  if (abs(P6.pos.y - ya) > 0.0001) { P6.pos.y = ya; }
  if (abs(P7.pos.y - ya) > 0.0001) { P7.pos.y = ya; }
  if (abs(P8.pos.y - ya) > 0.0001) { P8.pos.y = ya; }
  if (abs(P9.pos.y - ya) > 0.0001) { P9.pos.y = ya; }
  if (abs(P10.pos.y - ya) > 0.0001) { P10.pos.y = ya; }
  k = round(k);
  gx = newGraph(); addNode(gx, "a", [-9.6, ya]); addNode(gx, "b", [9.6, ya]); addEdge(gx, "a", "b");
  list ct = [0];
  repeat (k - 1) { push(ct, 0); }
  repeat (10) { float b = min(k - 1, floor(vs[i] / (10 / k))); ct[b] = ct[b] + 1; }
  gh = newGraph(); float y0 = -2.9; float w = 18 / k; float mx = 0;
  addNode(gh, "s", [-9, y0]);
  string prev = "s";
  repeat (k) {
    float j = i; string a = "u" + format(j, 0); string c = "v" + format(j, 0);
    addNode(gh, a, [-9 + w * j, y0 + 0.85 * ct[j]]); addNode(gh, c, [-9 + w * (j + 1), y0 + 0.85 * ct[j]]);
    addEdge(gh, prev, a); addEdge(gh, a, c); prev = c; mx = max(mx, ct[j]);
  }
  addNode(gh, "e", [9, y0]); addEdge(gh, prev, "e");
  float mn = min(vs); float mxv = max(vs); float md = median(vs); float q1 = quantile(vs, 0.25); float q3 = quantile(vs, 0.75);
  float av = mean(vs); float sd = sqrt(variance(vs) * 10 / 9);
  gbx = newGraph(); float yb = -5.2;
  box(gbx, "wa", mn, q1, yb); box(gbx, "wb", q3, mxv, yb);
  addNode(gbx, "b1", [xv(q1), yb - 0.4]); addNode(gbx, "b2", [xv(q3), yb - 0.4]); addNode(gbx, "b3", [xv(q3), yb + 0.4]); addNode(gbx, "b4", [xv(q1), yb + 0.4]);
  addEdge(gbx, "b1", "b2"); addEdge(gbx, "b2", "b3"); addEdge(gbx, "b3", "b4"); addEdge(gbx, "b4", "b1");
  addNode(gbx, "m1", [xv(md), yb - 0.4]); addNode(gbx, "m2", [xv(md), yb + 0.4]); addEdge(gbx, "m1", "m2");
  addNode(gbx, "n1", [xv(mn), yb - 0.25]); addNode(gbx, "n2", [xv(mn), yb + 0.25]); addEdge(gbx, "n1", "n2");
  addNode(gbx, "x1", [xv(mxv), yb - 0.25]); addNode(gbx, "x2", [xv(mxv), yb + 0.25]); addEdge(gbx, "x1", "x2");
  gmn = newGraph(); addNode(gmn, "a", [xv(av), ya - 0.35]); addNode(gmn, "b", [xv(av), ya + 0.35]); addEdge(gmn, "a", "b");
  info = "**Описательная статистика** сжимает массив из 10 наблюдений до нескольких чисел и картинок, не выходя за рамки самих данных. Числовые характеристики: минимум **" + format(mn, 2) + "**, максимум **" + format(mxv, 2) + "**, размах **" + format(mxv - mn, 2) + "**, среднее **" + format(av, 2) + "** (жёлтая отметка), медиана **" + format(md, 2) + "**, квартили Q₁ = **" + format(q1, 2) + "**, Q₃ = **" + format(q3, 2) + "**, выборочное стандартное отклонение s = **" + format(sd, 2) + "**.\n\n";
  info = info + "Графические: гистограмма из " + format(k, 0) + " интервалов (синяя) и ящик с усами (зелёный: усы — от минимума до максимума, ящик — от Q₁ до Q₃, черта — медиана). Наибольшая частота интервала — " + format(mx, 0) + ". Форма гистограммы зависит от числа интервалов, а числа — нет: характеристики дополняют друг друга.";
}
]