[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Три окружности: три попарные радикальные оси пересекаются в одной точке Z. ----
new Point { name = "O1"; pos = (-5, 1.5); text = true("O₁"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "O2"; pos = (4.5, 2.5); text = true("O₂"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "O3"; pos = (-0.5, -3.5); text = true("O₃"); pauseOnDrag = false; collideWithPoints = false }
new Circle { name = "w1"; center = O1; radius = r1; color = #3b82f6; thickness = 3 }
new Circle { name = "w2"; center = O2; radius = r2; color = #22c55e; thickness = 3 }
new Circle { name = "w3"; center = O3; radius = r3; color = #f59e0b; thickness = 3 }
draw Graph { name = "gAx"; graph = "ga"; nodeRadius = 0; edgeWidth = 1.5; labels = false; interactive = false; showWeights = false }
new Point { name = "Z"; pos = (0, 0); dynamic = false; collision = false; text = true("Z"); active = zact > 0.5 }
new Circle { name = "wz"; center = Z; radius = rz; thickness = 1.5; active = oact > 0.5 }

new UI { type = slider; label = "радиус r₁"; variable = r1; min = 1; max = 4; step = 0.1; default = 2.5 }
new UI { type = slider; label = "радиус r₂"; variable = r2; min = 1; max = 4; step = 0.1; default = 2 }
new UI { type = slider; label = "радиус r₃"; variable = r3; min = 1; max = 4; step = 0.1; default = 1.5 }

float r1 = 2.5; float r2 = 2; float r3 = 1.5; float rz = 1; float zact = 0; float oact = 0; string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function axis(xa, ya, ra, xb, yb, rb, k) {
  float dx = xb - xa; float dy = yb - ya; float d = sqrt(dx * dx + dy * dy);
  float a = (d * d + ra * ra - rb * rb) / (2 * d);
  float hx = xa + a * dx / d; float hy = ya + a * dy / d;
  addNode(ga, "p" + format(k, 0), [hx + 60 * dy / d, hy - 60 * dx / d]);
  addNode(ga, "q" + format(k, 0), [hx - 60 * dy / d, hy + 60 * dx / d]);
  addEdge(ga, "p" + format(k, 0), "q" + format(k, 0));
  return 0;
}

Update {
  float x1 = O1.pos.x; float y1 = O1.pos.y; float x2 = O2.pos.x; float y2 = O2.pos.y; float x3 = O3.pos.x; float y3 = O3.pos.y;
  ga = newGraph();
  float u = axis(x1, y1, r1, x2, y2, r2, 1); u = axis(x1, y1, r1, x3, y3, r3, 2); u = axis(x2, y2, r2, x3, y3, r3, 3);
  float a11 = 2 * (x2 - x1); float a12 = 2 * (y2 - y1); float a21 = 2 * (x3 - x1); float a22 = 2 * (y3 - y1);
  float b1 = (x2 * x2 + y2 * y2 - r2 * r2) - (x1 * x1 + y1 * y1 - r1 * r1);
  float b2 = (x3 * x3 + y3 * y3 - r3 * r3) - (x1 * x1 + y1 * y1 - r1 * r1);
  float det = a11 * a22 - a12 * a21;
  zact = 0; oact = 0;
  info = "**Радикальный центр** Z — точка, имеющая одинаковую степень относительно трёх окружностей; в ней пересекаются три попарные радикальные оси.\n\n";
  if (abs(det) > 0.5) {
    float zx = (b1 * a22 - a12 * b2) / det; float zy = (a11 * b2 - b1 * a21) / det;
    float pw = (zx - x1) * (zx - x1) + (zy - y1) * (zy - y1) - r1 * r1;
    if (abs(zx) < fieldMaxX && abs(zy) < fieldMaxY) {
      zact = 1;
      if (abs(Z.pos.x - zx) + abs(Z.pos.y - zy) > 0.000001) { Z.pos.x = zx; Z.pos.y = zy; }
      if (pw > 0.02) { oact = 1; rz = sqrt(pw); }
    }
    float p2 = (zx - x2) * (zx - x2) + (zy - y2) * (zy - y2) - r2 * r2;
    float p3 = (zx - x3) * (zx - x3) + (zy - y3) * (zy - y3) - r3 * r3;
    info = info + "Z = (" + num(zx, 2) + "; " + num(zy, 2) + "): p₁ = " + num(pw, 2) + ", p₂ = " + num(p2, 2) + ", p₃ = " + num(p3, 2) + " — все три равны.\n\n";
    if (zact < 0.5) { info = info + "Z лежит вне поля.\n\n"; }
    if (pw > 0.02) {
      info = info + "**Z вне окружностей, p > 0:** касательные из Z ко всем трём окружностям равны √p = " + format(sqrt(pw), 2) + ", поэтому окружность с центром Z и радиусом √p пересекает каждую из трёх под прямым углом.";
    } else if (pw < -0.02) {
      info = info + "**Z внутри окружностей, p < 0:** степень отрицательна, окружности с центром Z, ортогональной всем трём, нет.";
    } else {
      info = info + "**p = 0:** Z лежит на всех трёх окружностях сразу.";
    }
  } else {
    info = info + "**Центры почти на одной прямой:** радикальные оси параллельны (все перпендикулярны линии центров), и радикального центра нет — условие неколлинеарности центров существенно.";
  }
}
]
