[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Гистограмма выборочных средних x̄ по 200 выборкам объёма n. Оранжевая линия — среднее совокупности μ,
// синяя — центр значений x̄. Их расстояние — систематическая составляющая, ширина гистограммы — случайная. ----
draw Graph { name = "gH"; graph = "gh"; edgeColor = #3b82f6; edgeWidth = 11; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gMu"; graph = "gmu"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gCm"; graph = "gcm"; edgeColor = #22c55e; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gCur"; graph = "gcur"; nodeColor = #22c55e; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 7 }
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "t1"; pos = (-9.6, 5.6); text = "средние 200 выборок"; size = 0.95; align = left }

new UI { name = "sN"; type = slider; label = "объём n"; variable = n; min = 2; max = 50; step = 1; default = 10 }
new UI { name = "sQ"; type = slider; label = "недоохват совокупности"; variable = q; min = 0; max = 0.6; step = 0.05; default = 0.2 }
new UI { name = "sS"; type = slider; label = "выборка №"; variable = sd; min = 1; max = 30; step = 1; default = 1 }

float n = 10; float q = 0.2; float sd = 1; float key = -1; string info = "";
list cn = [0];
float mu = 0; float cm = 0; float cur = 0; float sdm = 0;

Function rnd(k) { float s = sin(k * 12.9898 + 78.233) * 43758.5453; return s - floor(s); }
// значение единицы с «положением» u в списке: 2 + 16u² (мало малых значений, скошенное распределение)
Function xm(s) {
  float sum = 0;
  repeat (n) { float u = q + (1 - q) * rnd(s * 613 + i); sum = sum + 2 + 16 * u * u; }
  return sum / n;
}
Function px(v) { return (v - 9.5) * 1.03; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  if (key == -1) { repeat (59) { push(cn, 0); } }
  if (key != (n * 100 + q * 20) * 100 + sd) {
    gh = newGraph(); gmu = newGraph(); gcm = newGraph(); gcur = newGraph(); gx = newGraph();
    mu = 2 + 16 / 3;
    repeat (60) { cn[i] = 0; }
    float sm = 0; float s2 = 0; float mx = 1;
    repeat (200) {
      float v = xm(i + 1); sm = sm + v; s2 = s2 + v * v;
      float b = floor((v - 0.5) / 0.3); if (b < 0) { b = 0; } if (b > 59) { b = 59; }
      cn[b] = cn[b] + 1; mx = max(mx, cn[b]);
    }
    cm = sm / 200; sdm = sqrt(max(0, s2 / 200 - cm * cm));
    repeat (60) {
      if (cn[i] > 0) {
        float x = px(0.5 + 0.3 * i + 0.15);
        addNode(gh, "a" + format(i, 0), [x, -4.2]); addNode(gh, "b" + format(i, 0), [x, -4.2 + 8.5 * cn[i] / mx]); addEdge(gh, "a" + format(i, 0), "b" + format(i, 0));
      }
    }
    cur = xm(sd);
    addNode(gmu, "m1", [px(mu), -4.6]); addNode(gmu, "m2", [px(mu), 5.2]); addEdge(gmu, "m1", "m2");
    addNode(gcm, "c1", [px(cm), -4.6]); addNode(gcm, "c2", [px(cm), 4.4]); addEdge(gcm, "c1", "c2");
    addNode(gcur, "k", [px(cur), -5.2]);
    addNode(gx, "x1", [-9.8, -4.2]); addNode(gx, "x2", [9.8, -4.2]); addEdge(gx, "x1", "x2");
    key = (n * 100 + q * 20) * 100 + sd;
  }
  info = "**Ошибка выборки** — разность выборочной характеристики и параметра совокупности. Здесь x̄ − μ, где μ = **" + num(mu, 2) + "** (оранжевая линия); у выборки №" + format(sd, 0) + " (зелёная точка) x̄ = " + num(cur, 2) + ", ошибка **" + num(cur - mu, 2) + "**.\n\n";
  info = info + "**Случайная составляющая:** x̄ меняется от выборки к выборке, разброс 200 выборок " + num(sdm, 2) + " убывает с ростом n примерно как σ/√n.\n\n";
  info = info + "**Систематическая составляющая:** механизм отбора не достаёт часть совокупности (доля недоохвата " + format(q, 2) + ", самые малые значения), поэтому центр значений x̄ (зелёная линия, " + num(cm, 2) + ") смещён от μ на **" + num(cm - mu, 2) + "**. Увеличение n уменьшает первую составляющую, но не вторую.";
}
]
