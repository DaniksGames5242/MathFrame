[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Каждый одночлен — c плиток: синие — положительные, оранжевые — отрицательные.
// Внизу плитки суммы: противоположные плитки взаимно уничтожаются. ----
draw Graph { name = "gP"; graph = "gp"; nodeColor = #3b82f6; nodeRadius = 14; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #f59e0b; nodeRadius = 14; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #6b728088; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "t1"; pos = (-7.6, 3.6); text = mono(c1, part); size = 1.2; align = left }
draw Text { name = "t2"; pos = (-7.6, 2.3); text = mono(c2, part); size = 1.2; align = left }
draw Text { name = "t3"; pos = (-7.6, 1); text = mono(c3, p3); size = 1.2; align = left }
draw Text { name = "r1"; pos = (-7.6, -1.6); text = "= " + res1; size = 1.2; align = left }

new UI { name = "sP"; type = select; label = "буквенная часть"; variable = part; options = ("x", "ab", "x²y"); labels = ("x", "ab", "x²y"); default = "x²y" }
new UI { name = "sS"; type = select; label = "третий одночлен"; variable = sim; options = ("sim", "non"); labels = ("подобен первым двум", "не подобен"); default = "sim" }
new UI { name = "s1"; type = slider; label = "c₁"; variable = c1; min = -9; max = 9; step = 1; default = 3 }
new UI { name = "s2"; type = slider; label = "c₂"; variable = c2; min = -9; max = 9; step = 1; default = -5 }
new UI { name = "s3"; type = slider; label = "c₃"; variable = c3; min = -9; max = 9; step = 1; default = 4 }

// ---- Логика ----
string part = "x²y"; string sim = "sim"; string p3 = "x²y";
float c1 = 3; float c2 = -5; float c3 = 4;
float cnt = 0; float key = -1; float sS = 0;
string res1 = ""; string string info = "";

Function num(q) { if (q < 0) { return "−" + format(-q, 0); } return format(q, 0); }
Function mono(q, p) { if (q == 0) { return "0"; } if (q == 1) { return p; } if (q == -1) { return "−" + p; } return num(q) + p; }
Function pm(q, p) { if (q < 0) { return "(" + mono(q, p) + ")"; } return mono(q, p); }
Function pn(q) { if (q < 0) { return "(" + num(q) + ")"; } return num(q); }
Function alt(p) { if (p == "x") { return "x²"; } if (p == "ab") { return "a²b"; } return "xy²"; }
Function tiles(y, q) {
  repeat (abs(q)) {
    cnt = cnt + 1;
    if (q > 0) { addNode(gp, "n" + format(cnt, 0), [-2.6 + 0.8 * i, y]); }
    if (q < 0) { addNode(gn, "n" + format(cnt, 0), [-2.6 + 0.8 * i, y]); }
  }
}

Update {
  p3 = part; if (sim == "non") { p3 = alt(part); }
  sS = c1 + c2; if (sim == "sim") { sS = sS + c3; }
  float nk = (c1 + 10) * 10000 + (c2 + 10) * 100 + c3 + 10; if (sim == "non") { nk = nk + 1000000; }
  if (nk != key) {
    key = nk; cnt = 0;
    gp = newGraph(); gn = newGraph(); gx = newGraph();
    addNode(gx, "a", [-7.6, -0.4]); addNode(gx, "b", [7.6, -0.4]); addEdge(gx, "a", "b");
    tiles(3.6, c1); tiles(2.3, c2); tiles(1, c3);
    if (sim == "sim") { tiles(-1.6, sS); }
    if (sim == "non") { if (sS == 0) { tiles(-1.6, c3); } else { tiles(-1.6, sS); tiles(-2.9, c3); } }
  }
  if (sim == "sim") {
    res1 = mono(sS, part);
    info = "**Сложение подобных одночленов.** Буквенная часть " + part + " у всех слагаемых одна и та же, поэтому по дистрибутивности " + mono(c1, part) + " + " + pm(c2, part) + " + " + pm(c3, part) + " = (" + pn(c1) + " + " + pn(c2) + " + " + pn(c3) + ")" + part + " = " + mono(sS, part) + ": складываются только коэффициенты, а буквенная часть остаётся прежней.";
    if (sS == 0) { info = info + "\n\nСумма равна нулю: положительные и отрицательные плитки взаимно уничтожились."; }
    if (c1 + c2 == 0 || c1 + c3 == 0 || c2 + c3 == 0) { info = info + "\n\nЕсть пара противоположных одночленов — их сумма равна нулю при любом порядке слагаемых."; }
  }
  if (sim == "non") {
    string tail = "";
    if (c3 < 0) { tail = " − " + mono(-c3, p3); } else { tail = " + " + mono(c3, p3); }
    if (sS == 0) { res1 = mono(c3, p3); } else { res1 = mono(sS, part) + tail; }
    info = "**Неподобные одночлены.** У " + part + " и " + p3 + " буквенные части разные, поэтому третий одночлен сливать с первыми нельзя: сумма подобных первых двух равна " + mono(sS, part) + ", а третье слагаемое остаётся отдельным.";
    if (sS == 0) { info = info + " Остаётся " + res1 + "."; } else { info = info + " Результат — " + res1 + ": двучлен, а не одночлен того же вида."; }
  }
}
]
