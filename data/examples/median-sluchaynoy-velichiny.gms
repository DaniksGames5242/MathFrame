[
description = "{info}"

field width = 16; field height = 12;
camera type = fixed;

// ---- Дискретная величина X со значениями 1…7. Верхняя панель — вероятности P(X = k): каждый столбик
// тянется за свою точку, остальные вероятности пересчитываются пропорционально (сумма всегда 100 %).
// Нижняя панель — функция распределения F; медиана — где F пересекает уровень ½. ----
new Point { name = "P1"; pos = (-6, 1.1); pauseOnDrag = false }
new Point { name = "P2"; pos = (-4, 1.35); pauseOnDrag = false }
new Point { name = "P3"; pos = (-2, 1.6); pauseOnDrag = false }
new Point { name = "P4"; pos = (0, 1.85); pauseOnDrag = false }
new Point { name = "P5"; pos = (2, 1.35); pauseOnDrag = false }
new Point { name = "P6"; pos = (4, 1.1); pauseOnDrag = false }
new Point { name = "P7"; pos = (6, 0.85); pauseOnDrag = false }
draw Graph { name = "gB"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 38; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; edgeColor = #3b82f6; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gM"; graph = "gm"; edgeColor = #f59e0b; edgeWidth = 4; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "a0"; pos = (-6, 0.2); text = "1"; size = 0.8 }
draw Text { name = "b0"; pos = (-6, -5.75); text = "1"; size = 0.8 }
draw Text { name = "a1"; pos = (-4, 0.2); text = "2"; size = 0.8 }
draw Text { name = "b1"; pos = (-4, -5.75); text = "2"; size = 0.8 }
draw Text { name = "a2"; pos = (-2, 0.2); text = "3"; size = 0.8 }
draw Text { name = "b2"; pos = (-2, -5.75); text = "3"; size = 0.8 }
draw Text { name = "a3"; pos = (0, 0.2); text = "4"; size = 0.8 }
draw Text { name = "b3"; pos = (0, -5.75); text = "4"; size = 0.8 }
draw Text { name = "a4"; pos = (2, 0.2); text = "5"; size = 0.8 }
draw Text { name = "b4"; pos = (2, -5.75); text = "5"; size = 0.8 }
draw Text { name = "a5"; pos = (4, 0.2); text = "6"; size = 0.8 }
draw Text { name = "b5"; pos = (4, -5.75); text = "6"; size = 0.8 }
draw Text { name = "a6"; pos = (6, 0.2); text = "7"; size = 0.8 }
draw Text { name = "b6"; pos = (6, -5.75); text = "7"; size = 0.8 }
draw Text { name = "h1"; pos = (-7.6, 5.75); text = "P(X = k)"; size = 0.85; align = left }
draw Text { name = "h2"; pos = (-7.6, -0.4); text = "F(x) = P(X ≤ x)"; size = 0.85; align = left }
draw Text { name = "h3"; pos = (7.6, -3.1); text = "½"; size = 0.85; align = right }

// ---- Логика ----
list m = (10, 15, 20, 25, 15, 10, 5); list o = (0, 0, 0, 0, 0, 0, 0);
float key = -1; string info = "";
Function yb(v) { return 0.6 + 5 * v / 100; }
Function xv(k) { return -6 + 2 * k; }
Function fy(f) { return -5.4 + 4.6 * f / 100; }
Function py(k) { if (k == 0) { return P1.pos.y; } if (k == 1) { return P2.pos.y; } if (k == 2) { return P3.pos.y; } if (k == 3) { return P4.pos.y; } if (k == 4) { return P5.pos.y; } if (k == 5) { return P6.pos.y; } if (k == 6) { return P7.pos.y; } return 0; }
Function px(k) { if (k == 0) { return P1.pos.x; } if (k == 1) { return P2.pos.x; } if (k == 2) { return P3.pos.x; } if (k == 3) { return P4.pos.x; } if (k == 4) { return P5.pos.x; } if (k == 5) { return P6.pos.x; } if (k == 6) { return P7.pos.x; } return 0; }
Function sety(k, v) { if (k == 0) { P1.pos.y = v; } if (k == 1) { P2.pos.y = v; } if (k == 2) { P3.pos.y = v; } if (k == 3) { P4.pos.y = v; } if (k == 4) { P5.pos.y = v; } if (k == 5) { P6.pos.y = v; } if (k == 6) { P7.pos.y = v; } return 0; }
Function setx(k, v) { if (k == 0) { P1.pos.x = v; } if (k == 1) { P2.pos.x = v; } if (k == 2) { P3.pos.x = v; } if (k == 3) { P4.pos.x = v; } if (k == 4) { P5.pos.x = v; } if (k == 5) { P6.pos.x = v; } if (k == 6) { P7.pos.x = v; } return 0; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function bar(g, k, h, c) { addNode(g, "a" + k, [xv(k), 0.6]); addNode(g, "b" + k, [xv(k), 0.6 + h]); addEdge(g, "a" + k, "b" + k, 1, c); return 0; }

Update {
  // какая точка сдвинута (по наибольшему смещению) — её вероятность становится новой, остальные масштабируются
  float dk = -1; float dd = 0.005;
  repeat (7) { float d = abs(py(i) - yb(m[i])); if (d > dd) { dd = d; dk = i; } }
  if (dk >= 0) {
    float nv = round(100 * (py(dk) - 0.6) / 5); nv = max(0, min(100, nv));
    if (nv != m[dk]) {
      float R = 100 - nv; float S = 0; float big = -1; float bv = -1;
      repeat (7) { o[i] = m[i]; if (i != dk) { S = S + m[i]; if (m[i] > bv) { bv = m[i]; big = i; } } }
      float used = 0;
      repeat (7) { if (i != dk) { if (S > 0) { m[i] = floor(R * o[i] / S); } else { m[i] = floor(R / 6); } used = used + m[i]; } }
      m[big] = m[big] + R - used; m[dk] = nv;
    }
  }
  repeat (7) { if (abs(py(i) - yb(m[i])) > 0.0005) { sety(i, yb(m[i])); } if (abs(px(i) - xv(i)) > 0.0005) { setx(i, xv(i)); } }
  float k2 = 0; repeat (7) { k2 = k2 * 101 + m[i]; }
  if (k2 != key) {
    key = k2;
    // медиана: lo — первое k с F ≥ ½, hi — первое k с F > ½ (между ними F = ½ — медианой служит весь отрезок)
    float f = 0; float lo = -1; float hi = -1; float fl = 0; float fp = 0; float ex = 0;
    repeat (7) { fp = f; f = f + m[i]; ex = ex + (i + 1) * m[i] / 100; if (f >= 50 && lo < 0) { lo = i; fl = f; } if (f > 50 && hi < 0) { hi = i; } }
    float pl = 0; repeat (7) { if (i < lo) { pl = pl + m[i]; } }
    gb = newGraph(); gc = newGraph(); gm = newGraph(); ga = newGraph();
    repeat (7) { if (m[i] > 0) { string c = "#3b82f6"; if (i == lo || i == hi) { c = "#f59e0b"; } bar(gb, i, 5 * m[i] / 100, c); } }
    // ступенчатая функция распределения
    addNode(gc, "n0", [-7.5, fy(0)]); float cnt = 0; f = 0; float py0 = fy(0);
    repeat (7) {
      float c1 = cnt; addNode(gc, "n" + format(c1 + 1, 0), [xv(i), py0]); addEdge(gc, "n" + format(c1, 0), "n" + format(c1 + 1, 0));
      f = f + m[i]; addNode(gc, "n" + format(c1 + 2, 0), [xv(i), fy(f)]); addEdge(gc, "n" + format(c1 + 1, 0), "n" + format(c1 + 2, 0));
      py0 = fy(f); cnt = c1 + 2;
    }
    addNode(gc, "n" + format(cnt + 1, 0), [7.5, fy(100)]); addEdge(gc, "n" + format(cnt, 0), "n" + format(cnt + 1, 0));
    // отметка медианы на уровне ½
    addNode(gm, "m1", [xv(lo), -5.4]); addNode(gm, "m2", [xv(lo), fy(50)]); addEdge(gm, "m1", "m2");
    if (hi > lo) { addNode(gm, "m3", [xv(hi), -5.4]); addNode(gm, "m4", [xv(hi), fy(50)]); addEdge(gm, "m3", "m4"); addEdge(gm, "m2", "m4"); }
    addNode(ga, "g1", [-7.5, 0.6]); addNode(ga, "g2", [7.5, 0.6]); addEdge(ga, "g1", "g2");
    addNode(ga, "g3", [-7.5, -5.4]); addNode(ga, "g4", [7.5, -5.4]); addEdge(ga, "g3", "g4");
    addNode(ga, "g5", [-7.5, fy(50)]); addNode(ga, "g6", [7.5, fy(50)]); addEdge(ga, "g5", "g6");
    addNode(ga, "g7", [-7.5, fy(100)]); addNode(ga, "g8", [7.5, fy(100)]); addEdge(ga, "g7", "g8");
    // среднее абсолютное отклонение от медианы и от среднего
    float d1 = 0; float d2 = 0; repeat (7) { d1 = d1 + abs(i - lo) * m[i] / 100; d2 = d2 + abs(i + 1 - ex) * m[i] / 100; }
    info = "**Медиана** — число m, для которого P(X ≤ m) ≥ ½ и P(X ≥ m) ≥ ½: вероятностная масса делится пополам.\n\n";
    if (hi > lo) { info = info + "**Здесь медиана неединственна:** F(x) = ½ на всём отрезке между x = " + format(lo + 1, 0) + " и x = " + format(hi + 1, 0) + " (P(X ≤ " + format(lo + 1, 0) + ") = ½), поэтому медианой служит любая точка отрезка [" + format(lo + 1, 0) + "; " + format(hi + 1, 0) + "].\n\n"; }
    else { info = info + "**Здесь m = " + format(lo + 1, 0) + ":** P(X ≤ " + format(lo + 1, 0) + ") = " + format(fl / 100, 2) + " ≥ ½ и P(X ≥ " + format(lo + 1, 0) + ") = " + format(1 - pl / 100, 2) + " ≥ ½.\n\n"; }
    info = info + "Среднее E X = " + format(ex, 2) + " зависит от величины значений в «хвосте», а медиана — лишь от того, по какую сторону они лежат. Среднее абсолютное отклонение E|X − c| минимально при c = медиана: " + format(d1, 3) + " (при c = E X оно " + format(d2, 3) + ").";
  }
}
]
