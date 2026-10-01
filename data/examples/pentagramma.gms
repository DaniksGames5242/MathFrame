[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Пентаграмма {5/2}: пять вершин V₀…V₄ правильного пятиугольника с центром O, каждая соединена
// с вершиной через одну. Вершину V₀ можно перетаскивать: она задаёт радиус R и поворот фигуры.
// X₀…X₄ — точки самопересечения (вершины внутреннего пятиугольника): Xᵢ = ViVi+2 ∩ Vi+1Vi+3. ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "V0"; pos = (0, 5); text = true("V₀") }
new Circle { name = "cc"; center = O; radius = rr; thickness = 1 }
draw Graph { name = "gStar"; graph = "gst"; edgeWidth = 3; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gIn"; graph = "gin"; edgeWidth = 3; edgeColor = #f59e0b; nodeRadius = 3; nodeColor = #f59e0b; labels = false; interactive = false; showWeights = false; layer = 4 }

draw Graph { name = "gSeg"; graph = "gsg"; edgeWidth = 6; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
new Claster { name = "tabS"; elements = (gSeg); active = true }
draw Text { name = "t36"; pos = (t36x, t36y); text = "36°"; size = 0.9 }
draw Text { name = "t108"; pos = (t108x, t108y); text = "108°"; size = 0.9 }
new Claster { name = "tabA"; elements = (t36, t108); active = false }

new UI { name = "b1"; type = button; label = "Отрезки стороны"; action = "tab = 1; tabS.active = true; tabA.active = false" }
new UI { name = "b2"; type = button; label = "Углы и симметрия"; action = "tab = 2; tabS.active = false; tabA.active = true" }

float tab = 1; float rr = 5; float keyc = -1; string info = "";
float t36x = 0; float t36y = 0; float t108x = 0; float t108y = 0;
list wx = (0, 0, 0, 0, 0);
list wy = (0, 0, 0, 0, 0);
list ix = (0, 0, 0, 0, 0);
list iy = (0, 0, 0, 0, 0);

Function len(x1, y1, x2, y2) { return sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)); }
Function wrap(j) { if (j > 4) { return j - 5; } return j; }
// Пересечение прямых (a1 a2) и (b1 b2): w = 0 — абсцисса, 1 — ордината.
Function xs(ax, ay, bx, by, cx, cy, dx, dy, w) {
  float d1x = bx - ax; float d1y = by - ay; float d2x = dx - cx; float d2y = dy - cy;
  float t = ((cx - ax) * d2y - (cy - ay) * d2x) / (d1x * d2y - d1y * d2x);
  if (w < 0.5) { return ax + t * d1x; }
  return ay + t * d1y;
}
Function ang(px0, py0, ax, ay, bx, by) {
  float ux = ax - px0; float uy = ay - py0; float vx = bx - px0; float vy = by - py0;
  return acos((ux * vx + uy * vy) / (sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy))) * 180 / pi;
}

Update {
  // Радиус R = |OV₀| держим в пределах поля.
  float vx = V0.pos.x; float vy = V0.pos.y;
  float r0 = sqrt(vx * vx + vy * vy);
  float rmax = min(fieldMaxY, fieldMaxX) - 0.2;
  if (r0 < 2 || r0 > rmax) {
    float r1 = max(2, min(rmax, r0));
    if (r0 < 0.000001) { vx = 0; vy = r1; } else { vx = vx * r1 / r0; vy = vy * r1 / r0; }
    V0.pos.x = vx; V0.pos.y = vy; r0 = r1;
  }
  rr = r0;
  float phi = atan2(vy, vx);
  repeat (5) { wx[i] = rr * cos(phi + 2 * pi * i / 5); wy[i] = rr * sin(phi + 2 * pi * i / 5); }
  repeat (5) {
    float j1 = wrap(i + 1); float j2 = wrap(i + 2); float j3 = wrap(i + 3);
    ix[i] = xs(wx[i], wy[i], wx[j2], wy[j2], wx[j1], wy[j1], wx[j3], wy[j3], 0);
    iy[i] = xs(wx[i], wy[i], wx[j2], wy[j2], wx[j1], wy[j1], wx[j3], wy[j3], 1);
  }
  float kn = vx * 3 + vy * 7;
  if (abs(kn - keyc) > 0.000001) {
    gst = newGraph();
    repeat (5) { addNode(gst, "v" + i, [wx[i], wy[i]]); }
    repeat (5) { addEdge(gst, "v" + i, "v" + wrap(i + 2)); }
    gin = newGraph();
    repeat (5) { addNode(gin, "x" + i, [ix[i], iy[i]]); }
    repeat (5) { addEdge(gin, "x" + i, "x" + wrap(i + 1)); }
    // Сторона V₀V₂ по порядку: V₀ — X₄ — X₀ — V₂.
    gsg = newGraph();
    addNode(gsg, "p0", [wx[0], wy[0]]); addNode(gsg, "p1", [ix[4], iy[4]]);
    addNode(gsg, "p2", [ix[0], iy[0]]); addNode(gsg, "p3", [wx[2], wy[2]]);
    addEdge(gsg, "p0", "p1", 1, "#3b82f6"); addEdge(gsg, "p1", "p2", 1, "#f59e0b"); addEdge(gsg, "p2", "p3", 1, "#3b82f6");
    keyc = kn;
  }
  float a = len(wx[0], wy[0], wx[2], wy[2]);
  float b = len(wx[0], wy[0], ix[4], iy[4]);
  float c = len(ix[4], iy[4], ix[0], iy[0]);
  float s = len(wx[0], wy[0], wx[1], wy[1]);
  info = "**Пентаграмма {5/2}:** вершины правильного пятиугольника (R = " + format(rr, 2) + "), соединённые через одну; сторона V₀V₂ = " + format(a, 2) + ". Пять точек пересечения сторон образуют внутренний правильный пятиугольник (жёлтый), его сторона " + format(c, 2) + ".\n\n**Три части стороны V₀V₂:** крайние (синие) по " + format(b, 2) + ", средняя (жёлтая) " + format(c, 2) + ". Крайняя к средней: " + format(b / c, 4) + " — золотое сечение (1 + √5)/2 = 1,6180. Сторона внешнего пятиугольника к стороне внутреннего: " + format(s / c, 3) + ".";
  if (tab == 2) {
    float tip = ang(wx[0], wy[0], wx[2], wy[2], wx[3], wy[3]);
    float inn = ang(ix[0], iy[0], ix[4], iy[4], ix[1], iy[1]);
    t36x = wx[0] * 0.82; t36y = wy[0] * 0.82;
    t108x = ix[0] * 0.62; t108y = iy[0] * 0.62;
    info = "**Углы:** при вершине пентаграммы " + format(tip, 1) + "° = 180°·(n − 2k)/n при n = 5, k = 2; угол внутреннего пятиугольника при точке самопересечения " + format(inn, 1) + "°.\n\n**Симметрия:** повороты на 72° переводят пентаграмму в себя, вершины идут по кругу V₀ → V₂ → V₄ → V₁ → V₃ → V₀; пять осей отражения, порядок группы симметрии 10.\n\nЦентральный угол стороны 2π·2/5 = 144°.";
  }
}
]
