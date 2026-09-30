[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Сверху — распределение X (значения −2…2, вероятности pₖ из весов), снизу — Y = aX + b.
// Жёлтая отметка — математическое ожидание, зелёный отрезок — интервал [E − σ; E + σ]. ----
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gB"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 34; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gM"; graph = "gm"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "lx"; pos = (-7.6, 4.2); text = "X"; size = 1.1; align = left }
draw Text { name = "ly"; pos = (-7.6, -0.9); text = "Y = aX + b"; size = 1.1; align = left }
draw Text { name = "t0"; pos = (-3, -0.8); text = "−2"; size = 0.8 }
draw Text { name = "t1"; pos = (-1.5, -0.8); text = "−1"; size = 0.8 }
draw Text { name = "t2"; pos = (0, -0.8); text = "0"; size = 0.8 }
draw Text { name = "t3"; pos = (1.5, -0.8); text = "1"; size = 0.8 }
draw Text { name = "t4"; pos = (3, -0.8); text = "2"; size = 0.8 }

new UI { type = slider; label = "вес x = −2"; variable = w0; min = 0; max = 10; step = 1; default = 1 }
new UI { type = slider; label = "вес x = −1"; variable = w1; min = 0; max = 10; step = 1; default = 3 }
new UI { type = slider; label = "вес x = 0"; variable = w2; min = 0; max = 10; step = 1; default = 4 }
new UI { type = slider; label = "вес x = 1"; variable = w3; min = 0; max = 10; step = 1; default = 3 }
new UI { type = slider; label = "вес x = 2"; variable = w4; min = 0; max = 10; step = 1; default = 1 }
new UI { type = slider; label = "a"; variable = ka; min = -1.5; max = 1.5; step = 0.1; default = 1.5 }
new UI { type = slider; label = "b"; variable = kb; min = -1.5; max = 1.5; step = 0.1; default = 1 }

float w0 = 1; float w1 = 3; float w2 = 4; float w3 = 3; float w4 = 1; float ka = 1.5; float kb = 1;
float key = -1; float EX = 0; float DX = 0; float SX = 0; string info = "";

Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function w(k) { if (k == 0) { return w0; } if (k == 1) { return w1; } if (k == 2) { return w2; } if (k == 3) { return w3; } return w4; }
Function p(k, s) { if (s < 0.5) { return 0.2; } return w(k) / s; }

Update {
  float s = w0 + w1 + w2 + w3 + w4;
  if (key != w0 + 11 * w1 + 121 * w2 + 1331 * w3 + 14641 * w4 + 100000 * (ka + 3) + 1000000 * (kb + 3)) {
    ga = newGraph(); gb = newGraph(); gm = newGraph();
    EX = 0; repeat (5) { EX = EX + p(i, s) * (i - 2); }
    DX = 0; repeat (5) { DX = DX + p(i, s) * (i - 2 - EX) * (i - 2 - EX); }
    SX = sqrt(DX);
    // ось и столбики: строка 0 — X (основание y = 1), строка 1 — Y (основание y = −3.6)
    repeat (2) {
      float r = i; float y0 = 1; if (r == 1) { y0 = -3.6; }
      float sc = 1; float sh = 0; if (r == 1) { sc = ka; sh = kb; }
      float e = 1.5 * (sc * EX + sh); float sg = 1.5 * abs(sc) * SX;
      addNode(ga, "a" + format(r, 0), [-7.5, y0]); addNode(ga, "b" + format(r, 0), [7.5, y0]); addEdge(ga, "a" + format(r, 0), "b" + format(r, 0));
      repeat (5) {
        float k = i; float xv = 1.5 * (sc * (k - 2) + sh);
        addNode(gb, "p" + format(r * 5 + k, 0), [xv, y0]); addNode(gb, "q" + format(r * 5 + k, 0), [xv, y0 + 3.4 * p(k, s)]); addEdge(gb, "p" + format(r * 5 + k, 0), "q" + format(r * 5 + k, 0));
      }
      addNode(gm, "m" + format(r, 0), [e, y0 - 0.2]); addNode(gm, "n" + format(r, 0), [e, y0 + 3.3]); addEdge(gm, "m" + format(r, 0), "n" + format(r, 0), 1, "#f59e0b");
      addNode(gm, "l" + format(r, 0), [e - sg, y0 - 0.7]); addNode(gm, "r" + format(r, 0), [e + sg, y0 - 0.7]); addEdge(gm, "l" + format(r, 0), "r" + format(r, 0), 1, "#22c55e");
      addNode(gm, "lu" + format(r, 0), [e - sg, y0 - 0.45]); addNode(gm, "ld" + format(r, 0), [e - sg, y0 - 0.95]); addEdge(gm, "lu" + format(r, 0), "ld" + format(r, 0), 1, "#22c55e");
      addNode(gm, "ru" + format(r, 0), [e + sg, y0 - 0.45]); addNode(gm, "rd" + format(r, 0), [e + sg, y0 - 0.95]); addEdge(gm, "ru" + format(r, 0), "rd" + format(r, 0), 1, "#22c55e");
    }
    key = w0 + 11 * w1 + 121 * w2 + 1331 * w3 + 14641 * w4 + 100000 * (ka + 3) + 1000000 * (kb + 3);
  }
  info = "**Среднее квадратическое отклонение** σ(X) = √D(X) — корень из дисперсии D(X) = E[(X − E(X))²]; оно измеряется в тех же единицах, что и X.\n\n";
  info = info + "E(X) = " + num(EX, 2) + ", D(X) = " + num(DX, 2) + ", σ(X) = " + num(SX, 2) + ".";
  if (SX < 0.005) { info = info + " Вся вероятность сосредоточена в одной точке: величина постоянна, σ = 0."; }
  info = info + "\n\n**Однородность и сдвиг.** Для Y = aX + b: σ(Y) = |a|·σ(X) = " + num(abs(ka), 1) + " · " + num(SX, 2) + " = " + num(abs(ka) * SX, 2) + "; D(Y) = a²·D(X) = " + num(ka * ka * DX, 2) + ". Сдвиг b на разброс не влияет, растяжение в |a| раз меняет σ в |a| раз.";
}
]
