[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Вверху — плотность: 1/b на [a − b/2; a + b/2], иначе 0. Внизу — функция распределения F: линейна на носителе.
// Две точки на оси — левые концы двух подынтервалов одной длины w: их вероятности (заливка) равны, где бы они ни лежали
// в носителе. На графике F точки показывают F в концах — приращения одинаковы. ----
draw Graph { name = "gGr"; graph = "gg"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gF"; graph = "gf"; edgeWidth = 5; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gD"; graph = "gd"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gC"; graph = "gcd"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gM"; graph = "gm"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 10 }
new Point { name = "L0"; pos = (-9.8, 0.5); dynamic = false; collision = false; active = false }
new Point { name = "L1"; pos = (6.8, 0.5); dynamic = false; collision = false; active = false }
new Line { name = "ax"; pos = (L0, L1); thickness = 1; interact = false; layer = 4 }
new Point { name = "PU"; line = "ax"; t = 0.5; pauseOnDrag = false; collideWithPoints = false; color = #3b82f6; layer = 50 }
new Point { name = "PV"; line = "ax"; t = 0.72; pauseOnDrag = false; collideWithPoints = false; color = #f59e0b; layer = 50 }
draw Text { name = "t1"; pos = (aa - bb / 2, -0.3); text = num(aa - bb / 2, 1); size = 0.9 }
draw Text { name = "t2"; pos = (aa + bb / 2, -0.3); text = num(aa + bb / 2, 1); size = 0.9 }
draw Text { name = "tf"; pos = (-9.6, 5.6); text = "f(x)"; size = 1; align = left }
draw Text { name = "tF"; pos = (-9.6, -1.2); text = "F(x)"; size = 1; align = left }
draw Text { name = "t0"; pos = (-9.6, -5.5); text = "0"; size = 0.9; align = left }
draw Text { name = "t1b"; pos = (-9.6, -1.9); text = "1"; size = 0.9; align = left }

new UI { name = "sA"; type = slider; label = "a"; variable = aa; min = -4; max = 4; step = 0.1; default = 1 }
new UI { name = "sB"; type = slider; label = "b"; variable = bb; min = 2; max = min(12, 19 - 2 * abs(aa)); step = 0.1; default = 6 }
new UI { name = "sW"; type = slider; label = "w"; variable = ww; min = 0.5; max = 3; step = 0.1; default = 1.5 }

// ---- Логика ----
float aa = 1; float bb = 6; float ww = 1.5; string key = "";
string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function cdf(x) { return min(1, max(0, (x - aa + bb / 2) / bb)); }
Function fy(x) { return -5.8 + 4 * cdf(x); }
// длина пересечения [x; x + ww] с носителем
Function ov(x) { return max(0, min(x + ww, aa + bb / 2) - max(x, aa - bb / 2)); }

Update {
  float uu = PU.pos.x; float vv = PV.pos.x;
  string ky = format(aa, 1) + "|" + format(bb, 1) + "|" + format(ww, 1) + "|" + format(uu, 1) + "|" + format(vv, 1);
  if (key != ky) {
    gg = newGraph(); gd = newGraph(); gcd = newGraph(); gf = newGraph(); gm = newGraph(); gn = newGraph();
    float x1 = aa - bb / 2; float x2 = aa + bb / 2; float hh = 9 / bb;
    addNode(gd, "d1", [-10, 0.5]); addNode(gd, "d2", [x1, 0.5]); addNode(gd, "d3", [x1, 0.5 + hh]); addNode(gd, "d4", [x2, 0.5 + hh]); addNode(gd, "d5", [x2, 0.5]); addNode(gd, "d6", [10, 0.5]);
    addEdge(gd, "d1", "d2"); addEdge(gd, "d2", "d3"); addEdge(gd, "d3", "d4"); addEdge(gd, "d4", "d5"); addEdge(gd, "d5", "d6");
    addNode(gcd, "c1", [-10, -5.8]); addNode(gcd, "c2", [x1, -5.8]); addNode(gcd, "c3", [x2, -1.8]); addNode(gcd, "c4", [10, -1.8]);
    addEdge(gcd, "c1", "c2"); addEdge(gcd, "c2", "c3"); addEdge(gcd, "c3", "c4");
    addNode(gg, "g1", [-10, -1.8]); addNode(gg, "g2", [10, -1.8]); addEdge(gg, "g1", "g2");
    addNode(gg, "g3", [aa, -5.8]); addNode(gg, "g4", [aa, 0.5 + hh]); addEdge(gg, "g3", "g4");
    repeat (round(ww / 0.1) + 1) {
      float x = min(uu + 0.1 * i, uu + ww);
      if (x >= x1 && x <= x2) { addNode(gf, "u" + format(i, 0), [x, 0.5]); addNode(gf, "v" + format(i, 0), [x, 0.5 + hh]); addEdge(gf, "u" + format(i, 0), "v" + format(i, 0), 1, "#3b82f6"); }
      x = min(vv + 0.1 * i, vv + ww);
      if (x >= x1 && x <= x2) { addNode(gf, "p" + format(i, 0), [x, 0.5]); addNode(gf, "q" + format(i, 0), [x, 0.5 + hh]); addEdge(gf, "p" + format(i, 0), "q" + format(i, 0), 1, "#f59e0b"); }
    }
    addNode(gm, "m1", [uu, fy(uu)]); addNode(gm, "m2", [uu + ww, fy(uu + ww)]);
    addNode(gn, "n1", [vv, fy(vv)]); addNode(gn, "n2", [vv + ww, fy(vv + ww)]);
    info = "**Равномерное распределение** на отрезке [a − b/2; a + b/2] = [" + num(x1, 1) + "; " + num(x2, 1) + "]: a = " + num(aa, 1) + " — центр, b = " + format(bb, 1) + " — длина. Плотность f(x) = 1/b = " + format(1 / bb, 3) + " внутри и 0 вне отрезка; F(x) растёт линейно от 0 до 1 с этой скоростью.\n\n**E[X] = a = " + num(aa, 1) + "**, D[X] = b²/12 = " + format(bb * bb / 12, 3) + ", σ = " + format(bb / sqrt(12), 3) + ".\n\n**Подынтервалы длины w = " + format(ww, 1) + ":** синий [" + num(uu, 1) + "; " + num(uu + ww, 1) + "] — P = " + format(ov(uu) / bb, 4) + ", жёлтый [" + num(vv, 1) + "; " + num(vv + ww, 1) + "] — P = " + format(ov(vv) / bb, 4) + ".";
    if (abs(ov(uu) - ww) < 0.0001 && abs(ov(vv) - ww) < 0.0001) { info = info + " Оба целиком в носителе — вероятности равны w/b = F(x + w) − F(x) независимо от положения."; }
    if (abs(ov(uu) - ww) >= 0.0001 || abs(ov(vv) - ww) >= 0.0001) { info = info + " Часть отрезка вне носителя, где плотность нулевая, — вероятность считается только по части внутри."; }
    key = ky;
  }
}
]
