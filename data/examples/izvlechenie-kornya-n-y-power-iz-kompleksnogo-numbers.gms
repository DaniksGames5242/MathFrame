[
description = "{info}"
field width = 12; field height = 7.5;
camera type = fixed;
show axes = true; show grid = true;
string info = ""; float n = 3; float rho = 1.5; float ph = 0.7; float px = 99; float py = 99; float pn = 0;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "w"; pos = (2.4, 1.3); text = true("w"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Circle { name = "cr"; center = O; radius = rho; interact = false }
new Line { name = "ow"; pos = (O, w); interact = false; color = #f59e0b; thickness = 3 }
draw Graph { name = "gpoly"; graph = "gs"; nodeRadius = 7; nodeColor = #3b82f6; edgeColor = #3b82f6; edgeWidth = 2; labels = false; interactive = false; showWeights = false }
draw Graph { name = "gfirst"; graph = "g0"; nodeRadius = 9; nodeColor = #22c55e; labels = false; interactive = false; showWeights = false }
new UI { name = "sn"; type = slider; label = "n"; variable = n; min = 1; max = 8; step = 1; default = 3 }

Function num(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Function term(v) { if (v < 0) { return " − " + format(-v, 2); } return " + " + format(v, 2); }

Update {
  float R = min(fieldMaxX, fieldMaxY);
  float q = hypot(w.pos.x, w.pos.y);
  if (q > R) { w.pos.x = w.pos.x * R / q; w.pos.y = w.pos.y * R / q; }
  if (q < 0.4) { if (q < 0.0001) { w.pos.x = 0.4; } else { w.pos.x = w.pos.x * 0.4 / q; w.pos.y = w.pos.y * 0.4 / q; } }
  if (abs(w.pos.x - px) > 0.00001 || abs(w.pos.y - py) > 0.00001 || n != pn) {
    px = w.pos.x; py = w.pos.y; pn = n;
    float m = hypot(px, py); ph = atan2(py, px);
    rho = pow(m, 1 / n);
    gs = newGraph(); g0 = newGraph();
    float k = 0;
    repeat (8) {
      if (k < n) {
        addNode(gs, "k" + format(k, 0), [rho * cos((ph + 6.283185307 * k) / n), rho * sin((ph + 6.283185307 * k) / n)]);
      }
      k = k + 1;
    }
    k = 0;
    repeat (8) {
      if (k < n && n > 1.5) {
        addEdge(gs, "k" + format(k, 0), "k" + format(k + 1 - n * floor((k + 1) / n), 0), 1);
      }
      k = k + 1;
    }
    addNode(g0, "k0", [rho * cos(ph / n), rho * sin(ph / n)]);
  }
  float m2 = hypot(px, py);
  info = "**Корень n-й степени** из w = " + num(px) + term(py) + "i: все z, для которых zⁿ = w. При w ≠ 0 их ровно n, и они лежат на окружности радиуса ⁿ√|w| в вершинах правильного n-угольника.\n\n";
  info = info + "|w| = " + format(m2, 2) + ", arg w = " + num(ph * 57.29578) + "°, n = " + format(n, 0) + ". Модуль корней ⁿ√|w| = " + format(rho, 2) + ", аргументы (arg w + 360°·k)/n = " + num(ph * 57.29578 / n) + "° + " + format(360 / n, 1) + "°·k, k = 0, …, " + format(n - 1, 0) + ".\n\n";
  info = info + "Зелёная точка — корень с k = 0: " + num(rho * cos(ph / n)) + term(rho * sin(ph / n)) + "i.";
}
]
