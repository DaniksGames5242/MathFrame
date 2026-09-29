[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все вершины, стороны и фигура целиком перетаскиваются ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1.5, 4); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
// Педальный треугольник точки P: основания перпендикуляров из P на прямые, содержащие стороны.
new Point { name = "P"; pos = (2, 0); text = true("P"); color = "#f59e0b"; pauseOnDrag = false }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("O") }
new Point { name = "Q1"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("P₁") }
new Point { name = "Q2"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("P₂") }
new Point { name = "Q3"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("P₃") }
new Circle { name = "cc"; center = O; radius = A; thickness = 1 }
new Line { name = "pa"; pos = (P, Q1); interact = false; thickness = 1 }
new Line { name = "pb"; pos = (P, Q2); interact = false; thickness = 1 }
new Line { name = "pc"; pos = (P, Q3); interact = false; thickness = 1 }
new Line { name = "t1"; pos = (Q1, Q2); interact = false; thickness = 2; color = #3b82f6 }
new Line { name = "t2"; pos = (Q2, Q3); interact = false; thickness = 2; color = #3b82f6 }
new Line { name = "t3"; pos = (Q3, Q1); interact = false; thickness = 2; color = #3b82f6 }
new UI { name = "bH"; type = button; label = "P = ортоцентр"; action = "snapP = 1" }
new UI { name = "bO"; type = button; label = "P = центр описанной"; action = "snapP = 2" }
new UI { name = "bC"; type = button; label = "P на описанной"; action = "snapP = 3" }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0; float qx = 0; float qy = 0; float fx = 0; float fy = 0;
float snap = 0; float snapP = 0;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
// Треугольник допустим: вершины в поле, стороны не короче касания точек, все углы от 14° до 166°
Function okNow(x1, y1, x2, y2, x3, y3) {
  if (!inField(x1, y1) || !inField(x2, y2) || !inField(x3, y3)) { return false; }
  float a = sqrt((x2 - x3) ^ 2 + (y2 - y3) ^ 2);
  float b = sqrt((x3 - x1) ^ 2 + (y3 - y1) ^ 2);
  float c = sqrt((x1 - x2) ^ 2 + (y1 - y2) ^ 2);
  if (a < 0.35 || b < 0.35 || c < 0.35) { return false; }
  float k = abs((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1));
  return k / (b * c) >= 0.25 && k / (a * c) >= 0.25 && k / (a * b) >= 0.25;
}
// Допустим ли сдвиг вершин с флагами fa, fb, fc на вектор (ux, uy) от прежнего положения
Function okT(fa, fb, fc, ux, uy) {
  return okNow(pAx + fa * ux, pAy + fa * uy, pBx + fb * ux, pBy + fb * uy, pCx + fc * ux, pCy + fc * uy);
}
// Наибольшая доля t хода (dx, dy) от смещения (x0, y0), до которой весь путь допустим
// (16 промежуточных точек, чтобы быстрый ход не перепрыгнул запрещённую зону, затем деление пополам)
Function reach(fa, fb, fc, x0, y0, dx, dy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (okT(fa, fb, fc, x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (okT(fa, fb, fc, x0 + dx * mid, y0 + dy * mid)) { good = mid; } else { bad = mid; }
  }
  return good;
}
// Плавный ход: допустимая часть сдвига, остаток — отдельно по x и по y. Результат в (sx, sy)
Function slide(fa, fb, fc, ux, uy) {
  float t = reach(fa, fb, fc, 0, 0, ux, uy);
  float cx = ux * t; float cy = uy * t;
  if (t < 1) {
    float rx = ux - cx; float ry = uy - cy;
    cx = cx + rx * reach(fa, fb, fc, cx, cy, rx, 0);
    cy = cy + ry * reach(fa, fb, fc, cx, cy, 0, ry);
  }
  sx = cx; sy = cy;
  return 0;
}
// Центр окружности через три точки → (qx, qy)
Function circ(ax, ay, bx, by, cx, cy) {
  float d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  qx = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  qy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  return 0;
}
// Основание перпендикуляра из (px, py) на прямую (ax, ay)–(bx, by) → (fx, fy)
Function foot(px, py, ax, ay, bx, by) {
  float dx = bx - ax; float dy = by - ay;
  float k = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy + 0.000000001);
  fx = ax + k * dx; fy = ay + k * dy;
  return 0;
}
// Угол при вершине (px, py) между лучами к (qx1, qy1) и (rx, ry), градусы
Function ang(px, py, x1, y1, x2, y2) {
  float ux = x1 - px; float uy = y1 - py; float vx = x2 - px; float vy = y2 - py;
  float c = (ux * vx + uy * vy) / (sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy) + 0.000000001);
  return acos(max(-1, min(1, c))) * 180 / pi;
}

Start { pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y;  }

Update {
  if (snap > 0) {
    if (snap == 1) { A.pos.x = -5; A.pos.y = -3; B.pos.x = 5; B.pos.y = -3; C.pos.x = -1; C.pos.y = 4; }
    if (snap == 2) { A.pos.x = -5; A.pos.y = -3; B.pos.x = 5; B.pos.y = -3; C.pos.x = -1.4; C.pos.y = 1.8; }
    if (snap == 3) { A.pos.x = -5; A.pos.y = -3; B.pos.x = 3; B.pos.y = -3; C.pos.x = 5.5; C.pos.y = 3; }
    pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y;
    snap = 0;
  }

  // Ход вершин: одна вершина — сама по себе, две (сторона) — сдвиг на общий вектор, три —
  // перенос фигуры целиком (границу поля держит движок). Недопустимый ход обрезается со скольжением.
  float dAx = A.pos.x - pAx; float dAy = A.pos.y - pAy;
  float dBx = B.pos.x - pBx; float dBy = B.pos.y - pBy;
  float dCx = C.pos.x - pCx; float dCy = C.pos.y - pCy;
  float fa = 0; float fb = 0; float fc = 0;
  if (abs(dAx) + abs(dAy) > 0.000001) { fa = 1; }
  if (abs(dBx) + abs(dBy) > 0.000001) { fb = 1; }
  if (abs(dCx) + abs(dCy) > 0.000001) { fc = 1; }
  float nm = fa + fb + fc;
  if (nm == 1 || nm == 2) {
    float ux = dCx; float uy = dCy;
    if (fb == 1) { ux = dBx; uy = dBy; }
    if (fa == 1) { ux = dAx; uy = dAy; }
    slide(fa, fb, fc, ux, uy);
    A.pos.x = pAx + fa * sx; A.pos.y = pAy + fa * sy;
    B.pos.x = pBx + fb * sx; B.pos.y = pBy + fb * sy;
    C.pos.x = pCx + fc * sx; C.pos.y = pCy + fc * sy;
  }
  // Страховка: недопустимый кадр — возврат к последнему корректному положению
  if (!okNow(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y)) {
    A.pos.x = pAx; A.pos.y = pAy; B.pos.x = pBx; B.pos.y = pBy; C.pos.x = pCx; C.pos.y = pCy;
  }
  pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y;

  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y;
  float a = bc.length; float b = ca.length; float c = ab.length;
  float S = abs((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
  circ(ax, ay, bx, by, cx, cy);
  float ox = qx; float oy = qy;
  float R = sqrt((ax - ox) ^ 2 + (ay - oy) ^ 2);
  float gx = (ax + bx + cx) / 3; float gy = (ay + by + cy) / 3;
  float hx = ax + bx + cx - 2 * ox; float hy = ay + by + cy - 2 * oy;
  float nx = (ox + hx) / 2; float ny = (oy + hy) / 2;
  if (snapP > 0) {
    if (snapP == 1 && inField(hx, hy)) { P.pos.x = hx; P.pos.y = hy; }
    if (snapP == 2) { P.pos.x = ox; P.pos.y = oy; }
    if (snapP == 3) {
      float found = 0;
      repeat (36) {
        float qxx = ox + R * cos(i * pi / 18 + 0.4); float qyy = oy + R * sin(i * pi / 18 + 0.4);
        if (found < 0.5 && inField(qxx, qyy)) { P.pos.x = qxx; P.pos.y = qyy; found = 1; }
      }
    }
    snapP = 0;
  }
  float px = P.pos.x; float py = P.pos.y;
  foot(px, py, bx, by, cx, cy); float q1x = fx; float q1y = fy;
  foot(px, py, cx, cy, ax, ay); float q2x = fx; float q2y = fy;
  foot(px, py, ax, ay, bx, by); float q3x = fx; float q3y = fy;
  O.pos.x = ox; O.pos.y = oy;
  Q1.pos.x = q1x; Q1.pos.y = q1y;
  Q2.pos.x = q2x; Q2.pos.y = q2y;
  Q3.pos.x = q3x; Q3.pos.y = q3y;
  float sp2 = abs((q2x - q1x) * (q3y - q1y) - (q2y - q1y) * (q3x - q1x)) / 2;
  float dd = sqrt((px - ox) ^ 2 + (py - oy) ^ 2);
  float sf = S * abs(R * R - dd * dd) / (4 * R * R);
  info = "**Площадь педального треугольника** P₁P₂P₃ = " + format(sp2, 2) + ". Расстояние от P до центра описанной окружности d = " + format(dd, 2) + ", R = " + format(R, 2) + ", S = " + format(S, 2) + ", и S · |R² − d²| / (4R²) = " + format(sf, 2) + ".";
  if (abs(R * R - dd * dd) < 0.03 * R * R) {
    info = info + "\n\n**Точка P лежит на описанной окружности** (d = R): основания перпендикуляров коллинеарны, педальный треугольник вырождается в отрезок — прямую Симсона.";
  } else if (dd < 0.05) {
    info = info + "\n\n**P — центр описанной окружности:** площадь наибольшая и равна S/4 = " + format(S / 4, 2) + "; вершины P₁, P₂, P₃ — середины сторон.";
  } else if (abs(px - hx) + abs(py - hy) < 0.05) {
    info = info + "\n\n**P — ортоцентр:** педальный треугольник — ортотреугольник (основания высот).";
  }

}
]
