[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все вершины и фигура целиком перетаскиваются ----
new Point { name = "A"; pos = (-4, -2.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (4.5, -2); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1, 3.5); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Центры трёх окружностей (на прямых сторон) и сами окружности ----
new Point { name = "Oa"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "Ob"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "Oc"; pos = (0, 0); dynamic = false; collision = false; active = false }
float ra = 1; float rb = 1; float rc = 1;
new Circle { name = "wa"; center = Oa; radius = ra; color = #3b82f6; thickness = 2 }
new Circle { name = "wb"; center = Ob; radius = rb; color = #f59e0b; thickness = 2 }
new Circle { name = "wc"; center = Oc; radius = rc; color = #22c55e; thickness = 2 }
// Описанная окружность (все три окружности Аполлония ей ортогональны)
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
float rr = 1;
new Circle { name = "circ"; center = O; radius = rr; thickness = 1 }
// Основание биссектрисы угла A и точка P на окружности Аполлония, связанной с B и C
new Point { name = "D"; pos = (0, 0); dynamic = false; collision = false; text = true("D") }
float pin = 1;
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; text = true("P"); color = #3b82f6; active = pin > 0.5 }
new Line { name = "pb"; pos = (P, B); interact = false; color = #3b82f6; active = pin > 0.5 }
new Line { name = "pc"; pos = (P, C); interact = false; color = #3b82f6; active = pin > 0.5 }
float arc = 3;
new UI { type = slider; label = "P: длина дуги от A"; variable = arc; min = -12; max = 12; step = 0.1; default = 3 }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0; float qx = 0; float qy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function dist(ax, ay, bx, by) { return sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
Function sinAt(x, y, ax, ay, bx, by) {
  float ux = ax - x; float uy = ay - y; float vx = bx - x; float vy = by - y;
  return abs(ux * vy - uy * vx) / (sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy) + 0.000001);
}
// Центр описанной окружности → (qx, qy)
Function cc(ax, ay, bx, by, cx, cy) {
  float d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  qx = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  qy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  return 0;
}
// Треугольник невырожденный: вершина в поле, стороны не короче 0.35, все углы от 8° до 172°
Function okBase(x, y, ax, ay, bx, by) {
  if (!inField(x, y)) { return false; }
  if (dist(x, y, ax, ay) < 0.35 || dist(x, y, bx, by) < 0.35) { return false; }
  return sinAt(x, y, ax, ay, bx, by) >= 0.14 && sinAt(ax, ay, x, y, bx, by) >= 0.14 && sinAt(bx, by, x, y, ax, ay) >= 0.14;
}

// Допустимо: треугольник невырожденный, стороны попарно различаются не меньше чем на 0.6
// (при равенстве сторон окружность Аполлония превращается в прямую)
Function ok(x, y, ax, ay, bx, by) {
  if (!okBase(x, y, ax, ay, bx, by)) { return false; }
  float s1 = dist(x, y, ax, ay); float s2 = dist(x, y, bx, by); float s3 = dist(ax, ay, bx, by);
  return abs(s1 - s2) >= 0.6 && abs(s2 - s3) >= 0.6 && abs(s3 - s1) >= 0.6;
}

Function reach(x0, y0, dx, dy, ax, ay, bx, by) {
  float good = 0; float bad = 2;
  repeat (16) { if (bad > 1) { if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ax, ay, bx, by)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; } } }
  if (bad > 1) { return 1; }
  repeat (12) { float mid = (good + bad) / 2; if (ok(x0 + dx * mid, y0 + dy * mid, ax, ay, bx, by)) { good = mid; } else { bad = mid; } }
  return good;
}
// Плавный ход вершины: допустимая часть хода, остаток — по осям. Результат в (sx, sy)
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
  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y;
  float a = dist(bx, by, cx, cy); float b = dist(cx, cy, ax, ay); float c = dist(ax, ay, bx, by);
  float ta = c * c - b * b; float tb = a * a - c * c; float tc = b * b - a * a;
  float pr = a * b * c;
  // Окружность для B, C (через A): центр B + (C − B)·c²/(c² − b²), радиус abc/|c² − b²|
  float oax = bx + (cx - bx) * c * c / ta; float oay = by + (cy - by) * c * c / ta;
  float obx = cx + (ax - cx) * a * a / tb; float oby = cy + (ay - cy) * a * a / tb;
  float ocx = ax + (bx - ax) * b * b / tc; float ocy = ay + (by - ay) * b * b / tc;
  Oa.pos.x = oax; Oa.pos.y = oay; Ob.pos.x = obx; Ob.pos.y = oby; Oc.pos.x = ocx; Oc.pos.y = ocy;
  ra = pr / abs(ta); rb = pr / abs(tb); rc = pr / abs(tc);
  cc(ax, ay, bx, by, cx, cy);
  O.pos.x = qx; O.pos.y = qy;
  rr = dist(qx, qy, ax, ay);
  // Основание биссектрисы угла A на BC
  D.pos.x = bx + (cx - bx) * c / (b + c); D.pos.y = by + (cy - by) * c / (b + c);
  float th = acos((ax - oax) / ra); if (ay < oay) { th = -th; }
  float px = oax + ra * cos(th + arc / ra); float py = oay + ra * sin(th + arc / ra);
  if (inField(px, py)) { pin = 1; } else { pin = 0; }
  P.pos.x = px; P.pos.y = py;
  float pB = dist(px, py, bx, by); float pC = dist(px, py, cx, cy);
  // Ортогональность окружности Аполлония и описанной: OaO² = R² + ra²
  float orth = dist(oax, oay, qx, qy) * dist(oax, oay, qx, qy) - rr * rr - ra * ra;
  if (abs(orth) < 0.0005) { orth = 0; }
  string pinfo = "точка P вне поля.";
  if (pin > 0.5) { pinfo = "для P на окружности PB = " + format(pB, 2) + ", PC = " + format(pC, 2) + ", PB / PC = " + format(pB / pC, 3) + "."; }
  info = "**Окружность Аполлония** для вершин B и C (синяя) — все точки X с XB / XC = AB / AC = c / b = " + format(c, 2) + " / " + format(b, 2) + " = " + format(c / b, 3) + "; " + pinfo + "\n\n**Она проходит через A и основание биссектрисы D угла A**, а её центр лежит на прямой BC: он делит BC внешним образом в том же отношении, в каком D делит внутренним. Радиус r = abc / |c² − b²| = " + format(ra, 2) + ". Так же строятся окружности для C, A (жёлтая, r = " + format(rb, 2) + ") и для A, B (зелёная, r = " + format(rc, 2) + ").\n\n**Все три ортогональны описанной окружности:** OₐO² − R² − r² = " + num(orth, 3) + " (R = " + format(rr, 2) + ").";
}
]
