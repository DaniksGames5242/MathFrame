[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- f(x) = 1/xᵖ (синяя) и прямоугольники высоты f(n): оранжевые — на [n; n + 1] (над кривой),
// зелёные — на [n − 1; n] (под кривой). Площадь каждого семейства — частичная сумма ряда Σ f(n). ----
new Curve { name = "fc"; type = parametric; x = "X(0.55 + 12.45 * t)"; y = "Y(pow(0.55 + 12.45 * t, -p))"; segments = 300; color = #3b82f6; thickness = 3; layer = 20 }
draw Graph { name = "gUp"; graph = "gu"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "gLo"; graph = "gl"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 13 }
draw Graph { name = "gGrid"; graph = "gg"; edgeColor = #6b728055; edgeWidth = 1; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #6b7280; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "t1"; pos = (X(1), -4.5); text = "1"; size = 0.9 }
draw Text { name = "t5"; pos = (X(5), -4.5); text = "5"; size = 0.9 }
draw Text { name = "t10"; pos = (X(10), -4.5); text = "10"; size = 0.9 }
draw Text { name = "y5"; pos = (X(0) - 0.15, Y(0.5)); text = "0.5"; size = 0.8; color = #6b7280; align = right }
draw Text { name = "y10"; pos = (X(0) - 0.15, Y(1)); text = "1"; size = 0.8; color = #6b7280; align = right }
draw Text { name = "tf"; pos = (X(1.4) + 0.2, Y(pow(1.4, -p)) + 0.3); text = "y = 1/xᵖ"; color = #3b82f6; size = 1; align = left }

new UI { name = "sP"; type = slider; label = "p"; variable = p; min = 0.5; max = 2.5; step = 0.05; default = 1 }
new UI { name = "sN"; type = slider; label = "N"; variable = N; min = 2; max = 12; step = 1; default = 10 }

// ---- Логика ----
float p = 1; float N = 10;
string info = "";
float gridDone = 0;

Function X(x) { return -7.4 + 14.8 * x / 13.2; }
Function Y(y) { return -4.1 + 7.8 * y; }
Function rect(g, k, x1, x2, h) {
  addNode(g, k + "a", [X(x1), Y(0)]); addNode(g, k + "b", [X(x1), Y(h)]); addNode(g, k + "c", [X(x2), Y(h)]); addNode(g, k + "d", [X(x2), Y(0)]);
  addEdge(g, k + "a", k + "b"); addEdge(g, k + "b", k + "c"); addEdge(g, k + "c", k + "d");
  return 0;
}
// ∫₁ᵗ x^(−p) dx
Function I(t) { if (abs(p - 1) < 0.0001) { return log(t); } return (pow(t, 1 - p) - 1) / (1 - p); }

Update {
  // сетка: вертикали на целых x, горизонтали через 0.1 — строится один раз
  if (gridDone == 0) {
    gg = newGraph();
    repeat (13) { float k = i + 1; addNode(gg, "va" + format(k, 0), [X(k), Y(0)]); addNode(gg, "vb" + format(k, 0), [X(k), Y(1.05)]); addEdge(gg, "va" + format(k, 0), "vb" + format(k, 0)); }
    repeat (10) { float k = i + 1; addNode(gg, "ha" + format(k, 0), [X(0), Y(k / 10)]); addNode(gg, "hb" + format(k, 0), [X(13), Y(k / 10)]); addEdge(gg, "ha" + format(k, 0), "hb" + format(k, 0)); }
    gridDone = 1;
  }
  gu = newGraph(); gl = newGraph(); gx = newGraph();
  addNode(gx, "o", [X(0), Y(0)]); addNode(gx, "e", [X(13), Y(0)]); addEdge(gx, "o", "e");
  addNode(gx, "v", [X(0), Y(1.05)]); addEdge(gx, "o", "v");
  float S = 0;
  repeat (N) { float n = i + 1; float h = pow(n, -p); S = S + h;
    rect(gu, "u" + format(n, 0), n, n + 1, h);
    if (n > 1) { rect(gl, "l" + format(n, 0), n - 1, n, h); }
  }
  float lo = I(N + 1); float hi = 1 + I(N);
  info = "**Интегральный признак Коши:** если f(x) положительна и убывает на [1; +∞), то ряд Σ f(n) и несобственный интеграл ∫₁^∞ f(x) dx сходятся или расходятся одновременно. Причина — картинка: оранжевые прямоугольники (площадь f(1) + … + f(N)) покрывают площадь под кривой от 1 до N + 1, а зелёные (f(2) + … + f(N)) помещаются под ней от 1 до N:\n\n∫₁^(N+1) f dx ≤ f(1) + … + f(N) ≤ f(1) + ∫₁^N f dx.\n\np = " + format(p, 2) + ", N = " + format(N, 0) + ":  " + format(lo, 3) + " ≤ " + format(S, 3) + " ≤ " + format(hi, 3) + ".  ";
  if (p > 1) { info = info + "При p > 1 интеграл сходится (= 1/(p − 1) = " + format(1 / (p - 1), 3) + "), значит, и ряд Σ 1/nᵖ сходится."; }
  else { info = info + "При p ≤ 1 интеграл расходится (растёт как " + "ln N или N^(1−p)), значит, расходится и ряд — в частности, гармонический."; }
}
]
