[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Слева — все ожерелья из p бусин a цветов с точностью до поворота (по одному
// представителю от каждого класса). Справа — класс выбранного ожерелья: все его повороты. ----
draw Graph { name = "gRing"; graph = "gr"; edgeColor = #6b7280; edgeWidth = 1.2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gSel"; graph = "gs"; nodeColor = #6b7280; nodeRadius = 24; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gC0"; graph = "c0"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gC1"; graph = "c1"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gC2"; graph = "c2"; nodeColor = #22c55e; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gB0"; graph = "b0"; nodeColor = #3b82f6; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gB1"; graph = "b1"; nodeColor = #f59e0b; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gB2"; graph = "b2"; nodeColor = #22c55e; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "tl"; pos = (-2.8, 4.5); text = "классы ожерелий (" + format(nOrb, 0) + " + " + format(a, 0) + " одноцветных)"; size = 1 }
draw Text { name = "tr"; pos = (5.2, 4.5); text = "класс выбранного: " + format(orbSize, 0) + " поворот(ов)"; size = 1 }

new UI { name = "sAP"; type = select; label = "a, p"; variable = ap; options = (23, 25, 27, 33, 35); labels = ("a = 2, p = 3", "a = 2, p = 5", "a = 2, p = 7", "a = 3, p = 3", "a = 3, p = 5"); default = 25 }

// ---- Логика ----
float ap = 25; float lastAp = 0;
float a = 2; float p = 5;
float nOrb = 0; float orbSize = 1;
float sel = 1; float lastSel = -1;
float clicks = 0;
float cols = 8; float cell = 1.2;
list reps = (0);
string info = "";

Function md(x, m) { return x - floor(x / m) * m; }
// k-я «цифра» (цвет бусины) ожерелья с номером w в системе по основанию a
Function dig(w, k) { return md(floor(w / a ^ k), a); }
// Поворот ожерелья на одну бусину
Function rot(w) { return floor(w / a) + md(w, a) * a ^ (p - 1); }
Function cx(j) { return -7.6 + cell * (md(j, cols) + 0.5); }
Function cy(j) { return 3.9 - cell * (floor(j / cols) + 0.5); }
// Ожерелье w в центре (x, y) радиуса r: бусины и контур
Function neck(w, x, y, r, big, tag) {
  repeat (p) {
    float t = pi / 2 - 2 * pi * i / p;
    float bx = x + r * cos(t); float by = y + r * sin(t);
    string key = tag + "_" + format(i, 0);
    float c = dig(w, i);
    if (big == 0) { if (c == 0) { addNode(c0, key, [bx, by]); } if (c == 1) { addNode(c1, key, [bx, by]); } if (c == 2) { addNode(c2, key, [bx, by]); } }
    else { if (c == 0) { addNode(b0, key, [bx, by]); } if (c == 1) { addNode(b1, key, [bx, by]); } if (c == 2) { addNode(b2, key, [bx, by]); } }
    addNode(gr, key, [bx, by]);
    if (i > 0) { addEdge(gr, tag + "_" + format(i - 1, 0), key); }
  }
  addEdge(gr, tag + "_" + format(p - 1, 0), tag + "_0");
  return 0;
}

Update {
  a = floor(ap / 10); p = md(ap, 10);
  if (ap != lastAp) {
    // Представитель класса — наименьший номер среди всех поворотов
    reps = [0]; nOrb = 0;
    repeat (a ^ p) {
      float w = i; float m = w; float r = w;
      repeat (p - 1) { r = rot(r); m = min(m, r); }
      if (m == w) { if (nOrb == 0) { reps[0] = w; } else { push(reps, w); } nOrb = nOrb + 1; }
    }
    nOrb = nOrb - a;
    // сетка под число ожерелий: ширина слева 9.6, высота 8.4
    cols = 1; repeat (12) { if (ceil((nOrb + a) / cols) * 9.6 / cols > 8.4) { cols = cols + 1; } }
    cell = min(2.2, 9.6 / cols);
    lastAp = ap; sel = 1; lastSel = -1;
  }
  // Клик по ожерелью слева выбирает его класс
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    float best = 0.6;
    repeat (nOrb + a) { float d = sqrt((mouseClickX - cx(i)) ^ 2 + (mouseClickY - cy(i)) ^ 2); if (d < best) { best = d; sel = i; } }
  }
  if (sel != lastSel) {
    gr = newGraph(); c0 = newGraph(); c1 = newGraph(); c2 = newGraph(); b0 = newGraph(); b1 = newGraph(); b2 = newGraph(); gs = newGraph();
    repeat (nOrb + a) { neck(reps[i], cx(i), cy(i), 0.33 * cell, 0, "s" + format(i, 0)); }
    addNode(gs, "sel", [cx(sel), cy(sel)]);
    // Класс выбранного: повороты, пока не вернёмся к исходному
    float w = reps[sel]; orbSize = 0; float r = w;
    repeat (p) {
      if (i == 0 || r != w) {
        float t = pi / 2 - 2 * pi * i / p;
        neck(r, 5.2 + 1.9 * cos(t), -0.3 + 1.9 * sin(t), 0.6, 1, "o" + format(i, 0));
        orbSize = orbSize + 1;
      }
      r = rot(r); if (r == w) { r = w; }
    }
    lastSel = sel;
  }
  info = "**Малая теорема Ферма:** если p — простое и a не делится на p, то aᵖ⁻¹ ≡ 1 (mod p); равносильно, aᵖ − a делится на p для любого целого a.\n\n**Доказательство ожерельями.** Всего aᵖ способов раскрасить p бусин в a цветов. Раскраски, переходящие друг в друга поворотом, объединим в классы. Одноцветных — ровно a, и каждая образует класс из одного ожерелья. У любой другой раскраски все p поворотов различны: иначе она повторялась бы с периодом, делящим p, а у простого p делители только 1 и p. Значит, остальные aᵖ − a раскрасок разбиты на классы ровно по p штук, и p | aᵖ − a.\n\na = " + format(a, 0) + ", p = " + format(p, 0) + ":   " + format(a, 0) + "^" + format(p, 0) + " − " + format(a, 0) + " = " + format(a ^ p - a, 0) + " = " + format(p, 0) + " · " + format(nOrb, 0) + ".\n\nКлик по ожерелью слева показывает справа его класс.";
}
]
