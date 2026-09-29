[
description = "{info}"

field width = 24;
field height = 14;
camera type = fixed;

// ---- Три окружности разных радиусов; S₁₂, S₁₃, S₂₃ — центры внешних гомотетий пар
// (пересечения общих внешних касательных). Теорема: они лежат на одной прямой. ----
new Point { name = "O1"; pos = (-3, -1); text = true("O₁"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "O2"; pos = (1, 2); text = true("O₂"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "O3"; pos = (6, -1); text = true("O₃"); pauseOnDrag = false; collideWithPoints = false }
new Circle { name = "w1"; center = O1; radius = r1; color = #3b82f6; thickness = 3 }
new Circle { name = "w2"; center = O2; radius = r2; color = #22c55e; thickness = 3 }
new Circle { name = "w3"; center = O3; radius = r3; color = #f59e0b; thickness = 3 }
draw Graph { name = "gT"; graph = "gt"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
draw Graph { name = "gM"; graph = "gm"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
new Point { name = "S12"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("S₁₂"); active = a12 > 0.5 }
new Point { name = "S13"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("S₁₃"); active = a13 > 0.5 }
new Point { name = "S23"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("S₂₃"); active = a23 > 0.5 }

new UI { type = slider; label = "радиус r₁"; variable = r1; min = 1; max = 4.5; step = 0.1; default = 1 }
new UI { type = slider; label = "радиус r₂"; variable = r2; min = 1; max = 4.5; step = 0.1; default = 2 }
new UI { type = slider; label = "радиус r₃"; variable = r3; min = 1; max = 4.5; step = 0.1; default = 4 }

float r1 = 1; float r2 = 2; float r3 = 4; float a12 = 0; float a13 = 0; float a23 = 0; string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function tang(ox, oy, r, mx, my, w) {
  float vx = mx - ox; float vy = my - oy; float d2 = vx * vx + vy * vy;
  float k = r * r / d2; float h = r * sqrt(max(d2 - r * r, 0)) / d2;
  if (w == 0) { return ox + k * vx - h * vy; }
  if (w == 1) { return oy + k * vy + h * vx; }
  if (w == 2) { return ox + k * vx + h * vy; }
  return oy + k * vy - h * vx;
}
Function hom(pa, ra, pb, rb) { return (rb * pa - ra * pb) / (rb - ra); }
Function pair(xa, ya, ra, xb, yb, rb, k) {
  float sx = hom(xa, ra, xb, rb); float sy = hom(ya, ra, yb, rb);
  float ox = xb; float oy = yb; float r = rb;
  if (ra > rb) { ox = xa; oy = ya; r = ra; }
  if ((sx - ox) * (sx - ox) + (sy - oy) * (sy - oy) < r * r + 0.05) { return 0; }
  addNode(gt, "s" + format(k, 0), [sx, sy]);
  addNode(gt, "a" + format(k, 0), [tang(ox, oy, r, sx, sy, 0), tang(ox, oy, r, sx, sy, 1)]);
  addNode(gt, "b" + format(k, 0), [tang(ox, oy, r, sx, sy, 2), tang(ox, oy, r, sx, sy, 3)]);
  addEdge(gt, "s" + format(k, 0), "a" + format(k, 0));
  addEdge(gt, "s" + format(k, 0), "b" + format(k, 0));
  return 0;
}
Function inF(x, y) { if (abs(x) < fieldMaxX && abs(y) < fieldMaxY) { return 1; } return 0; }
Function mline(ax, ay, bx, by) {
  float dx = bx - ax; float dy = by - ay; float l = sqrt(dx * dx + dy * dy);
  addNode(gm, "p", [ax - 80 * dx / l, ay - 80 * dy / l]);
  addNode(gm, "q", [ax + 80 * dx / l, ay + 80 * dy / l]);
  addEdge(gm, "p", "q");
  return 0;
}

Update {
  float x1 = O1.pos.x; float y1 = O1.pos.y; float x2 = O2.pos.x; float y2 = O2.pos.y; float x3 = O3.pos.x; float y3 = O3.pos.y;
  gt = newGraph(); gm = newGraph();
  float v12 = 0; float v13 = 0; float v23 = 0;
  if (abs(r1 - r2) > 0.05) { v12 = 1; float u = pair(x1, y1, r1, x2, y2, r2, 1); }
  if (abs(r1 - r3) > 0.05) { v13 = 1; float u = pair(x1, y1, r1, x3, y3, r3, 2); }
  if (abs(r2 - r3) > 0.05) { v23 = 1; float u = pair(x2, y2, r2, x3, y3, r3, 3); }
  float s12x = 0; float s12y = 0; float s13x = 0; float s13y = 0; float s23x = 0; float s23y = 0;
  if (v12 > 0.5) { s12x = hom(x1, r1, x2, r2); s12y = hom(y1, r1, y2, r2); }
  if (v13 > 0.5) { s13x = hom(x1, r1, x3, r3); s13y = hom(y1, r1, y3, r3); }
  if (v23 > 0.5) { s23x = hom(x2, r2, x3, r3); s23y = hom(y2, r2, y3, r3); }
  a12 = 0; a13 = 0; a23 = 0;
  if (v12 > 0.5 && inF(s12x, s12y) > 0.5) { a12 = 1; if (abs(S12.pos.x - s12x) + abs(S12.pos.y - s12y) > 0.000001) { S12.pos.x = s12x; S12.pos.y = s12y; } }
  if (v13 > 0.5 && inF(s13x, s13y) > 0.5) { a13 = 1; if (abs(S13.pos.x - s13x) + abs(S13.pos.y - s13y) > 0.000001) { S13.pos.x = s13x; S13.pos.y = s13y; } }
  if (v23 > 0.5 && inF(s23x, s23y) > 0.5) { a23 = 1; if (abs(S23.pos.x - s23x) + abs(S23.pos.y - s23y) > 0.000001) { S23.pos.x = s23x; S23.pos.y = s23y; } }
  float nv = v12 + v13 + v23;
  info = "**Центр внешней гомотетии** двух окружностей — точка S, в которой пересекаются их общие внешние касательные; она делит линию центров внешним образом в отношении радиусов: SO₁ : SO₂ = r₁ : r₂. Радиусы r₁ = " + format(r1, 1) + ", r₂ = " + format(r2, 1) + ", r₃ = " + format(r3, 1) + ".\n\n";
  if (nv > 2.5) {
    float dev = abs((s23x - s12x) * (s13y - s12y) - (s23y - s12y) * (s13x - s12x)) / sqrt((s13x - s12x) * (s13x - s12x) + (s13y - s12y) * (s13y - s12y));
    float u = mline(s12x, s12y, s13x, s13y);
    info = info + "**S₁₂, S₁₃, S₂₃ лежат на одной прямой** (прямая Монжа): расстояние от S₂₃ до прямой S₁₂S₁₃ равно " + format(dev, 3) + ".";
    if (a12 + a13 + a23 < 2.5) { info = info + " Часть точек лежит вне поля."; }
  } else if (nv > 1.5) {
    float u = 0;
    if (v12 > 0.5 && v13 > 0.5) { u = mline(s12x, s12y, s13x, s13y); }
    if (v12 > 0.5 && v23 > 0.5) { u = mline(s12x, s12y, s23x, s23y); }
    if (v13 > 0.5 && v23 > 0.5) { u = mline(s13x, s13y, s23x, s23y); }
    info = info + "**Два радиуса совпадают:** у этой пары внешние касательные параллельны, конечной точки внешней гомотетии нет (она уходит в бесконечность), и условие различности радиусов нарушено.";
  } else {
    info = info + "**Все радиусы почти равны:** внешние касательные попарно параллельны, конечных центров гомотетии нет.";
  }
}
]
