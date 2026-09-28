[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Треугольник ABC. I — инцентр: пересечение трёх биссектрис, вычисляется в Update как
// взвешенное среднее вершин I = (aA + bB + cC)/(a+b+c), где a,b,c — длины противоположных
// сторон. Вписанная окружность касается всех трёх сторон, радиус r = расстояние от I до AB. ----
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0, 4); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; text = true("I") }
new Circle { name = "inc"; center = "I"; radius = rIns }

// ---- Логика ----
float pax = -5; float pay = -3; float pbx = 5; float pby = -3; float pcx = 0; float pcy = 4;
float sx = 0; float sy = 0;
float rIns = 1;
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

  float la = bc.length; float lb = ca.length; float lc = ab.length;
  float per = la + lb + lc;
  I.pos.x = (la * A.pos.x + lb * B.pos.x + lc * C.pos.x) / per;
  I.pos.y = (la * A.pos.y + lb * B.pos.y + lc * C.pos.y) / per;
  // расстояние от I до прямой AB — радиус вписанной окружности
  float r = abs((B.pos.x - A.pos.x) * (A.pos.y - I.pos.y) - (A.pos.x - I.pos.x) * (B.pos.y - A.pos.y)) / lc;
  rIns = r;
  float p = per / 2;
  float s = sqrt(p * (p - la) * (p - lb) * (p - lc));

  info = "**Инцентр I — точка пересечения биссектрис, центр вписанной окружности.** Она равноудалена от всех трёх сторон: расстояние до каждой стороны равно радиусу r = " + format(r, 2) + ".\n\n**Координаты — взвешенное среднее вершин с весами длин противоположных сторон:** I = (aA + bB + cC)/(a+b+c), a = BC = " + format(la, 2) + ", b = CA = " + format(lb, 2) + ", c = AB = " + format(lc, 2) + ".\n\n**Радиус через площадь и полупериметр:** r = S/p = " + format(s, 2) + " / " + format(p, 2) + " = " + format(s / p, 2) + ".";
}
]
