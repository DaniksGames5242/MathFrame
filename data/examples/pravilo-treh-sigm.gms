[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// Плотность N(μ; σ²); столбики — доли массы в полосах |x − μ| ≤ σ, ≤ 2σ, ≤ 3σ.
float mu = 0; float sg = 1; float key = -1;
float y0 = -4.3; float ky = 16;
string info = "";

func dens(x) = y0 + ky * exp(-((x - mu) / sg) * ((x - mu) / sg) / 2) / (sg * sqrt(2 * pi));
draw Function { name = "gauss"; f = "dens"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "m3"; pos = (mu - 3 * sg, y0 - 1.3); text = "−3σ"; size = 0.8; color = #f59e0b }
draw Text { name = "m2"; pos = (mu - 2 * sg, y0 - 1.3); text = "−2σ"; size = 0.8; color = #22c55e }
draw Text { name = "m1"; pos = (mu - sg, y0 - 1.3); text = "−σ"; size = 0.8; color = #3b82f6 }
draw Text { name = "m0"; pos = (mu, y0 - 1.3); text = "μ"; size = 0.9 }
draw Text { name = "p1"; pos = (mu + sg, y0 - 1.3); text = "+σ"; size = 0.8; color = #3b82f6 }
draw Text { name = "p2"; pos = (mu + 2 * sg, y0 - 1.3); text = "+2σ"; size = 0.8; color = #22c55e }
draw Text { name = "p3"; pos = (mu + 3 * sg, y0 - 1.3); text = "+3σ"; size = 0.8; color = #f59e0b }
draw Text { name = "x8"; pos = (-8, y0 - 0.55); text = "−8"; size = 0.7 }
draw Text { name = "x4"; pos = (-4, y0 - 0.55); text = "−4"; size = 0.7 }
draw Text { name = "x0"; pos = (0, y0 - 0.55); text = "0"; size = 0.7 }
draw Text { name = "y4"; pos = (4, y0 - 0.55); text = "4"; size = 0.7 }
draw Text { name = "y8"; pos = (8, y0 - 0.55); text = "8"; size = 0.7 }

new UI { type = slider; label = "μ (сдвиг)"; variable = mu; min = -3; max = 3; step = 0.1; default = 0 }
new UI { type = slider; label = "σ (масштаб)"; variable = sg; min = 0.7; max = 2; step = 0.1; default = 1 }

Function num(x, d) { if (x < -0.00001) { return "−" + format(-x, d); } return format(abs(x), d); }
Update {
  if (key != mu * 1000 + sg) {
    gb = newGraph(); ga = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (13) {
      float tx = -9 + 1.5 * i;
      addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0));
    }
    repeat (199) {
      float x = -9.9 + 0.1 * i; float z = abs(x - mu) / sg;
      if (z <= 3) {
        string c = "#f59e0b"; if (z <= 2) { c = "#22c55e"; } if (z <= 1) { c = "#3b82f6"; }
        string id = format(i, 0);
        addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, y0 + ky * normalPdf(x, mu, sg)]); addEdge(gb, "a" + id, "b" + id, 1, c);
      }
    }
    key = mu * 1000 + sg;
  }
  float p1 = erf(1 / sqrt(2)); float p2 = erf(2 / sqrt(2)); float p3 = erf(3 / sqrt(2));
  info = "**Правило трёх сигм.** Для нормального распределения N(μ; σ²) с μ = **" + num(mu, 1) + "**, σ = **" + format(sg, 1) + "** вероятность попасть в отрезок [μ − kσ; μ + kσ] равна erf(k/√2) и от μ и σ не зависит.\n\n";
  info = info + "**k = 1:** [" + num(mu - sg, 1) + "; " + num(mu + sg, 1) + "], P ≈ **" + format(p1, 4) + "** (синий).\n\n";
  info = info + "**k = 2:** [" + num(mu - 2 * sg, 1) + "; " + num(mu + 2 * sg, 1) + "], P ≈ **" + format(p2, 4) + "** (зелёный).\n\n";
  info = info + "**k = 3:** [" + num(mu - 3 * sg, 1) + "; " + num(mu + 3 * sg, 1) + "], P ≈ **" + format(p3, 4) + "** > 0,997 (жёлтый). Вне этого отрезка остаётся лишь " + format(1 - p3, 4) + " массы — хвосты гауссианы убывают экспоненциально.";
}
]
