[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Каждый одночлен — плитки: синие — положительные, оранжевые — отрицательные.
// Разности a − b и b − a: одни и те же плитки с противоположными знаками. ----
draw Graph { name = "gP"; graph = "gp"; nodeColor = #3b82f6; nodeRadius = 14; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #f59e0b; nodeRadius = 14; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "t1"; pos = (-7.6, 3.8); text = "a = " + mono(c1, part); size = 1.2; align = left }
draw Text { name = "t2"; pos = (-7.6, 2.5); text = "b = " + mono(c2, p2); size = 1.2; align = left }
draw Text { name = "r1"; pos = (-7.6, 0.4); text = "a − b = " + d1; size = 1.2; align = left }
draw Text { name = "r2"; pos = (-7.6, -2.4); text = "b − a = " + d2; size = 1.2; align = left }

new UI { name = "sP"; type = select; label = "буквенная часть a"; variable = part; options = ("x", "ab", "x²y"); labels = ("x", "ab", "x²y"); default = "ab" }
new UI { name = "sS"; type = select; label = "одночлен b"; variable = sim; options = ("sim", "non"); labels = ("подобен a", "не подобен a"); default = "sim" }
new UI { name = "s1"; type = slider; label = "c₁"; variable = c1; min = -9; max = 9; step = 1; default = 3 }
new UI { name = "s2"; type = slider; label = "c₂"; variable = c2; min = -9; max = 9; step = 1; default = 5 }

// ---- Логика ----
string part = "ab"; string sim = "sim"; string p2 = "ab";
float c1 = 3; float c2 = 5;
float cnt = 0; float key = -1;
string d1 = ""; string d2 = ""; string info = "";

Function num(q) { if (q < 0) { return "−" + format(-q, 0); } return format(q, 0); }
Function mono(q, p) { if (q == 0) { return "0"; } if (q == 1) { return p; } if (q == -1) { return "−" + p; } return num(q) + p; }
Function pm(q, p) { if (q < 0) { return "(" + mono(q, p) + ")"; } return mono(q, p); }
Function pn(q) { if (q < 0) { return "(" + num(q) + ")"; } return num(q); }
Function alt(p) { if (p == "x") { return "x²"; } if (p == "ab") { return "a²b"; } return "xy²"; }
// q1·p1 + q2·p2 для неподобных: без нулевых слагаемых
Function bin(q1, p1, q2, p2) {
  if (q1 == 0 && q2 == 0) { return "0"; }
  if (q1 == 0) { return mono(q2, p2); }
  if (q2 == 0) { return mono(q1, p1); }
  if (q2 < 0) { return mono(q1, p1) + " − " + mono(-q2, p2); }
  return mono(q1, p1) + " + " + mono(q2, p2);
}
Function tiles(y, q) {
  repeat (abs(q)) {
    cnt = cnt + 1;
    if (q > 0) { addNode(gp, "n" + format(cnt, 0), [-2.6 + 0.8 * i, y]); }
    if (q < 0) { addNode(gn, "n" + format(cnt, 0), [-2.6 + 0.8 * i, y]); }
  }
}

Update {
  p2 = part; if (sim == "non") { p2 = alt(part); }
  float nk = (c1 + 10) * 100 + c2 + 10; if (sim == "non") { nk = nk + 10000; }
  if (nk != key) {
    key = nk; cnt = 0;
    gp = newGraph(); gn = newGraph(); gx = newGraph();
    addNode(gx, "a", [-7.6, 1.5]); addNode(gx, "b", [7.6, 1.5]); addEdge(gx, "a", "b");
    tiles(3.8, c1); tiles(2.5, c2);
    if (sim == "sim") { tiles(0.4, c1 - c2); tiles(-2.4, c2 - c1); }
    if (sim == "non") { tiles(0.4, c1); tiles(-0.9, -c2); tiles(-2.4, c2); tiles(-3.7, -c1); }
  }
  if (sim == "sim") {
    d1 = mono(c1 - c2, part); d2 = mono(c2 - c1, part);
    info = "**Вычитание подобных одночленов.** Буквенная часть " + part + " у a и b одна и та же, поэтому вычитаются только коэффициенты: " + mono(c1, part) + " − " + pm(c2, part) + " = (" + pn(c1) + " − " + pn(c2) + ")" + part + " = " + d1 + ". Результат — снова одночлен, подобный исходным.";
    info = info + "\n\nВ обратном порядке: " + mono(c2, part) + " − " + pm(c1, part) + " = " + d2 + ". Это число, противоположное a − b: вычитание антикоммутативно.";
    if (c1 == c2) { info = info + "\n\nОдночлен, вычтенный из самого себя, даёт нулевой одночлен: плитки взаимно уничтожились."; }
  }
  if (sim == "non") {
    d1 = bin(c1, part, -c2, p2); d2 = bin(c2, p2, -c1, part);
    info = "**Вычитание неподобных одночленов.** У a = " + mono(c1, part) + " и b = " + mono(c2, p2) + " буквенные части " + part + " и " + p2 + " разные, поэтому коэффициенты вычитать нельзя: разность a − b = " + d1 + " остаётся двучленом, то есть многочленом, а не одночленом.";
    info = info + "\n\nПеременив порядок, получаем b − a = " + d2 + " — тот же двучлен с противоположными знаками.";
  }
}
]
