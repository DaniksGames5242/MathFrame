[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Пара (X, Y) равномерна на параллелограмме: сдвиг s = 0 даёт прямоугольник со сторонами вдоль осей.
// Точка P = (a; b) задаёт событие {X < a, Y < b} (оранжевая часть фигуры) — сравниваем его вероятность
// с произведением P(X < a)·P(Y < b). ----
draw Graph { name = "gBl"; graph = "gbl"; edgeColor = #3b82f655; edgeWidth = 9; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gAm"; graph = "gam"; edgeColor = #f59e0b; edgeWidth = 9; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gCr"; graph = "gcr"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "lx"; pos = (9.6, -5.6); text = "X"; size = 0.95 }
draw Text { name = "ly"; pos = (-9.6, 5.6); text = "Y"; size = 0.95; align = left }
new Point { name = "P"; pos = (-1, -1); text = true("P"); pauseOnDrag = false; collision = false; color = #22c55e }

new UI { name = "sS"; type = slider; label = "сдвиг s"; variable = ss; min = -6; max = 6; step = 0.5; default = 3 }

// ---- Логика ----
float ss = 3; float key = -1; string info = "";
float pxy = 0; float pxa = 0; float pyb = 0; float sup = 0;
Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function xl(v) { return -4 + ss * (v - 0.5); }
// доля ряда v, лежащая левее a
Function cl(v, a) { return max(0, min(1, (a - xl(v)) / 8)); }
Function fx(a) { float t = 0; repeat (80) { t = t + cl((i + 0.5) / 80, a) / 80; } return t; }
Function fy(b) { return max(0, min(1, (b + 5) / 8)); }
Function fxy(a, b) {
  float t = 0; float vb = fy(b) * 80;
  repeat (80) { t = t + max(0, min(1, vb - i)) * cl((i + 0.5) / 80, a) / 80; }
  return t;
}

Update {
  if (P.pos.x < -9) { P.pos.x = -9; } if (P.pos.x > 9) { P.pos.x = 9; }
  if (P.pos.y < -5) { P.pos.y = -5; } if (P.pos.y > 3) { P.pos.y = 3; }
  if (key != P.pos.x * 100 + P.pos.y * 7 + ss * 13) {
    gbl = newGraph(); gam = newGraph(); gcr = newGraph();
    float a = P.pos.x; float b = P.pos.y;
    repeat (40) {
      float v = (i + 0.5) / 40; float y = -5 + 8 * v; string s = format(i, 0);
      float l = xl(v); float r = l + 8;
      if (y < b && a > l) {
        float m = min(r, a);
        addNode(gam, "a" + s, [l, y]); addNode(gam, "b" + s, [m, y]); addEdge(gam, "a" + s, "b" + s);
        if (m < r) { addNode(gbl, "c" + s, [m, y]); addNode(gbl, "d" + s, [r, y]); addEdge(gbl, "c" + s, "d" + s); }
      }
      if (y >= b || a <= l) { addNode(gbl, "e" + s, [l, y]); addNode(gbl, "f" + s, [r, y]); addEdge(gbl, "e" + s, "f" + s); }
    }
    addNode(gcr, "a", [a, -5.3]); addNode(gcr, "b", [a, 3.3]); addEdge(gcr, "a", "b");
    addNode(gcr, "c", [-9.4, b]); addNode(gcr, "d", [9.4, b]); addEdge(gcr, "c", "d");
    pxy = fxy(a, b); pxa = fx(a); pyb = fy(b);
    sup = 0;
    repeat (49) {
      float aa = -6 + 2 * floor(i / 7); float bb = -4 + (i - 7 * floor(i / 7));
      sup = max(sup, abs(fxy(aa, bb) - fx(aa) * fy(bb)));
    }
    string eq = "не равны";
    if (abs(pxy - pxa * pyb) < 0.0005) { eq = "равны"; }
    info = "**Независимость** X и Y означает P(X < x, Y < y) = P(X < x)·P(Y < y) для всех x, y (и вообще для любых событий вида {X ∈ A} и {Y ∈ B}): совместное распределение — произведение маргинальных. Здесь пара равномерно распределена на параллелограмме; при s = 0 это прямоугольник, и информация о X не меняет распределение Y.\n\n";
    info = info + "**В точке P = (" + num(a, 1) + "; " + num(b, 1) + "):** P(X < a, Y < b) = " + format(pxy, 3) + " (оранжевая доля фигуры), P(X < a)·P(Y < b) = " + format(pxa, 3) + "·" + format(pyb, 3) + " = " + format(pxa * pyb, 3) + " — " + eq + ".\n\n";
    info = info + "**По всей плоскости:** наибольшее расхождение |F(x, y) − F_X(x)·F_Y(y)| на сетке 7 × 7 равно " + format(sup, 3);
    if (sup < 0.0005) { info = info + " — величины независимы."; }
    if (sup >= 0.0005) { info = info + " — величины зависимы (в отдельных точках равенство может выполняться случайно)."; }
    key = P.pos.x * 100 + P.pos.y * 7 + ss * 13;
  }
}
]
