[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Пучок: ось x — линия центров, ось пучка — вертикаль x = 0. Центр (s; 0), r² = s² − c:
// степень любой точки оси одна и та же для всех окружностей, c — степень начала координат. ----
draw Graph { name = "gAx"; graph = "ga"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
new Point { name = "K1"; pos = (-7, 0); dynamic = false; collision = false; active = false }
new Point { name = "K2"; pos = (-4.5, 0); dynamic = false; collision = false; active = false }
new Point { name = "K3"; pos = (-2.5, 0); dynamic = false; collision = false; active = false }
new Point { name = "K4"; pos = (2.5, 0); dynamic = false; collision = false; active = false }
new Point { name = "K5"; pos = (4.5, 0); dynamic = false; collision = false; active = false }
new Point { name = "K6"; pos = (7, 0); dynamic = false; collision = false; active = false }
new Circle { name = "k1"; center = K1; radius = q1; thickness = 1.5; active = c1 > 0.5 }
new Circle { name = "k2"; center = K2; radius = q2; thickness = 1.5; active = c2 > 0.5 }
new Circle { name = "k3"; center = K3; radius = q3; thickness = 1.5; active = c3 > 0.5 }
new Circle { name = "k4"; center = K4; radius = q4; thickness = 1.5; active = c4 > 0.5 }
new Circle { name = "k5"; center = K5; radius = q5; thickness = 1.5; active = c5 > 0.5 }
new Circle { name = "k6"; center = K6; radius = q6; thickness = 1.5; active = c6 > 0.5 }
new Point { name = "C"; pos = (-3, 0); text = true("C"); pauseOnDrag = false; collideWithPoints = false }
new Circle { name = "wc"; center = C; radius = rc; color = #3b82f6; thickness = 3.5 }
new Point { name = "X"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #22c55e; text = true("X"); active = kind < 0 }
new Point { name = "Y"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #22c55e; text = true("Y"); active = kind < 0 }
new Point { name = "T"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #22c55e; text = true("T"); active = kind == 0 }
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #22c55e; text = true("L₁"); active = kind > 0 }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #22c55e; text = true("L₂"); active = kind > 0 }
new Line { name = "cl"; pos = (K1, K6); interact = false; thickness = 1; layer = 1 }

new UI { type = slider; label = "степень c оси"; variable = cc; min = -12; max = 12; step = 0.5; default = -6 }

float cc = -6; float kind = -1; float rc = 3; string info = "";
float q1 = 1; float q2 = 1; float q3 = 1; float q4 = 1; float q5 = 1; float q6 = 1;
float c1 = 1; float c2 = 1; float c3 = 1; float c4 = 1; float c5 = 1; float c6 = 1;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function rad(s, c) { return sqrt(max(s * s - c, 0.0001)); }
Function ok(s, c) { if (c > 0 && abs(s) < sqrt(c) + 0.2) { return 0; } return 1; }

Update {
  ga = newGraph(); addNode(ga, "p", [0, -40]); addNode(ga, "q", [0, 40]); addEdge(ga, "p", "q");
  kind = -1;
  if (abs(cc) < 0.01) { kind = 0; }
  if (cc > 0.01) { kind = 1; }
  float lim = 0;
  if (cc > 0) { lim = sqrt(cc) + 0.3; }
  float s = C.pos.x;
  if (abs(s) < lim) { if (s < 0) { s = -lim; } else { s = lim; } }
  if (abs(C.pos.y) + abs(C.pos.x - s) > 0.000001) { C.pos.x = s; C.pos.y = 0; }
  rc = rad(s, cc);
  q1 = rad(-7, cc); q2 = rad(-4.5, cc); q3 = rad(-2.5, cc); q4 = rad(2.5, cc); q5 = rad(4.5, cc); q6 = rad(7, cc);
  c1 = ok(-7, cc); c2 = ok(-4.5, cc); c3 = ok(-2.5, cc); c4 = ok(2.5, cc); c5 = ok(4.5, cc); c6 = ok(7, cc);
  if (cc < -0.01) { X.pos.y = sqrt(-cc); Y.pos.y = -sqrt(-cc); X.pos.x = 0; Y.pos.x = 0; }
  if (cc > 0.01) { L1.pos.x = sqrt(cc); L2.pos.x = -sqrt(cc); L1.pos.y = 0; L2.pos.y = 0; }
  info = "**Пучок окружностей** — семейство окружностей с общей радикальной осью (оранжевая прямая); центры лежат на одной прямой, перпендикулярной оси. У выбранной окружности центр C = (" + num(s, 2) + "; 0), радиус r = " + format(rc, 2) + ", и степень начала координат (точки оси) относительно неё p = s² − r² = " + num(cc, 1) + " — одна и та же для всех окружностей пучка.\n\n";
  if (cc < -0.01) {
    info = info + "**Эллиптический пучок (c < 0):** все окружности проходят через две неподвижные точки X и Y оси, XY = " + format(2 * sqrt(-cc), 2) + ".";
  } else if (cc <= 0.01) {
    info = info + "**Параболический пучок (c = 0):** все окружности касаются оси в одной точке T.";
  } else {
    info = info + "**Гиперболический пучок (c > 0):** окружности не пересекаются и не имеют общих точек с осью; окружности-точки L₁ и L₂ (предельные точки) на линии центров при x = ±" + format(sqrt(cc), 2) + " — тоже члены пучка; они лежат по разные стороны оси, и каждая окружность пучка охватывает ровно одну из них.";
  }
}
]
