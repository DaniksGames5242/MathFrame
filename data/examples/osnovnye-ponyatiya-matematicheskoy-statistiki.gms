[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Синяя кривая — распределение признака в генеральной совокупности N(θ, σ²); точки на оси — выборка;
// зелёная точка — статистика x̄. Оранжевая кривая — член статистической модели {N(t, σ²)}; его параметр t задаёт
// перетаскиваемая оранжевая точка. ----
func dens(x) = -4.5 + 20 * exp(-(x - th) * (x - th) / (2 * sg * sg)) / (sg * 2.5066);
func cand(x) = -4.5 + 20 * exp(-(x - tt) * (x - tt) / (2 * sg * sg)) / (sg * 2.5066);
draw Function { name = "fp"; f = "dens"; xmin = -10; xmax = 10; color = #3b82f6; thickness = 3 }
draw Function { name = "fc"; f = "cand"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gS"; graph = "gs"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 6 }

new Point { name = "XB"; pos = (0, -4.5); dynamic = false; collision = false; color = #22c55e; text = true("x̄") }
new Point { name = "T"; pos = (-3, -4.5); pauseOnDrag = false; collision = false; color = #f59e0b; text = true("t") }

new UI { name = "sT"; type = slider; label = "θ"; variable = th; min = -4; max = 4; step = 0.1; default = 1 }
new UI { name = "sG"; type = slider; label = "σ"; variable = sg; min = 0.8; max = 2; step = 0.1; default = 1.2 }
new UI { name = "sN"; type = slider; label = "объём n"; variable = n; min = 1; max = 60; step = 1; default = 25 }
new UI { name = "bR"; type = button; label = "Новая выборка"; action = "seed = seed + 1" }

// ---- Логика ----
float th = 1; float sg = 1.2; float n = 25; float seed = 1; float sd = 0; float init = 0; float key = -1; float tt = -3;
list z = [0]; list cn = [0]; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function xv(k) { return max(-9.6, min(9.6, th + sg * z[k])); }

Update {
  if (init == 0) { repeat (59) { push(z, 0); } repeat (49) { push(cn, 0); } gx = newGraph(); addNode(gx, "a", [-10, -4.5]); addNode(gx, "b", [10, -4.5]); addEdge(gx, "a", "b"); init = 1; }
  if (sd != seed) { sd = seed; repeat (60) { z[i] = randomNormal(0, 1); } key = -1; }
  if (abs(T.pos.y + 4.5) > 0.0001) { T.pos.y = -4.5; }
  tt = T.pos.x;
  float ml = 0; repeat (n) { ml = ml + xv(i); } ml = ml / n;
  if (key != n * 1000000 + th * 1000 + sg * 10 + seed * 0.001) {
    key = n * 1000000 + th * 1000 + sg * 10 + seed * 0.001;
    gs = newGraph(); repeat (49) { cn[i] = 0; }
    repeat (n) { float b = floor((xv(i) + 10) / 0.4); string k = format(i, 0); addNode(gs, k, [xv(i), -4.5 + 0.3 + 0.34 * cn[b]]); cn[b] = cn[b] + 1; }
    XB.pos.x = ml;
  }
  float ss = 0; float st = 0; repeat (n) { ss = ss + (xv(i) - ml) * (xv(i) - ml); st = st + (xv(i) - tt) * (xv(i) - tt); }
  float c0 = -n / 2 * log(6.2831853 * sg * sg);
  float lt = c0 - st / (2 * sg * sg); float lm = c0 - ss / (2 * sg * sg);
  info = "**Генеральная совокупность** — распределение признака; здесь N(θ, σ²) с θ = " + num(th, 1) + ", σ = " + format(sg, 1) + " (синяя кривая). **Выборка** — n = " + format(n, 0) + " наблюдений x₁, …, xₙ, реализация независимых величин с этим распределением (точки).\n\n";
  info = info + "**Статистика** — функция выборки, не зависящая от неизвестных параметров: выборочное среднее x̄ = " + num(ml, 2) + ", s² = " + format(ss / max(n - 1, 1), 2) + " (зелёная точка — x̄). Она случайна: новая выборка даёт другое значение.\n\n";
  info = info + "**Статистическая модель** — семейство распределений {N(t, σ²)}, из которого выбирается порождающее данные; оранжевая кривая — член семейства с t = " + num(tt, 2) + ". Логарифм правдоподобия ℓ(t) = " + num(lt, 2) + "; он наибольший при t = x̄, где ℓ(x̄) = " + num(lm, 2) + ". Оценка θ̂ = x̄ отличается от неизвестного θ на " + format(abs(ml - th), 2) + ".";
}
]
