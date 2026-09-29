[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Римская запись числа N: каждый знак с постоянным значением. Синяя черта — знак прибавляется,
// янтарная — вычитается (стоит перед большим). Внизу — все знаки и их значения. ----
draw Graph { name = "gU"; graph = "gu"; edgeWidth = 5; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "tN"; pos = (0, 4.2); text = "N = " + format(N, 0); size = 1.4 }
draw Text { name = "s0"; pos = (-7.20, 2.0); text = sm(tv[0]); size = 1.9; layer = 6; active = 0 < nt }
draw Text { name = "v0"; pos = (-7.20, 0.1); text = sv(0); size = 0.75; layer = 6; active = 0 < nt }
draw Text { name = "s1"; pos = (-6.40, 2.0); text = sm(tv[1]); size = 1.9; layer = 6; active = 1 < nt }
draw Text { name = "v1"; pos = (-6.40, 0.1); text = sv(1); size = 0.75; layer = 6; active = 1 < nt }
draw Text { name = "s2"; pos = (-5.60, 2.0); text = sm(tv[2]); size = 1.9; layer = 6; active = 2 < nt }
draw Text { name = "v2"; pos = (-5.60, 0.1); text = sv(2); size = 0.75; layer = 6; active = 2 < nt }
draw Text { name = "s3"; pos = (-4.80, 2.0); text = sm(tv[3]); size = 1.9; layer = 6; active = 3 < nt }
draw Text { name = "v3"; pos = (-4.80, 0.1); text = sv(3); size = 0.75; layer = 6; active = 3 < nt }
draw Text { name = "s4"; pos = (-4.00, 2.0); text = sm(tv[4]); size = 1.9; layer = 6; active = 4 < nt }
draw Text { name = "v4"; pos = (-4.00, 0.1); text = sv(4); size = 0.75; layer = 6; active = 4 < nt }
draw Text { name = "s5"; pos = (-3.20, 2.0); text = sm(tv[5]); size = 1.9; layer = 6; active = 5 < nt }
draw Text { name = "v5"; pos = (-3.20, 0.1); text = sv(5); size = 0.75; layer = 6; active = 5 < nt }
draw Text { name = "s6"; pos = (-2.40, 2.0); text = sm(tv[6]); size = 1.9; layer = 6; active = 6 < nt }
draw Text { name = "v6"; pos = (-2.40, 0.1); text = sv(6); size = 0.75; layer = 6; active = 6 < nt }
draw Text { name = "s7"; pos = (-1.60, 2.0); text = sm(tv[7]); size = 1.9; layer = 6; active = 7 < nt }
draw Text { name = "v7"; pos = (-1.60, 0.1); text = sv(7); size = 0.75; layer = 6; active = 7 < nt }
draw Text { name = "s8"; pos = (-0.80, 2.0); text = sm(tv[8]); size = 1.9; layer = 6; active = 8 < nt }
draw Text { name = "v8"; pos = (-0.80, 0.1); text = sv(8); size = 0.75; layer = 6; active = 8 < nt }
draw Text { name = "s9"; pos = (0.00, 2.0); text = sm(tv[9]); size = 1.9; layer = 6; active = 9 < nt }
draw Text { name = "v9"; pos = (0.00, 0.1); text = sv(9); size = 0.75; layer = 6; active = 9 < nt }
draw Text { name = "s10"; pos = (0.80, 2.0); text = sm(tv[10]); size = 1.9; layer = 6; active = 10 < nt }
draw Text { name = "v10"; pos = (0.80, 0.1); text = sv(10); size = 0.75; layer = 6; active = 10 < nt }
draw Text { name = "s11"; pos = (1.60, 2.0); text = sm(tv[11]); size = 1.9; layer = 6; active = 11 < nt }
draw Text { name = "v11"; pos = (1.60, 0.1); text = sv(11); size = 0.75; layer = 6; active = 11 < nt }
draw Text { name = "s12"; pos = (2.40, 2.0); text = sm(tv[12]); size = 1.9; layer = 6; active = 12 < nt }
draw Text { name = "v12"; pos = (2.40, 0.1); text = sv(12); size = 0.75; layer = 6; active = 12 < nt }
draw Text { name = "s13"; pos = (3.20, 2.0); text = sm(tv[13]); size = 1.9; layer = 6; active = 13 < nt }
draw Text { name = "v13"; pos = (3.20, 0.1); text = sv(13); size = 0.75; layer = 6; active = 13 < nt }
draw Text { name = "s14"; pos = (4.00, 2.0); text = sm(tv[14]); size = 1.9; layer = 6; active = 14 < nt }
draw Text { name = "v14"; pos = (4.00, 0.1); text = sv(14); size = 0.75; layer = 6; active = 14 < nt }
draw Text { name = "s15"; pos = (4.80, 2.0); text = sm(tv[15]); size = 1.9; layer = 6; active = 15 < nt }
draw Text { name = "v15"; pos = (4.80, 0.1); text = sv(15); size = 0.75; layer = 6; active = 15 < nt }
draw Text { name = "s16"; pos = (5.60, 2.0); text = sm(tv[16]); size = 1.9; layer = 6; active = 16 < nt }
draw Text { name = "v16"; pos = (5.60, 0.1); text = sv(16); size = 0.75; layer = 6; active = 16 < nt }
draw Text { name = "s17"; pos = (6.40, 2.0); text = sm(tv[17]); size = 1.9; layer = 6; active = 17 < nt }
draw Text { name = "v17"; pos = (6.40, 0.1); text = sv(17); size = 0.75; layer = 6; active = 17 < nt }
draw Text { name = "s18"; pos = (7.20, 2.0); text = sm(tv[18]); size = 1.9; layer = 6; active = 18 < nt }
draw Text { name = "v18"; pos = (7.20, 0.1); text = sv(18); size = 0.75; layer = 6; active = 18 < nt }
draw Text { name = "z0"; pos = (-6.6, -3.6); text = "I = 1"; size = 1.05 }
draw Text { name = "z1"; pos = (-4.4, -3.6); text = "V = 5"; size = 1.05 }
draw Text { name = "z2"; pos = (-2.2, -3.6); text = "X = 10"; size = 1.05 }
draw Text { name = "z3"; pos = (0.0, -3.6); text = "L = 50"; size = 1.05 }
draw Text { name = "z4"; pos = (2.2, -3.6); text = "C = 100"; size = 1.05 }
draw Text { name = "z5"; pos = (4.4, -3.6); text = "D = 500"; size = 1.05 }
draw Text { name = "z6"; pos = (6.6, -3.6); text = "M = 1000"; size = 1.05 }

new UI { name = "sN"; type = slider; label = "число"; variable = N; min = 1; max = 3999; step = 1; default = 1994 }
new UI { name = "sM"; type = select; label = "запись"; variable = mode; options = ("sub", "add"); labels = ("с вычитанием: IV, IX", "только сложение: IIII"); default = "sub" }

float N = 1994; string mode = "sub"; float key = -1; float nt = 0; string info = "";
list tv = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

Function nv(m) {
  if (m >= 1000) { return 1000; }
  if (m >= 900 && mode == "sub") { return 900; } if (m >= 500) { return 500; } if (m >= 400 && mode == "sub") { return 400; }
  if (m >= 100) { return 100; }
  if (m >= 90 && mode == "sub") { return 90; } if (m >= 50) { return 50; } if (m >= 40 && mode == "sub") { return 40; }
  if (m >= 10) { return 10; }
  if (m >= 9 && mode == "sub") { return 9; } if (m >= 5) { return 5; } if (m >= 4 && mode == "sub") { return 4; } return 1;
}
Function unit(v) { if (v == 900) { return 100; } if (v == 400) { return 100; } if (v == 90) { return 10; } if (v == 40) { return 10; } return 1; }
Function big(v) { if (v == 900) { return 1000; } if (v == 400) { return 500; } if (v == 90) { return 100; } if (v == 40) { return 50; } if (v == 9) { return 10; } return 5; }
Function sm(v) {
  if (v == 1000) { return "M"; } if (v == 500) { return "D"; } if (v == 100) { return "C"; } if (v == 50) { return "L"; }
  if (v == 10) { return "X"; } if (v == 5) { return "V"; } return "I";
}
Function neg(k) { if (k < nt - 1 && tv[k] < tv[k + 1]) { return 1; } return 0; }
Function sv(k) { if (neg(k) > 0.5) { return "−" + format(tv[k], 0); } return "+" + format(tv[k], 0); }

Update {
  if (key != N * 10 + (mode == "sub")) {
    key = N * 10 + (mode == "sub");
    nt = 0; float m = N;
    repeat (20) { tv[i] = 0; }
    repeat (20) {
      if (m > 0) {
        float v = nv(m);
        if (v == 900 || v == 400 || v == 90 || v == 40 || v == 9 || v == 4) { tv[nt] = unit(v); tv[nt + 1] = big(v); nt = nt + 2; }
        else { tv[nt] = v; nt = nt + 1; }
        m = m - v;
      }
    }
    gu = newGraph();
    repeat (19) {
      if (i < nt) {
        string c = "#3b82f6"; if (neg(i) > 0.5) { c = "#f59e0b"; }
        addNode(gu, "a" + format(i, 0), [-7.2 + 0.8 * i - 0.32, 1.1]); addNode(gu, "b" + format(i, 0), [-7.2 + 0.8 * i + 0.32, 1.1]); addEdge(gu, "a" + format(i, 0), "b" + format(i, 0), 1, c);
      }
    }
  }
  string rec = ""; string sum = "";
  repeat (19) { if (i < nt) { rec = rec + sm(tv[i]); if (i > 0) { if (neg(i) > 0.5) { sum = sum + " − "; } else { sum = sum + " + "; } } else if (neg(i) > 0.5) { sum = sum + "−"; } sum = sum + format(tv[i], 0); } }
  info = "**Непозиционная система (римская).** Знак имеет одно и то же значение на любом месте: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Значение записи — сумма значений знаков";
  if (mode == "sub") { info = info + "; знак, стоящий перед большим, вычитается"; }
  info = info + ".\n\n";
  info = info + "**" + rec + " = " + sum + " = " + format(N, 0) + "**.\n\n";
  if (mode == "sub") { info = info + "Нуля нет и он не нужен: положение знака ничего не меняет. В записи " + format(nt, 0) + " знаков; для очень больших чисел пришлось бы вводить всё новые знаки."; }
  else { info = info + "Без правила вычитания записи получаются длиннее (" + format(nt, 0) + " знаков): IIII вместо IV. Исторически встречались оба варианта, то есть запись неоднозначна."; }
}
]
