[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все три вершины перетаскиваются, треугольник не вырождается ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5.5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1, 4); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Середины сторон, серединные перпендикуляры (пунктир) и центр описанной окружности ----
new Point { name = "Ma"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Point { name = "Mb"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Point { name = "Mc"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O"); color = #f59e0b }
new Line { name = "moa"; pos = (Ma, O); interact = false }
new Line { name = "mob"; pos = (Mb, O); interact = false }
new Line { name = "moc"; pos = (Mc, O); interact = false }
new Circle { name = "circ"; center = "O"; radius = rc }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0;
float rc = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function sinAt(x, y, ax, ay, bx, by) {
  float ux = ax - x; float uy = ay - y; float vx = bx - x; float vy = by - y;
  return abs(ux * vy - uy * vx) / (sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy) + 0.000001);
}
Function ok(x, y, ax, ay, bx, by) {
  if (!inField(x, y)) { return false; }
  if (sqrt((x - ax) ^ 2 + (y - ay) ^ 2) < 0.35 || sqrt((x - bx) ^ 2 + (y - by) ^ 2) < 0.35) { return false; }
  return sinAt(x, y, ax, ay, bx, by) >= 0.14 && sinAt(ax, ay, x, y, bx, by) >= 0.14 && sinAt(bx, by, x, y, ax, ay) >= 0.14;
}
Function reach(x0, y0, dx, dy, ax, ay, bx, by) {
  float good = 0; float bad = 2;
  repeat (16) { if (bad > 1) { if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ax, ay, bx, by)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; } } }
  if (bad > 1) { return 1; }
  repeat (12) { float mid = (good + bad) / 2; if (ok(x0 + dx * mid, y0 + dy * mid, ax, ay, bx, by)) { good = mid; } else { bad = mid; } }
  return good;
}
Function slide(px, py, nx, ny, ax, ay, bx, by) {
  float t = reach(px, py, nx - px, ny - py, ax, ay, bx, by);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  if (t < 1) {
    cx = cx + (nx - cx) * reach(cx, cy, nx - cx, 0, ax, ay, bx, by);
    cy = cy + (ny - cy) * reach(cx, cy, 0, ny - cy, ax, ay, bx, by);
  }
  sx = cx; sy = cy;
  return 0;
}

Start { pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y; }

Update {
  float mA = abs(A.pos.x - pAx) + abs(A.pos.y - pAy);
  float mB = abs(B.pos.x - pBx) + abs(B.pos.y - pBy);
  float mC = abs(C.pos.x - pCx) + abs(C.pos.y - pCy);
  float m = max(mA, mB, mC);
  float shift = abs((B.pos.x - pBx) - (A.pos.x - pAx)) + abs((B.pos.y - pBy) - (A.pos.y - pAy)) + abs((C.pos.x - pCx) - (A.pos.x - pAx)) + abs((C.pos.y - pCy) - (A.pos.y - pAy));
  if (m > 0.000001 && shift > 0.000001) {
    if (mA == m) { slide(pAx, pAy, A.pos.x, A.pos.y, pBx, pBy, pCx, pCy); A.pos.x = sx; A.pos.y = sy; B.pos.x = pBx; B.pos.y = pBy; C.pos.x = pCx; C.pos.y = pCy; }
    else if (mB == m) { slide(pBx, pBy, B.pos.x, B.pos.y, pAx, pAy, pCx, pCy); B.pos.x = sx; B.pos.y = sy; A.pos.x = pAx; A.pos.y = pAy; C.pos.x = pCx; C.pos.y = pCy; }
    else { slide(pCx, pCy, C.pos.x, C.pos.y, pAx, pAy, pBx, pBy); C.pos.x = sx; C.pos.y = sy; A.pos.x = pAx; A.pos.y = pAy; B.pos.x = pBx; B.pos.y = pBy; }
  }
  pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y;

  Ma.pos.x = (B.pos.x + C.pos.x) / 2; Ma.pos.y = (B.pos.y + C.pos.y) / 2;
  Mb.pos.x = (C.pos.x + A.pos.x) / 2; Mb.pos.y = (C.pos.y + A.pos.y) / 2;
  Mc.pos.x = (A.pos.x + B.pos.x) / 2; Mc.pos.y = (A.pos.y + B.pos.y) / 2;

  // Центр описанной окружности — пересечение серединных перпендикуляров к AB и BC.
  float d1x = A.pos.y - B.pos.y; float d1y = B.pos.x - A.pos.x;
  float d2x = B.pos.y - C.pos.y; float d2y = C.pos.x - B.pos.x;
  float den = d1x * d2y - d1y * d2x;
  float t = ((Mb.pos.x - Mc.pos.x) * d2y - (Mb.pos.y - Mc.pos.y) * d2x) / den;
  O.pos.x = Mc.pos.x + d1x * t; O.pos.y = Mc.pos.y + d1y * t;
  rc = sqrt((O.pos.x - A.pos.x) ^ 2 + (O.pos.y - A.pos.y) ^ 2);

  string place = "внутри треугольника (он остроугольный)";
  float sgnAB = (B.pos.x - A.pos.x) * (O.pos.y - A.pos.y) - (B.pos.y - A.pos.y) * (O.pos.x - A.pos.x);
  float sgnC = (B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (B.pos.y - A.pos.y) * (C.pos.x - A.pos.x);
  float sgnBC = (C.pos.x - B.pos.x) * (O.pos.y - B.pos.y) - (C.pos.y - B.pos.y) * (O.pos.x - B.pos.x);
  float sgnA = (C.pos.x - B.pos.x) * (A.pos.y - B.pos.y) - (C.pos.y - B.pos.y) * (A.pos.x - B.pos.x);
  float sgnCA = (A.pos.x - C.pos.x) * (O.pos.y - C.pos.y) - (A.pos.y - C.pos.y) * (O.pos.x - C.pos.x);
  float sgnB = (A.pos.x - C.pos.x) * (B.pos.y - C.pos.y) - (A.pos.y - C.pos.y) * (B.pos.x - C.pos.x);
  if (sgnAB * sgnC < 0 || sgnBC * sgnA < 0 || sgnCA * sgnB < 0) { place = "вне треугольника (он тупоугольный)"; }

  info = "**Центр описанной окружности O** — точка пересечения серединных перпендикуляров к сторонам треугольника, одинаково удалённая от всех трёх вершин. Сейчас он лежит " + place + ".\n\n**Расстояние до каждой вершины равно радиусу описанной окружности:** OA = OB = OC = R = " + format(rc, 2) + ".";
}
]
