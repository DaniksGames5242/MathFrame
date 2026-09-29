[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Две окружности (O₁, r₁), (O₂, r₂) и точка M. Степень M относительно каждой: d² − r²;
// радикальная ось — множество точек с равными степенями (прямая ⟂ O₁O₂). ----
new Point { name = "O1"; pos = (-4, 0.5); text = true("O₁"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "O2"; pos = (4, -0.5); text = true("O₂"); pauseOnDrag = false; collideWithPoints = false }
new Circle { name = "w1"; center = O1; radius = r1; color = #3b82f6; thickness = 3 }
new Circle { name = "w2"; center = O2; radius = r2; color = #22c55e; thickness = 3 }
new Point { name = "M"; pos = (0.5, 3.5); text = true("M"); pauseOnDrag = false; collideWithPoints = false }
new Line { name = "oo"; pos = (O1, O2); interact = false; thickness = 1 }
new Line { name = "mo1"; pos = (M, O1); interact = false; thickness = 1; color = #3b82f6 }
new Line { name = "mo2"; pos = (M, O2); interact = false; thickness = 1; color = #22c55e }
draw Graph { name = "gAx"; graph = "ga"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false }

new UI { type = slider; label = "радиус r₁"; variable = r1; min = 1; max = 4.5; step = 0.1; default = 2.5 }
new UI { type = slider; label = "радиус r₂"; variable = r2; min = 1; max = 4.5; step = 0.1; default = 2 }

float r1 = 2.5; float r2 = 2; string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float dx = O2.pos.x - O1.pos.x; float dy = O2.pos.y - O1.pos.y;
  float d = sqrt(dx * dx + dy * dy);
  float ux = dx / d; float uy = dy / d;
  float a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  float hx = O1.pos.x + a * ux; float hy = O1.pos.y + a * uy;
  ga = newGraph();
  addNode(ga, "p", [hx - 40 * uy, hy + 40 * ux]);
  addNode(ga, "q", [hx + 40 * uy, hy - 40 * ux]);
  addEdge(ga, "p", "q");
  float e1 = (M.pos.x - O1.pos.x) * (M.pos.x - O1.pos.x) + (M.pos.y - O1.pos.y) * (M.pos.y - O1.pos.y);
  float e2 = (M.pos.x - O2.pos.x) * (M.pos.x - O2.pos.x) + (M.pos.y - O2.pos.y) * (M.pos.y - O2.pos.y);
  float p1 = e1 - r1 * r1; float p2 = e2 - r2 * r2;
  info = "**Степень точки M** относительно окружности (O, r): p = MO² − r².\n\n";
  info = info + "Относительно первой: p₁ = " + format(sqrt(e1), 2) + "² − " + format(r1, 1) + "² = " + num(p1, 2) + ". Относительно второй: p₂ = " + format(sqrt(e2), 2) + "² − " + format(r2, 1) + "² = " + num(p2, 2) + ".\n\n";
  if (abs(p1 - p2) < 0.05) {
    info = info + "**p₁ = p₂: M лежит на радикальной оси** — прямой, перпендикулярной O₁O₂; она делит линию центров на отрезки " + format(a, 2) + " и " + format(d - a, 2) + " от O₁ и O₂.";
  } else if (p1 > p2) {
    info = info + "**p₁ > p₂:** M по ту же сторону от радикальной оси, что и O₂ (p₁ − p₂ = " + format(p1 - p2, 2) + "). Равенство степеней достигается ровно на оси.";
  } else {
    info = info + "**p₁ < p₂:** M по ту же сторону от радикальной оси, что и O₁ (p₂ − p₁ = " + format(p2 - p1, 2) + "). Равенство степеней достигается ровно на оси.";
  }
}
]
