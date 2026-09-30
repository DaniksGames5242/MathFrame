[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Неизвестный параметр θ — правая граница равномерного распределения на [0; θ] (оранжевая линия).
// Сверху — выборка x₁, …, xₙ и вычисленное по ней число θ̂ (синяя метка); внизу — значения θ̂ на 30 выборках. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gS"; graph = "gs"; nodeColor = #22c55e; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gE"; graph = "ge"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; nodeColor = #3b82f6; nodeRadius = 10; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gTh"; graph = "gth"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "t1"; pos = (-9.6, 5.5); text = "выборка и оценка"; size = 0.95; align = left }
draw Text { name = "t2"; pos = (-9.6, -0.2); text = "оценки по 30 выборкам"; size = 0.95; align = left }

new UI { name = "sK"; type = select; label = "оценка"; variable = kind; options = ("dbl", "max", "cor"); labels = ("2x̄", "xmax", "xmax·(n+1)/n"); default = "dbl" }
new UI { name = "sT"; type = slider; label = "параметр θ"; variable = th; min = 2; max = 7; step = 0.5; default = 5 }
new UI { name = "sN"; type = slider; label = "объём n"; variable = n; min = 2; max = 30; step = 1; default = 6 }
new UI { name = "sS"; type = slider; label = "выборка №"; variable = sd; min = 1; max = 30; step = 1; default = 1 }

string kind = "dbl"; float th = 5; float n = 6; float sd = 1;
float key = -1; string info = "";
float est = 0; float em = 0; float esd = 0;

Function rnd(k) { float s = sin(k * 12.9898 + 78.233) * 43758.5453; return s - floor(s); }
Function xv(s, j) { return th * rnd(s * 977 + j); }
Function px(v) { return -9.3 + 1.33 * v; }
Function T(s) {
  float sum = 0; float mx = 0;
  repeat (n) { float v = xv(s, i); sum = sum + v; mx = max(mx, v); }
  if (kind == "dbl") { return 2 * sum / n; }
  if (kind == "max") { return mx; }
  return mx * (n + 1) / n;
}
Function kc() { if (kind == "dbl") { return 0; } if (kind == "max") { return 1; } return 2; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  if (key != ((th * 10 + n) * 10 + kc()) * 100 + sd) {
    gx = newGraph(); gs = newGraph(); ge = newGraph(); gc = newGraph(); gth = newGraph();
    addNode(gx, "a1", [-9.3, 3.2]); addNode(gx, "a2", [px(14), 3.2]); addEdge(gx, "a1", "a2");
    addNode(gx, "b1", [-9.3, -3.4]); addNode(gx, "b2", [px(14), -3.4]); addEdge(gx, "b1", "b2");
    repeat (n) { addNode(gs, "s" + format(i, 0), [px(xv(sd, i)), 3.7]); }
    est = T(sd);
    addNode(gc, "c", [px(est), 2.6]);
    float sm = 0; float s2 = 0;
    repeat (30) {
      float v = T(i + 1); sm = sm + v; s2 = s2 + v * v;
      addNode(ge, "e" + format(i, 0), [px(v), -3.0 - 0.3 * (i - 4 * floor(i / 4))]);
    }
    em = sm / 30; esd = sqrt(max(0, s2 / 30 - em * em));
    addNode(gth, "t1", [px(th), 4.5]); addNode(gth, "t2", [px(th), -5.2]); addEdge(gth, "t1", "t2");
    key = ((th * 10 + n) * 10 + kc()) * 100 + sd;
  }
  string nm = "θ̂ = 2x̄";
  if (kind == "max") { nm = "θ̂ = xmax"; } if (kind == "cor") { nm = "θ̂ = xmax·(n + 1)/n"; }
  info = "**Точечная оценка** — число, вычисленное по выборке и принимаемое за приближение неизвестного параметра. Для равномерного распределения на [0; θ] с θ = " + format(th, 1) + " (оранжевая линия) взята оценка " + nm + ".\n\n";
  info = info + "По выборке №" + format(sd, 0) + " (n = " + format(n, 0) + ") получилось **θ̂ = " + num(est, 2) + "** — одно число, а не диапазон. На другой выборке число другое: оценка случайна. По 30 выборкам её среднее " + num(em, 2) + " (при θ = " + format(th, 1) + "), разброс " + num(esd, 2) + ".\n\n";
  info = info + "Формула оценки может быть любой функцией от выборки; разные формулы дают разные числа для одних и тех же данных.";
}
]
