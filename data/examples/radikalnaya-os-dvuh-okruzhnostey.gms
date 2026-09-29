[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Две окружности и их радикальная ось: точка M скользит по оси, степени p₁ = p₂. ----
new Point { name = "O1"; pos = (-4.5, 0.5); text = true("O₁"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "O2"; pos = (3.5, -0.5); text = true("O₂"); pauseOnDrag = false; collideWithPoints = false }
new Circle { name = "w1"; center = O1; radius = r1; color = #3b82f6; thickness = 3 }
new Circle { name = "w2"; center = O2; radius = r2; color = #22c55e; thickness = 3 }
draw Graph { name = "gAx"; graph = "ga"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
new Line { name = "oo"; pos = (O1, O2); interact = false; thickness = 1 }
new Point { name = "M"; pos = (0, 3); text = true("M"); pauseOnDrag = false; collideWithPoints = false; active = mact > 0.5 }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; text = true("T₁"); active = act > 0.5 }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; text = true("T₂"); active = act > 0.5 }
new Point { name = "X"; pos = (0, 0); dynamic = false; collision = false; text = true("X"); active = xact > 0.5 }
new Point { name = "Y"; pos = (0, 0); dynamic = false; collision = false; text = true("Y"); active = xact > 0.5 }
new Line { name = "mt1"; pos = (M, T1); color = #3b82f6; thickness = 2; interact = false; active = act > 0.5 }
new Line { name = "mt2"; pos = (M, T2); color = #22c55e; thickness = 2; interact = false; active = act > 0.5 }

new UI { type = slider; label = "радиус r₁"; variable = r1; min = 1; max = 4.5; step = 0.1; default = 2.5 }
new UI { type = slider; label = "радиус r₂"; variable = r2; min = 1; max = 4.5; step = 0.1; default = 2 }

float r1 = 2.5; float r2 = 2; float act = 0; float mact = 1; float xact = 0; string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function tang(ox, oy, r, mx, my, sg) {
  float vx = mx - ox; float vy = my - oy; float d2 = vx * vx + vy * vy;
  float k = r * r / d2; float h = r * sqrt(max(d2 - r * r, 0)) / d2;
  return sg > 0 ? ox + k * vx - h * vy : oy + k * vy + h * vx;
}

Update {
  float dx = O2.pos.x - O1.pos.x; float dy = O2.pos.y - O1.pos.y;
  float d = sqrt(dx * dx + dy * dy);
  float ux = dx / d; float uy = dy / d; float nx = -uy; float ny = ux;
  float a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  float hx = O1.pos.x + a * ux; float hy = O1.pos.y + a * uy;
  ga = newGraph();
  addNode(ga, "p", [hx - 40 * nx, hy - 40 * ny]);
  addNode(ga, "q", [hx + 40 * nx, hy + 40 * ny]);
  addEdge(ga, "p", "q");
  float lo = -1000; float hi = 1000;
  if (abs(nx) > 0.000001) { lo = max(lo, min((-fieldMaxX - hx) / nx, (fieldMaxX - hx) / nx)); hi = min(hi, max((-fieldMaxX - hx) / nx, (fieldMaxX - hx) / nx)); }
  if (abs(ny) > 0.000001) { lo = max(lo, min((-fieldMaxY - hy) / ny, (fieldMaxY - hy) / ny)); hi = min(hi, max((-fieldMaxY - hy) / ny, (fieldMaxY - hy) / ny)); }
  mact = 0;
  if (lo < hi) {
    mact = 1;
    float s = (M.pos.x - hx) * nx + (M.pos.y - hy) * ny;
    s = max(lo, min(hi, s));
    if (abs(M.pos.x - hx - s * nx) + abs(M.pos.y - hy - s * ny) > 0.000001) { M.pos.x = hx + s * nx; M.pos.y = hy + s * ny; }
  }
  float e1 = (M.pos.x - O1.pos.x) * (M.pos.x - O1.pos.x) + (M.pos.y - O1.pos.y) * (M.pos.y - O1.pos.y);
  float pw = e1 - r1 * r1;
  act = 0;
  if (mact > 0.5 && pw > 0.02) {
    act = 1;
    T1.pos.x = tang(O1.pos.x, O1.pos.y, r1, M.pos.x, M.pos.y, 1); T1.pos.y = tang(O1.pos.x, O1.pos.y, r1, M.pos.x, M.pos.y, 0);
    T2.pos.x = tang(O2.pos.x, O2.pos.y, r2, M.pos.x, M.pos.y, 1); T2.pos.y = tang(O2.pos.x, O2.pos.y, r2, M.pos.x, M.pos.y, 0);
  }
  xact = 0;
  float h2 = r1 * r1 - a * a;
  if (h2 > 0.01) {
    xact = 1;
    float hh = sqrt(h2);
    X.pos.x = hx + hh * nx; X.pos.y = hy + hh * ny; Y.pos.x = hx - hh * nx; Y.pos.y = hy - hh * ny;
  }
  info = "**Радикальная ось** двух окружностей — множество точек с равными степенями: p₁ = MO₁² − r₁² = p₂ = MO₂² − r₂². Разность p₁ − p₂ линейна по координатам M, поэтому это прямая, перпендикулярная линии центров O₁O₂ (расстояние между центрами " + format(d, 2) + ", ось проходит на расстоянии " + num(a, 2) + " от O₁ вдоль O₁O₂).\n\n";
  if (mact > 0.5) {
    float e2 = (M.pos.x - O2.pos.x) * (M.pos.x - O2.pos.x) + (M.pos.y - O2.pos.y) * (M.pos.y - O2.pos.y);
    info = info + "Для точки M на оси: p₁ = " + num(pw, 2) + ", p₂ = " + num(e2 - r2 * r2, 2) + ".";
    if (act > 0.5) { info = info + " Касательные из M к окружностям равны: MT₁ = MT₂ = √p = " + format(sqrt(pw), 2) + "."; }
    info = info + "\n\n";
  } else {
    info = info + "Радикальная ось проходит вне поля.\n\n";
  }
  if (xact > 0.5) {
    info = info + "**Окружности пересекаются** — ось проходит через общие точки X и Y: их степени нулевые, XY = " + format(2 * sqrt(h2), 2) + ".";
  } else if (d < abs(r1 - r2) - 0.01) {
    info = info + "**Одна окружность внутри другой:** общих точек нет, ось всё равно существует.";
  } else if (d > r1 + r2 + 0.01) {
    info = info + "**Окружности не пересекаются:** ось лежит между ними и не имеет с ними общих точек.";
  } else {
    info = info + "**Окружности почти касаются:** ось проходит через точку касания.";
  }
}
]
