[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Сверху — плотность величины Y = aX + c, её математическое ожидание (жёлтая точка) и интервал E ± σ.
// Снизу — график (y − E(Y))²·f(y): его площадь и есть дисперсия. ----
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gFill"; graph = "gfill"; edgeColor = #22c55e; edgeWidth = 6; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gMk"; graph = "gmk"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "lf"; pos = (-7.6, 4.5); text = "y = f(y)"; size = 1; align = left }
draw Text { name = "lg"; pos = (-7.6, -0.9); text = "y = (y − E)²·f(y)"; size = 1; align = left }
new Point { name = "Mn"; pos = (0, 0.9); text = true("E"); dynamic = false; collision = false; color = #f59e0b }

new UI { type = select; label = "распределение X"; variable = dist; options = ("mix", "exp", "uni", "norm"); labels = ("смесь двух нормальных", "показательное", "равномерное", "нормальное"); default = "mix" }
new UI { type = slider; label = "a"; variable = ka; min = 0.5; max = 1.5; step = 0.1; default = 1 }
new UI { type = slider; label = "c"; variable = kc; min = -2; max = 2; step = 0.1; default = 0 }

string dist = "mix"; string info = ""; float ka = 1; float kc = 0; float key = -1;
float mX = 0; float m2X = 0; float DX = 0; float sy = 1; float sg = 1; float kd = -1;

Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function gauss(x, m, s) { return exp(-(x - m) * (x - m) / (2 * s * s)) / (s * 2.5066282746); }
Function dens(x) {
  if (dist == "exp") { if (x < -1.05) { return 0; } return 1.2 * exp(-1.2 * (x + 1.05)); }
  if (dist == "uni") { if (x < -2.05 || x > 2.05) { return 0; } return 1 / 4.1; }
  if (dist == "norm") { return gauss(x, 0, 1.3); }
  return 0.6 * gauss(x, -1.2, 0.9) + 0.4 * gauss(x, 1.8, 0.7);
}
// плотность Y = aX + c
Function fy(y) { return dens((y - kc) / ka) / ka; }

Update {
  if (dist != kd) {
    mX = 0; m2X = 0;
    repeat (321) { float x = -8 + i * 0.05; mX = mX + 0.05 * x * dens(x); m2X = m2X + 0.05 * x * x * dens(x); }
    DX = m2X - mX * mX; kd = dist;
  }
  float EY = ka * mX + kc; float DY = ka * ka * DX; float sd = sqrt(DY);
  if (key != ka * 100 + kc * 10 + len(dist) * 1000 + DX) {
    float mx = 0; float mg = 0;
    repeat (161) { float y = -8 + i * 0.1; mx = max(mx, fy(y)); mg = max(mg, (y - EY) * (y - EY) * fy(y)); }
    sy = 3.2 / mx; sg = 1.7 / mg;
    gax = newGraph(); gd = newGraph(); gfill = newGraph();
    addNode(gax, "a", [-8, 0.9]); addNode(gax, "b", [8, 0.9]); addEdge(gax, "a", "b");
    addNode(gax, "c", [-8, -3.2]); addNode(gax, "d", [8, -3.2]); addEdge(gax, "c", "d");
    repeat (161) { float y = -8 + i * 0.1; addNode(gd, "p" + format(i, 0), [y, 0.9 + sy * fy(y)]); addNode(gd, "q" + format(i, 0), [y, -3.2 + sg * (y - EY) * (y - EY) * fy(y)]); }
    repeat (160) { addEdge(gd, "p" + format(i, 0), "p" + format(i + 1, 0)); addEdge(gd, "q" + format(i, 0), "q" + format(i + 1, 0)); }
    repeat (160) { float y = -7.95 + i * 0.1; addNode(gfill, "u" + format(i, 0), [y, -3.2]); addNode(gfill, "v" + format(i, 0), [y, -3.2 + sg * (y - EY) * (y - EY) * fy(y)]); addEdge(gfill, "u" + format(i, 0), "v" + format(i, 0)); }
    gmk = newGraph();
    addNode(gmk, "m", [EY, 0.9]); addNode(gmk, "n", [EY, 0.9 + sy * fy(EY)]); addEdge(gmk, "m", "n");
    addNode(gmk, "l", [EY - sd, 0.4]); addNode(gmk, "r", [EY + sd, 0.4]); addEdge(gmk, "l", "r", 1, "#22c55e");
    addNode(gmk, "lu", [EY - sd, 0.6]); addNode(gmk, "ld", [EY - sd, 0.2]); addEdge(gmk, "lu", "ld", 1, "#22c55e");
    addNode(gmk, "ru", [EY + sd, 0.6]); addNode(gmk, "rd", [EY + sd, 0.2]); addEdge(gmk, "ru", "rd", 1, "#22c55e");
    Mn.pos.x = EY; Mn.pos.y = 0.9;
    key = ka * 100 + kc * 10 + len(dist) * 1000 + DX;
  }
  info = "**Дисперсия непрерывной случайной величины** D(X) = E[(X − E(X))²] = ∫ (x − E(X))²·f(x) dx по (−∞; +∞): квадрат отклонения от центра, усреднённый с весом f. Она неотрицательна и равна E(X²) − (E(X))².\n\n";
  info = info + "Для X: E(X) = " + num(mX, 3) + ", E(X²) = " + num(m2X, 3) + ", D(X) = " + num(m2X, 3) + " − (" + num(mX, 3) + ")² = " + num(DX, 3) + ".\n\n";
  info = info + "Для Y = aX + c (a = " + num(ka, 1) + ", c = " + num(kc, 1) + "): E(Y) = " + num(EY, 3) + ", D(Y) = a²·D(X) = " + num(DY, 3) + ", σ(Y) = " + num(sd, 3) + " — зелёная площадь снизу. Сдвиг c дисперсию не меняет, растяжение в a раз меняет её в a² раз.";
}
]
