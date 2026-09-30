[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Синяя кривая — плотность Коши со сдвигом x₀ и масштабом γ, оранжевая — нормальная плотность
// N(x₀; γ²) с тем же центром и тем же «масштабом». Закрашены хвосты за пределами x₀ ± kγ. ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gTl"; graph = "gtl"; edgeColor = #3b82f644; edgeWidth = 4; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gNo"; graph = "gno"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gCu"; graph = "gcu"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gMk"; graph = "gmk"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "t1"; pos = (px(-10), -5.7); text = "−10"; size = 0.9 }
draw Text { name = "t2"; pos = (px(-5), -5.7); text = "−5"; size = 0.9 }
draw Text { name = "t3"; pos = (px(0), -5.7); text = "0"; size = 0.9 }
draw Text { name = "t4"; pos = (px(5), -5.7); text = "5"; size = 0.9 }
draw Text { name = "t5"; pos = (px(10), -5.7); text = "10"; size = 0.9 }
draw Text { name = "l1"; pos = (-9.6, 5.6); text = "Коши"; size = 0.9; align = left; color = #3b82f6 }
draw Text { name = "l2"; pos = (-9.6, 4.9); text = "нормальное, σ = γ"; size = 0.9; align = left; color = #f59e0b }

new UI { name = "sX"; type = slider; label = "x₀"; variable = x0; min = -3; max = 3; step = 0.1; default = 0 }
new UI { name = "sG"; type = slider; label = "γ"; variable = gm; min = 0.3; max = 3; step = 0.1; default = 1 }
new UI { name = "sK"; type = slider; label = "k"; variable = kk; min = 1; max = 8; step = 0.5; default = 3 }

// ---- Логика ----
float x0 = 0; float gm = 1; float kk = 3; float key = -1; string info = "";
Function px(u) { return 0.94 * u; }
Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function fc(x) { float z = (x - x0) / gm; return 1 / (3.14159265 * gm * (1 + z * z)); }
Function fn(x) { float z = (x - x0) / gm; return exp(-z * z / 2) / (gm * 2.5066283); }

Update {
  if (key != x0 * 10000 + gm * 100 + kk) {
    gg = newGraph(); gtl = newGraph(); gno = newGraph(); gcu = newGraph(); gmk = newGraph();
    float pmax = 0.4 / gm;
    float gstep = 0.1; if (pmax > 0.5) { gstep = 0.2; } if (pmax > 1) { gstep = 0.5; }
    float tp = gstep * ceil(pmax / gstep);
    float sy = 9 / tp;
    addNode(gg, "x1", [-9.4, -5]); addNode(gg, "x2", [9.4, -5]); addEdge(gg, "x1", "x2");
    repeat (round(tp / gstep)) {
      string s = format(i + 1, 0);
      addNode(gg, "l" + s, [-9.4, -5 + gstep * sy * (i + 1)]); addNode(gg, "r" + s, [9.4, -5 + gstep * sy * (i + 1)]); addEdge(gg, "l" + s, "r" + s);
    }
    repeat (201) {
      float xx = -10 + i * 0.1; string s = format(i, 0);
      addNode(gcu, "c" + s, [px(xx), -5 + sy * fc(xx)]);
      addNode(gno, "n" + s, [px(xx), -5 + sy * fn(xx)]);
      if (i > 0) { addEdge(gcu, "c" + format(i - 1, 0), "c" + s); addEdge(gno, "n" + format(i - 1, 0), "n" + s); }
      if (abs(xx - x0) > kk * gm) { addNode(gtl, "u" + s, [px(xx), -5]); addNode(gtl, "v" + s, [px(xx), -5 + sy * fc(xx)]); addEdge(gtl, "u" + s, "v" + s); }
    }
    addNode(gmk, "a1", [px(x0 - kk * gm), -5.2]); addNode(gmk, "a2", [px(x0 - kk * gm), -4.8]); addEdge(gmk, "a1", "a2");
    addNode(gmk, "b1", [px(x0 + kk * gm), -5.2]); addNode(gmk, "b2", [px(x0 + kk * gm), -4.8]); addEdge(gmk, "b1", "b2");
    float pc = 1 - 2 / 3.14159265 * atan(kk);
    float pn = 1 - erf(kk / 1.4142136);
    info = "**Распределение Коши** со сдвигом x₀ = " + num(x0, 1) + " и масштабом γ = " + format(gm, 1) + ": плотность f(x) = 1 / (πγ(1 + ((x − x₀)/γ)²)), функция распределения F(x) = 1/2 + arctg((x − x₀)/γ)/π. Плотность симметрична относительно x₀, это и мода, и медиана, но **не математическое ожидание**: интеграл от |x|·f(x) расходится, потому что хвосты убывают лишь как 1/x².\n\n";
    info = info + "**Тяжёлые хвосты.** P(|X − x₀| > " + format(kk, 1) + "γ) = 1 − (2/π)·arctg(" + format(kk, 1) + ") = " + format(pc, 4) + ", а для нормального закона с σ = γ вероятность была бы " + format(pn, 4) + " (в " + format(pc / max(pn, 0.0000001), 0) + " раз меньше). Половина вероятности лежит в [x₀ − γ; x₀ + γ]. График показан на [−10; 10].";
    key = x0 * 10000 + gm * 100 + kk;
  }
}
]
