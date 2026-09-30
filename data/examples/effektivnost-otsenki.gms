[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;

// ---- 300 выборок объёма n из N(θ; 1), θ = 0. Две несмещённые оценки θ по каждой выборке:
// вверху — выборочное среднее X̄, внизу — выбранная оценка. Ступенчатые графики — распределения
// значений оценок (общий масштаб высоты); чем уже и выше пик, тем эффективнее оценка. ----
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f6; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gB"; graph = "gb"; edgeColor = #f59e0b; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gTh"; graph = "gth"; edgeColor = #22c55e; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Text { name = "lA"; pos = (-7.6, 4.6); text = "X̄: Var ≈ " + format(vA, 3); size = 0.95; align = left }
draw Text { name = "lB"; pos = (-7.6, -0.45); text = nameB() + ": Var ≈ " + format(vB, 3); size = 0.95; align = left }
draw Text { name = "t0"; pos = (0, -4.75); text = "θ"; size = 0.9; color = #22c55e }
draw Text { name = "t1"; pos = (-7.5, -4.75); text = "−2"; size = 0.9 }
draw Text { name = "t2"; pos = (7.5, -4.75); text = "2"; size = 0.9 }

new UI { name = "sE"; type = select; label = "сравнить X̄ с"; variable = est; options = ("med", "mid", "first"); labels = ("медианой", "полусуммой экстремумов (Xmin + Xmax)/2", "первым наблюдением X₁"); default = "med" }
new UI { name = "sN"; type = slider; label = "объём выборки n"; variable = n; min = 3; max = 25; step = 1; default = 9 }
new UI { name = "sS"; type = slider; label = "серия выборок"; variable = seed; min = 1; max = 30; step = 1; default = 1 }

string est = "med"; float n = 9; float seed = 1; float key = -1; string info = "";
float vA = 0; float vB = 0;
list cA = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
list cB = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

Function rnd(k) { float v = sin(k * 12.9898 + 4.1) * 43758.5453; return v - floor(v); }
Function nrm(k) { return sqrt(-2 * log(rnd(2 * k) + 0.000001)) * cos(2 * pi * rnd(2 * k + 1)); }
Function nameB() { if (est == "med") { return "медиана"; } if (est == "mid") { return "(Xmin + Xmax)/2"; } return "X₁"; }
Function bin(v) { return max(0, min(39, floor((v + 2) / 0.1))); }
Function stair(g, c, base, sc) {
  addNode(g, "s", [-7.5, base]);
  repeat (40) { float b = i; addNode(g, "u" + format(b, 0), [-7.5 + 0.375 * b, base + sc * c[b]]); addNode(g, "v" + format(b, 0), [-7.5 + 0.375 * (b + 1), base + sc * c[b]]); }
  addNode(g, "e", [7.5, base]);
}
Function stairEdges(g) {
  addEdge(g, "s", "u0");
  repeat (40) { float b = i; addEdge(g, "u" + format(b, 0), "v" + format(b, 0)); if (b < 39) { addEdge(g, "v" + format(b, 0), "u" + format(b + 1, 0)); } }
  addEdge(g, "v39", "e");
}

Update {
  float ke = 0; if (est == "mid") { ke = 1; } if (est == "first") { ke = 2; }
  if (key != (seed * 100 + n) * 4 + ke) {
    key = (seed * 100 + n) * 4 + ke;
    repeat (40) { cA[i] = 0; cB[i] = 0; }
    float sa = 0; float saa = 0; float sb = 0; float sbb = 0;
    repeat (300) {
      float s = i; list xs = [0];
      repeat (n - 1) { push(xs, 0); }
      float sm = 0;
      repeat (n) { float v = nrm(seed * 1000000 + s * 50 + i); xs[i] = v; sm = sm + v; }
      float a = sm / n; float b = xs[0];
      if (est == "med") { b = median(xs); }
      if (est == "mid") { b = (minOf(xs) + maxOf(xs)) / 2; }
      sa = sa + a; saa = saa + a * a; sb = sb + b; sbb = sbb + b * b;
      float ia = bin(a); float ib = bin(b);
      cA[ia] = cA[ia] + 1; cB[ib] = cB[ib] + 1;
    }
    vA = saa / 300 - (sa / 300) * (sa / 300); vB = sbb / 300 - (sb / 300) * (sb / 300);
    float mx = max(maxOf(cA), maxOf(cB));
    float sc = 3.7 / mx;
    ga = newGraph(); gb = newGraph(); gth = newGraph(); gax = newGraph();
    stair(ga, cA, 0.3, sc); stairEdges(ga);
    stair(gb, cB, -4.5, sc); stairEdges(gb);
    addNode(gth, "p", [0, -4.5]); addNode(gth, "q", [0, 4.2]); addEdge(gth, "p", "q");
    addNode(gax, "p", [-7.5, 0.3]); addNode(gax, "q", [7.5, 0.3]); addEdge(gax, "p", "q");
    addNode(gax, "r", [-7.5, -4.5]); addNode(gax, "s", [7.5, -4.5]); addEdge(gax, "r", "s");
  }
  info = "**Эффективность:** из двух оценок одного параметра с одинаковыми свойствами — здесь обе несмещённые — эффективнее та, у которой дисперсия меньше: её значения плотнее концентрируются вокруг θ. Параметр θ = 0 — математическое ожидание N(θ; 1), n = **" + format(n, 0) + "**.\n\n";
  info = info + "**Выборочное среднее:** Var X̄ = 1/n = **" + format(1 / n, 3) + "** — это нижняя граница Рао — Крамера для несмещённых оценок θ, так что X̄ эффективна; по 300 выборкам — **" + format(vA, 3) + "**.\n\n";
  info = info + "**" + nameB() + ":** по 300 выборкам Var ≈ **" + format(vB, 3) + "**, что в **" + format(vB / vA, 2) + "** раза больше. Эффективность относительно X̄ — **" + format(vA / vB, 2) + "**.";
}
]
