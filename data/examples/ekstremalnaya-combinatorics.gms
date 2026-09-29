[
description = "{info}"

field width = 20;
field height = 9;
camera type = fixed;

// Задача Турана: наибольшее число рёбер в графе на n вершинах без полного подграфа K_{r+1}.
// Полный r-дольный граф (доли — столбцы) такого подграфа не содержит; рёбер больше всего, когда доли почти равны.
float n = 7; float r = 2; float key = -1; float key2 = -1; float last = 0; float init = 0; float E = 0; string info = "";
list part = [0]; list xs = [0]; list ys = [0];
draw Graph { name = "gE"; graph = "ge"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f699; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gV"; graph = "gv"; nodeColor = #3b82f6; nodeRadius = 9; labels = false; interactive = false; showWeights = false; layer = 5 }
new UI { type = slider; label = "n (вершин)"; variable = n; min = 3; max = 14; step = 1; default = 7 }
new UI { type = slider; label = "r (число долей)"; variable = r; min = 2; max = 5; step = 1; default = 2 }

Function tmax(nn, rr) {
  float q = floor(nn / rr); float rem = nn - q * rr;
  float s = rem * (q + 1) * (q + 1) + (rr - rem) * q * q;
  return (nn * nn - s) / 2;
}
Function kk(d) {
  if (d == 3) { return "K₃"; }
  if (d == 4) { return "K₄"; }
  if (d == 5) { return "K₅"; }
  return "K₆";
}
Function cntp(p) {
  float c = 0;
  repeat (n) { if (part[i] == p) { c = c + 1; } }
  return c;
}
Update {
  if (init == 0) { repeat (13) { push(part, 0); push(xs, 0); push(ys, 0); } init = 1; }
  n = round(n); r = round(r);
  if (key2 != n * 10 + r) {
    repeat (14) { part[i] = i - r * floor(i / r); }
    key2 = n * 10 + r; key = -1;
  }
  if (mouseClickCount != last) {
    last = mouseClickCount;
    float bd = 0.9; float bv = -1;
    repeat (n) { float d = sqrt((xs[i] - mouseClickX) * (xs[i] - mouseClickX) + (ys[i] - mouseClickY) * (ys[i] - mouseClickY)); if (d < bd) { bd = d; bv = i; } }
    if (bv >= 0) { part[bv] = part[bv] + 1 - r * floor((part[bv] + 1) / r); key = -1; }
  }
  float k2 = 0;
  repeat (n) { k2 = k2 + part[i] * pow(5, i); }
  if (k2 != key) {
    key = k2;
    float mxs = 1; repeat (r) { mxs = max(mxs, cntp(i)); }
    float dy = min(1.15, 8.5 / mxs); float yt = (mxs - 1) * dy / 2;
    list rk = [0]; repeat (r - 1) { push(rk, 0); }
    ge = newGraph(); gv = newGraph();
    repeat (n) {
      float p = part[i];
      xs[i] = -9 + 18 * (p + 0.5) / r; ys[i] = yt - dy * rk[p]; rk[p] = rk[p] + 1;
      addNode(gv, "v" + format(i, 0), [xs[i], ys[i]]);
    }
    E = 0;
    repeat (n) {
      float u = i;
      repeat (n) { if (i > u && part[i] != part[u]) { addEdge(ge, "v" + format(u, 0), "v" + format(i, 0)); addNode(ge, "v" + format(u, 0), [xs[u], ys[u]]); addNode(ge, "v" + format(i, 0), [xs[i], ys[i]]); E = E + 1; } }
    }
  }
  float M = tmax(n, r);
  string sz = "";
  repeat (r) { if (i > 0) { sz = sz + ", "; } sz = sz + format(cntp(i), 0); }
  info = "**Экстремальная задача Турана.** Каково наибольшее число рёбер в графе на n = **" + format(n, 0) + "** вершинах, где нет полного подграфа " + kk(r + 1) + " (среди любых " + format(r + 1, 0) + " вершин есть пара несоединённых)? Ответ Турана: наибольшее число рёбер (**" + format(M, 0) + "**) — у полного r-дольного графа с почти равными долями; оно не превосходит (1 − 1/r)·n²/2 = " + format((1 - 1 / r) * n * n / 2, 2) + ".\n\n";
  string cmp = "меньше максимума на " + format(M - E, 0) + ".";
  if (E == M) { cmp = "это максимум — экстремальный граф."; }
  info = info + "Сейчас граф полный " + format(r, 0) + "-дольный с долями " + sz + ": рёбер **" + format(E, 0) + "**, " + cmp + " Чем ровнее доли, тем больше рёбер; " + kk(r + 1) + " в таком графе нет — две вершины одной доли не соединены.\n\nЩёлчок по вершине переносит её в следующую долю.";
}
]
