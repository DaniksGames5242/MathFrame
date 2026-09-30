[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;

// ---- 120 выборок объёма n из N(0; θ), θ = σ². Для каждой считаются две оценки θ:
// сумма квадратов отклонений, делённая на n (смещённая), и делённая на n − 1 (несмещённая).
// Точки — значения оценок, вертикальная отметка — их среднее, зелёная линия — истинное θ. ----
draw Graph { name = "gTh"; graph = "gth"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #f59e0b99; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #3b82f699; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gMa"; graph = "gma"; edgeColor = #f59e0b; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gMb"; graph = "gmb"; edgeColor = #3b82f6; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Text { name = "lA"; pos = (-7.6, 4.55); text = "делитель n"; size = 0.95; align = left }
draw Text { name = "lB"; pos = (-7.6, -0.3); text = "делитель n − 1"; size = 0.95; align = left }
draw Text { name = "t0"; pos = (-7.5, -4.6); text = "0"; size = 0.9 }
draw Text { name = "t1"; pos = (-2.5, -4.6); text = "θ = " + format(th, 0); size = 0.9; color = #22c55e }
draw Text { name = "t2"; pos = (2.5, -4.6); text = format(2 * th, 0); size = 0.9 }
draw Text { name = "t3"; pos = (7.5, -4.6); text = format(3 * th, 0); size = 0.9 }

new UI { name = "sN"; type = slider; label = "объём выборки n"; variable = n; min = 2; max = 20; step = 1; default = 5 }
new UI { name = "sT"; type = slider; label = "θ = σ²"; variable = th; min = 1; max = 9; step = 1; default = 4 }
new UI { name = "sS"; type = slider; label = "серия выборок"; variable = seed; min = 1; max = 30; step = 1; default = 1 }

float n = 5; float th = 4; float seed = 1; float key = -1; string info = "";
float mA = 0; float mB = 0;

Function rnd(k) { float v = sin(k * 12.9898 + 4.1) * 43758.5453; return v - floor(v); }
Function nrm(k) { return sqrt(-2 * log(rnd(2 * k) + 0.000001)) * cos(2 * pi * rnd(2 * k + 1)); }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function px(v) { return -7.5 + 15 * min(v / (3 * th), 1); }

Update {
  if (key != n * 10000 + th * 100 + seed) {
    key = n * 10000 + th * 100 + seed;
    ga = newGraph(); gb = newGraph(); gma = newGraph(); gmb = newGraph(); gth = newGraph(); gax = newGraph();
    float sg = sqrt(th); float sa = 0; float sb = 0;
    repeat (120) {
      float s = i; float m = 0;
      repeat (n) { m = m + sg * nrm(seed * 100000 + s * 50 + i); }
      m = m / n;
      float ss = 0;
      repeat (n) { float d = sg * nrm(seed * 100000 + s * 50 + i) - m; ss = ss + d * d; }
      float e1 = ss / n; float e2 = ss / (n - 1);
      sa = sa + e1; sb = sb + e2;
      float jy = (rnd(s * 3.7 + seed) - 0.5) * 2;
      addNode(ga, "a" + format(s, 0), [px(e1), 2.4 + jy]);
      addNode(gb, "b" + format(s, 0), [px(e2), -2.4 + jy]);
    }
    mA = sa / 120; mB = sb / 120;
    addNode(gma, "p", [px(mA), 0.9]); addNode(gma, "q", [px(mA), 3.9]); addEdge(gma, "p", "q");
    addNode(gmb, "p", [px(mB), -3.9]); addNode(gmb, "q", [px(mB), -0.9]); addEdge(gmb, "p", "q");
    addNode(gth, "p", [-2.5, -4.2]); addNode(gth, "q", [-2.5, 4.2]); addEdge(gth, "p", "q");
    addNode(gax, "p", [-7.5, -4.2]); addNode(gax, "q", [7.5, -4.2]); addEdge(gax, "p", "q");
  }
  info = "**Несмещённость:** оценка θ̂ параметра θ несмещённа, если её математическое ожидание равно θ при любом допустимом θ. Здесь θ = σ² = **" + format(th, 0) + "** — дисперсия нормального распределения, объём выборки n = **" + format(n, 0) + "**.\n\n";
  info = info + "**Делитель n:** E θ̂ = (n − 1)/n · θ = **" + format((n - 1) / n * th, 2) + "**; среднее по 120 выборкам — **" + format(mA, 2) + "**. Оценка систематически занижает θ, смещение −θ/n = **" + num(-th / n, 2) + "**.\n\n";
  info = info + "**Делитель n − 1:** E θ̂ = θ = **" + format(th, 0) + "**; среднее по 120 выборкам — **" + format(mB, 2) + "**. Отдельные значения разбросаны сильно, но в среднем систематической ошибки нет.";
}
]
