[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Остатки 1…p−1 по кругу, стрелки x → x² (mod p) ----
// Все остатки со стрелками — серые; квадратичные вычеты (куда приходят стрелки) поверх —
// синие; остаток a, выбранный ползунком, — оранжевый.
draw Graph { name = "gAll"; graph = "ga"; nodeColor = #6b7280; edgeColor = #6b7280; nodeRadius = 13; directed = true; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gRes"; graph = "gq"; nodeColor = #3b82f6; nodeRadius = 13; interactive = false; showWeights = false; layer = 21 }
draw Graph { name = "gSel"; graph = "gs"; nodeColor = #f59e0b; nodeRadius = 13; interactive = false; showWeights = false; layer = 22 }

new UI { name = "sP"; type = select; label = "p"; variable = p; options = (7, 11, 13, 17, 19, 23); default = 13 }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 22; step = 1; default = 5 }

// ---- Логика ----
float p = 13;
float a = 5;
float lastP = -1;
float nres = 0;
string info = "";

Function md(x, m) { return x - floor(x / m) * m; }
Function pos(k) { return [4.2 * cos(pi / 2 - 2 * pi * (k - 1) / (p - 1)), 4.2 * sin(pi / 2 - 2 * pi * (k - 1) / (p - 1))]; }
// Является ли k квадратом по модулю p
Function isRes(k) {
  repeat (p - 1) { if (md((i + 1) * (i + 1), p) == k) { return true; } }
  return false;
}
// a^e mod p
Function powMod(x, e) {
  float r = 1;
  repeat (e) { r = md(r * x, p); }
  return r;
}

Update {
  if (a > p - 1) { a = p - 1; }
  if (p != lastP) {
    ga = newGraph(); gq = newGraph(); nres = 0;
    repeat (p - 1) {
      float k = i + 1;
      addNode(ga, format(k, 0), pos(k));
      if (isRes(k)) { addNode(gq, format(k, 0), pos(k)); nres = nres + 1; }
    }
    repeat (p - 1) { float x = i + 1; if (md(x * x, p) != x) { addEdge(ga, format(x, 0), format(md(x * x, p), 0)); } }
    lastP = p;
  }
  gs = newGraph(); addNode(gs, format(a, 0), pos(a));
  float eu = powMod(a, (p - 1) / 2);
  string crit = "1"; if (eu == p - 1) { crit = "−1"; }
  info = "**Квадратичный вычет** по модулю p — остаток a, для которого сравнение x² ≡ a (mod p) разрешимо (синие). Числа x и p − x дают один и тот же квадрат, поэтому вычетов ровно (p − 1)/2 = " + format(nres, 0) + ".\n\n**Критерий Эйлера:** a — вычет ⇔ a^((p−1)/2) ≡ 1, невычет ⇔ ≡ −1.   a = " + format(a, 0) + ": " + format(a, 0) + "^" + format((p - 1) / 2, 0) + " ≡ " + crit + " (mod " + format(p, 0) + ") — ";
  if (eu == 1) { info = info + "**вычет**."; } else { info = info + "**невычет**."; }
}
]
