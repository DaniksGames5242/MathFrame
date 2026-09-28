[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Треугольник ABC (вершины свободны). O — центр описанной окружности, вычисляется
// напрямую по формуле пересечения серединных перпендикуляров (без перебора), радиус —
// расстояние до любой вершины. Положение O (внутри/вне/на середине гипотенузы) меняется
// само собой в зависимости от формы треугольника. ----
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0, 4); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "circ"; center = "O"; radius = rC }

// ---- Логика ----
float pax = -5; float pay = -3; float pbx = 5; float pby = -3; float pcx = 0; float pcy = 4;
float sx = 0; float sy = 0;
float rC = 1;
string info = "";

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function ok(x, y, ax, ay, bx, by) {
  if (!inField(x, y)) { return false; }
  float ux = ax - x; float uy = ay - y;
  float vx = bx - x; float vy = by - y;
  float lu = sqrt(ux * ux + uy * uy); float lv = sqrt(vx * vx + vy * vy);
  if (lu < 0.35 || lv < 0.35) { return false; }
  return abs(ux * vy - uy * vx) / (lu * lv) >= 0.17;
}
Function reach(x0, y0, dx, dy, ax, ay, bx, by) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ax, ay, bx, by)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, ax, ay, bx, by)) { good = mid; } else { bad = mid; }
  }
  return good;
}
Function slide(px, py, nx, ny, ax, ay, bx, by) {
  float t = reach(px, py, nx - px, ny - py, ax, ay, bx, by);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(cx, cy, rx, 0, ax, ay, bx, by);
    cy = cy + ry * reach(cx, cy, 0, ry, ax, ay, bx, by);
  }
  sx = cx; sy = cy;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay));
  if (m < 0.000001 || shift < 0.000001) {
  } else if (mA == m) {
    slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy);
    A.pos.x = sx; A.pos.y = sy;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy);
    B.pos.x = sx; B.pos.y = sy;
  } else {
    slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay, pbx, pby);
    C.pos.x = sx; C.pos.y = sy;
  }
  float area2 = abs((B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y));
  if (area2 < 0.25 || !inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  // Пересечение серединных перпендикуляров к AB и к BC: точка равноудалена от A, B и C.
  // Классическая формула через определитель — без итераций.
  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y;
  float d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  float aa = ax * ax + ay * ay; float bb = bx * bx + by * by; float cc = cx * cx + cy * cy;
  O.pos.x = (aa * (by - cy) + bb * (cy - ay) + cc * (ay - by)) / d;
  O.pos.y = (aa * (cx - bx) + bb * (ax - cx) + cc * (bx - ax)) / d;
  rC = sqrt((O.pos.x - ax) * (O.pos.x - ax) + (O.pos.y - ay) * (O.pos.y - ay));

  float a = bc.length; float b = ca.length; float c = ab.length;
  float maxSq = max(a * a, b * b, c * c);
  float sumSq = a * a + b * b + c * c - maxSq;
  string posTxt = "";
  if (maxSq < sumSq - 0.02) {
    posTxt = "внутри треугольника — он остроугольный";
  } else if (maxSq > sumSq + 0.02) {
    posTxt = "вне треугольника — он тупоугольный";
  } else {
    posTxt = "в середине гипотенузы — треугольник прямоугольный";
  }

  info = "**Центр описанной окружности O равноудалён от всех трёх вершин** — это пересечение серединных перпендикуляров к сторонам: OA = OB = OC = R = " + format(rC, 2) + ".\n\n**Его положение зависит от формы треугольника:** сейчас O лежит " + posTxt + ".";
}
]
