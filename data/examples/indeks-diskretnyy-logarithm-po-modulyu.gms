[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Круг степеней основания g: в позиции x стоит g^x mod m (снаружи — показатель x). Индекс числа a — номер его позиции.
// Синий — a, жёлтый — b, зелёный — a·b: позиции складываются, ind(ab) = ind a + ind b. Серые — остальные степени g. ----
draw Graph { name = "gN"; graph = "gn"; nodeColor = #3b82f6; nodeRadius = 11; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #3b82f6; nodeRadius = 19; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #f59e0b; nodeRadius = 15.5; interactive = false; showWeights = false; layer = 7 }
draw Graph { name = "gC"; graph = "gc"; nodeColor = #22c55e; nodeRadius = 12; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gEx"; graph = "gex"; nodeColor = #ffffff00; nodeRadius = 9; interactive = false; showWeights = false; layer = 5 }

draw Text { name = "tH"; pos = (-7.8, 4.6); text = "снаружи — показатель x,\nвнутри — g^x mod m"; size = 0.85; align = left }
new UI { name = "sM"; type = slider; label = "модуль m"; variable = m; min = 3; max = 31; step = 1; default = 13 }
new UI { name = "sG"; type = slider; label = "основание g"; variable = g; min = 2; max = 30; step = 1; default = 2 }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 30; step = 1; default = 5 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 30; step = 1; default = 7 }
new UI { name = "sK"; type = slider; label = "показатель k"; variable = k; min = 1; max = 8; step = 1; default = 3 }

// ---- Логика ----
float m = 13; float g = 2; float a = 5; float b = 7; float k = 3; float key = -1; float d = 0;
string info = "";

Function md(x, y) { return x - floor(x / y) * y; }
Function gd(x, y) { float u = abs(x); float v = abs(y); repeat (40) { if (v > 0) { float r = u - floor(u / v) * v; u = v; v = r; } } return u; }
Function phi(n) { float c = 0; repeat (n) { if (gd(n, i + 1) == 1) { c = c + 1; } } return c; }
Function pm(x, e) { float r = 1; repeat (e) { r = md(r * md(x, m), m); } return md(r, m); }
Function ordr() { float o = 0; float cur = 1; repeat (m) { cur = md(cur * g, m); if (cur == 1 && o == 0) { o = i + 1; } } return o; }
Function idx(v) { float r = -1; float cur = 1; float t = md(v, m); repeat (d) { if (cur == t && r < 0) { r = i; } cur = md(cur * g, m); } return r; }
Function cx(t) { return 3.7 * sin(2 * pi * t / d); }
Function cy(t) { return 3.7 * cos(2 * pi * t / d); }
Function ex(t) { return 4.45 * sin(2 * pi * t / d); }
Function ey(t) { return 4.45 * cos(2 * pi * t / d); }
Function ni(x) { return format(x, 0); }

Update {
  d = 0;
  if (gd(g, m) == 1) { d = ordr(); }
  float kk = m * 100000000 + g * 1000000 + a * 10000 + b * 100 + k;
  if (kk != key) {
    key = kk;
    gn = newGraph(); ga = newGraph(); gb = newGraph(); gc = newGraph(); gex = newGraph();
    if (d > 0) {
      float xa = idx(a); float xb = idx(b); float xc = idx(a * b); if (xa < 0 || xb < 0) { xc = -1; }
      float cur = 1;
      repeat (d) {
        float x = i;
        string id = "n" + ni(x);
        if (x == xc) { addNode(gc, id, [cx(x), cy(x)], ni(cur)); }
        if (x == xb) { addNode(gb, id, [cx(x), cy(x)], ni(cur)); }
        if (x == xa) { addNode(ga, id, [cx(x), cy(x)], ni(cur)); }
        addNode(gn, id, [cx(x), cy(x)], ni(cur));
        addNode(gex, id, [ex(x), ey(x)], ni(x));
        cur = md(cur * g, m);
      }
    }
  }
  float ph = phi(m);
  info = "**Индекс (дискретный логарифм):** ind_g a — показатель x, при котором g^x ≡ a (mod m). Модуль m = **" + ni(m) + "**, основание g = **" + ni(g) + "**, φ(m) = " + ni(ph) + ".\n\n";
  if (d == 0) {
    info = info + "**g и m не взаимно просты**, степени g не образуют группы обратимых остатков — индексов нет. Возьмите g, взаимно простое с m.";
  } else {
    if (d == ph) { info = info + "Порядок g равен d = " + ni(d) + " = φ(m): **g — первообразный корень**, степени g пробегают все обратимые остатки, индекс есть у каждого a, взаимно простого с m (круг — вся группа).\n\n"; }
    else { info = info + "Порядок g равен d = " + ni(d) + " < φ(m): **g не первообразный корень**, степени g образуют лишь подгруппу (на круге только её элементы), индекс есть только у её элементов.\n\n"; }
    float xa = idx(a); float xb = idx(b); float xc = idx(a * b); float xk = idx(pm(a, k));
    if (xa < 0 || xb < 0) {
      info = info + "**У числа " + ni(md(a, m)) + " (a) " + "или " + ni(md(b, m)) + " (b) индекса нет:** оно не является степенью g по модулю " + ni(m) + ".";
    } else {
      info = info + "**ind a = " + ni(xa) + " (g^" + ni(xa) + " ≡ " + ni(md(a, m)) + "), ind b = " + ni(xb) + " (g^" + ni(xb) + " ≡ " + ni(md(b, m)) + "). Произведение:** a·b ≡ " + ni(md(a * b, m)) + ", ind(ab) = " + ni(xc) + " = " + ni(xa) + " + " + ni(xb) + " ≡ " + ni(xa + xb) + " (mod " + ni(d) + ")" + ".\n\n";
      info = info + "**Степень:** aᵏ при k = " + ni(k) + " даёт " + ni(pm(a, k)) + ", ind(aᵏ) = " + ni(xk) + " ≡ k·ind a = " + ni(k * xa) + " (mod " + ni(d) + "). **Обратный:** ind(a⁻¹) = " + ni(md(d - xa, d)) + " ≡ −ind a (mod " + ni(d) + ").";
    }
  }
}
]
