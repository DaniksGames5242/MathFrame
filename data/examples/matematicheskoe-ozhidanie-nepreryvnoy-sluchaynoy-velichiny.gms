[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Сверху — плотность f и математическое ожидание (жёлтая точка); точка t двигается по оси.
// Снизу — график x·f(x): его площадь со знаком (зелёная) и есть E(X). ----
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gFill"; graph = "gfill"; edgeColor = #22c55e; edgeWidth = 6; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gMk"; graph = "gmk"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "lf"; pos = (-7.6, 4.5); text = "y = f(x)"; size = 1; align = left }
draw Text { name = "lg"; pos = (-7.6, -0.9); text = "y = x·f(x)"; size = 1; align = left }
new Point { name = "T"; pos = (-3, 0.9); text = true("t"); pauseOnDrag = false; collision = false }
new Point { name = "Mn"; pos = (0, 0.9); text = true("E(X)"); dynamic = false; collision = false; color = #f59e0b }

new UI { type = select; label = "распределение"; variable = dist; options = ("mix", "exp", "uni", "norm"); labels = ("смесь двух нормальных", "показательное", "равномерное", "нормальное"); default = "mix" }

string dist = "mix"; string info = ""; float kd = -1; float Ex = 0; float sy = 6; float sg = 1; float Ep = 0; float En = 0;

Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function gauss(x, m, s) { return exp(-(x - m) * (x - m) / (2 * s * s)) / (s * 2.5066282746); }
Function dens(x) {
  if (dist == "exp") { if (x < -4.05) { return 0; } return 0.6 * exp(-0.6 * (x + 4.05)); }
  if (dist == "uni") { if (x < -3.05 || x > 4.05) { return 0; } return 1 / 7.1; }
  if (dist == "norm") { return gauss(x, 1.5, 1.3); }
  return 0.7 * gauss(x, -1, 1.2) + 0.3 * gauss(x, 2.5, 0.9);
}

Update {
  if (abs(T.pos.y - 0.9) > 0.0001) { T.pos.y = 0.9; }
  string dk = dist;
  if (dk != kd) {
    float mx = 0; float mg = 0; Ep = 0; En = 0;
    repeat (161) { float x = -8 + i * 0.1; mx = max(mx, dens(x)); mg = max(mg, abs(x) * dens(x)); if (x > 0) { Ep = Ep + 0.1 * x * dens(x); } else { En = En + 0.1 * x * dens(x); } }
    sy = 3.2 / mx; sg = 1.7 / mg; Ex = Ep + En;
    gax = newGraph(); gd = newGraph(); gfill = newGraph();
    addNode(gax, "a", [-8, 0.9]); addNode(gax, "b", [8, 0.9]); addEdge(gax, "a", "b");
    addNode(gax, "c", [-8, -3.2]); addNode(gax, "d", [8, -3.2]); addEdge(gax, "c", "d");
    repeat (161) { float x = -8 + i * 0.1; addNode(gd, "p" + format(i, 0), [x, 0.9 + sy * dens(x)]); addNode(gd, "q" + format(i, 0), [x, -3.2 + sg * x * dens(x)]); }
    repeat (160) { addEdge(gd, "p" + format(i, 0), "p" + format(i + 1, 0)); addEdge(gd, "q" + format(i, 0), "q" + format(i + 1, 0)); }
    repeat (160) { float x = -7.95 + i * 0.1; addNode(gfill, "u" + format(i, 0), [x, -3.2]); addNode(gfill, "v" + format(i, 0), [x, -3.2 + sg * x * dens(x)]); addEdge(gfill, "u" + format(i, 0), "v" + format(i, 0)); }
    Mn.pos.x = Ex; Mn.pos.y = 0.9;
    kd = dk;
  }
  gmk = newGraph();
  addNode(gmk, "m", [Ex, 0.9]); addNode(gmk, "n", [Ex, 0.9 + sy * dens(Ex)]); addEdge(gmk, "m", "n");
  float t = T.pos.x;
  addNode(gmk, "o", [t, 0.9]); addNode(gmk, "r", [t, 0.9 + sy * dens(t)]); addEdge(gmk, "o", "r");
  info = "**Математическое ожидание непрерывной случайной величины** с плотностью f — E(X) = ∫ x·f(x) dx по (−∞; +∞): каждое значение x входит с весом f(x), а сумма заменена интегралом. Это центр тяжести площади под графиком f.\n\n";
  info = info + "Здесь E(X) = " + num(Ex, 3) + " (площадь x·f(x) над осью " + num(Ep, 3) + ", под осью " + num(En, 3) + ").\n\n";
  info = info + "Для точки t = " + num(t, 2) + ": ∫ (x − t)·f(x) dx = E(X) − t = " + num(Ex - t, 3) + ". Этот «момент» обращается в нуль ровно при t = E(X) — там график f уравновешен.";
}
]
