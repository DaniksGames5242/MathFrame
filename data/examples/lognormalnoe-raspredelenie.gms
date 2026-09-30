[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Плотность логнормального распределения на x > 0. Вертикали: мода (зелёная), медиана (оранжевая)
// и математическое ожидание (обычная) — всегда в порядке «мода < медиана < среднее». ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gCu"; graph = "gc"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gMo"; graph = "gmo"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gMe"; graph = "gme"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gMn"; graph = "gmn"; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "t0"; pos = (px(0), -5.7); text = "0"; size = 0.9 }
draw Text { name = "t2"; pos = (px(2), -5.7); text = "2"; size = 0.9 }
draw Text { name = "t4"; pos = (px(4), -5.7); text = "4"; size = 0.9 }
draw Text { name = "t6"; pos = (px(6), -5.7); text = "6"; size = 0.9 }
draw Text { name = "t8"; pos = (px(8), -5.7); text = "8"; size = 0.9 }
draw Text { name = "t10"; pos = (px(10), -5.7); text = "10"; size = 0.9 }
draw Text { name = "l1"; pos = (-9.6, 5.6); text = "мода " + format(xmo, 2); size = 0.9; align = left; color = #22c55e }
draw Text { name = "l2"; pos = (-9.6, 4.9); text = "медиана " + format(xme, 2); size = 0.9; align = left; color = #f59e0b }
draw Text { name = "l3"; pos = (-9.6, 4.2); text = "среднее " + format(xmn, 2); size = 0.9; align = left }

new UI { name = "sM"; type = slider; label = "μ"; variable = mu; min = -1; max = 1.5; step = 0.05; default = 0.5 }
new UI { name = "sS"; type = slider; label = "σ"; variable = sg; min = 0.2; max = 1; step = 0.05; default = 0.6 }

// ---- Логика ----
float mu = 0.5; float sg = 0.6; float key = -1;
float xmo = 0; float xme = 0; float xmn = 0; string info = "";
Function px(u) { return -9.4 + 18.8 * u / 10; }
Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function f(x) {
  if (x <= 0) { return 0; }
  float z = (log(x) - mu) / sg;
  return exp(-z * z / 2) / (x * sg * 2.5066283);
}

Update {
  if (key != mu * 1000 + sg) {
    gg = newGraph(); gc = newGraph(); gmo = newGraph(); gme = newGraph(); gmn = newGraph();
    xmo = exp(mu - sg * sg); xme = exp(mu); xmn = exp(mu + sg * sg / 2);
    float pmax = f(xmo);
    float gstep = 0.1; if (pmax > 0.6) { gstep = 0.2; } if (pmax > 1.2) { gstep = 0.5; }
    float tp = gstep * ceil(pmax / gstep);
    float sy = 8 / tp;
    addNode(gg, "x1", [-9.4, -5]); addNode(gg, "x2", [9.4, -5]); addEdge(gg, "x1", "x2");
    repeat (round(tp / gstep)) {
      string s = format(i + 1, 0);
      addNode(gg, "l" + s, [-9.4, -5 + gstep * sy * (i + 1)]); addNode(gg, "r" + s, [9.4, -5 + gstep * sy * (i + 1)]); addEdge(gg, "l" + s, "r" + s);
    }
    repeat (121) {
      float xx = 10 * i / 120;
      addNode(gc, "c" + format(i, 0), [px(xx), -5 + sy * f(xx)]);
      if (i > 0) { addEdge(gc, "c" + format(i - 1, 0), "c" + format(i, 0)); }
    }
    addNode(gmo, "a", [px(xmo), -5]); addNode(gmo, "b", [px(xmo), -5 + sy * f(xmo)]); addEdge(gmo, "a", "b");
    addNode(gme, "a", [px(xme), -5]); addNode(gme, "b", [px(xme), -5 + sy * f(xme)]); addEdge(gme, "a", "b");
    addNode(gmn, "a", [px(xmn), -5]); addNode(gmn, "b", [px(xmn), -5 + sy * f(xmn)]); addEdge(gmn, "a", "b");
    float vr = (exp(sg * sg) - 1) * exp(2 * mu + sg * sg);
    info = "**Логнормальное распределение:** X = exp(Y), где Y = ln X имеет нормальное распределение N(μ; σ²), здесь μ = " + num(mu, 2) + ", σ = " + format(sg, 2) + ". Плотность f(x) = exp(−(ln x − μ)²/(2σ²)) / (xσ√(2π)) при x > 0 и 0 при x ≤ 0 (шкала по оси y подобрана по максимуму, линии сетки — через " + format(gstep, 1) + ").\n\n";
    info = info + "**Скошенность вправо:** мода exp(μ − σ²) = " + format(xmo, 3) + " < медиана exp(μ) = " + format(xme, 3) + " < математическое ожидание exp(μ + σ²/2) = " + format(xmn, 3) + ". Чем больше σ, тем тяжелее правый хвост.\n\n";
    info = info + "**Моменты конечны:** D[X] = (exp(σ²) − 1)·exp(2μ + σ²) = " + format(vr, 3) + ". График показан на [0; 10].";
    key = mu * 1000 + sg;
  }
}
]
