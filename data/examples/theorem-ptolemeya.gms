[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Окружность и вписанный четырёхугольник ABCD ----
// Вершины удерживаются на окружности в Update (угол каждой вершины относительно центра),
// порядок A → B → C → D против часовой стрелки не нарушается — четырёхугольник всегда
// выпуклый и вписанный. Центр O двигает всю конструкцию, фигуру можно тащить целиком.
float R = 3.8;
new Point { name = "O"; pos = (0, 0); text = true("O"); size = 0.7; pauseOnDrag = false }
new Circle { name = "w"; center = O; radius = 3.8 }

new Point { name = "A"; pos = (-3.57, -1.3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (1.3, -3.57); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (3.57, 1.3); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-1.9, 3.29); text = true("D"); pauseOnDrag = false }
// D на вкладке «Неравенство» — свободная вершина
new Point { name = "D2"; pos = (-1.3, 1.6); text = true("D"); pauseOnDrag = false }

// Стороны: пара a, c — оранжевая, пара b, d — зелёная, диагонали p, q — синие
new Line { name = "ab"; pos = (A, B); color = #f59e0b; thickness = 3 }
new Line { name = "bc"; pos = (B, C); color = #22c55e; thickness = 3 }
new Line { name = "cd"; pos = (C, D); color = #f59e0b; thickness = 3 }
new Line { name = "da"; pos = (D, A); color = #22c55e; thickness = 3 }
new Line { name = "ac"; pos = (A, C); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "bd"; pos = (B, D); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "cd2"; pos = (C, D2); color = #f59e0b; thickness = 3 }
new Line { name = "da2"; pos = (D2, A); color = #22c55e; thickness = 3 }
new Line { name = "bd2"; pos = (B, D2); color = #3b82f6; thickness = 3; interact = false }

new Figure { name = "quad"; elements = (ab, bc, cd, da) }
new Figure { name = "quad2"; elements = (ab, bc, cd2, da2) }

// Подписи сторон и диагоналей — те же буквы, что в описании темы
draw Text { name = "lA"; pos = (lblX(A, B), lblY(A, B)); text = "a" }
draw Text { name = "lB"; pos = (lblX(B, C), lblY(B, C)); text = "b" }
draw Text { name = "lC"; pos = (lblX(C, D), lblY(C, D)); text = "c" }
draw Text { name = "lD"; pos = (lblX(D, A), lblY(D, A)); text = "d" }
draw Text { name = "lC2"; pos = (lblX(C, D2), lblY(C, D2)); text = "c" }
draw Text { name = "lD2"; pos = (lblX(D2, A), lblY(D2, A)); text = "d" }
draw Text { name = "lP"; pos = (A.pos.x * 0.72 + C.pos.x * 0.28 + 0.3 * (A.pos.y - C.pos.y) / ac.length, A.pos.y * 0.72 + C.pos.y * 0.28 - 0.3 * (A.pos.x - C.pos.x) / ac.length); text = "p" }
draw Text { name = "lQ"; pos = (B.pos.x * 0.72 + D.pos.x * 0.28 + 0.3 * (B.pos.y - D.pos.y) / bd.length, B.pos.y * 0.72 + D.pos.y * 0.28 - 0.3 * (B.pos.x - D.pos.x) / bd.length); text = "q" }
draw Text { name = "lQ2"; pos = (B.pos.x * 0.72 + D2.pos.x * 0.28 + 0.3 * (B.pos.y - D2.pos.y) / bd2.length, B.pos.y * 0.72 + D2.pos.y * 0.28 - 0.3 * (B.pos.x - D2.pos.x) / bd2.length); text = "q" }

new Claster { name = "tabThm"; elements = (D, cd, da, bd, quad, lC, lD, lQ); active = true }
new Claster { name = "tabIneq"; elements = (D2, cd2, da2, bd2, quad2, lC2, lD2, lQ2); active = false }

new UI { name = "btnThm"; type = button; label = "Теорема"; action = "tab = 1; tabThm.active = true; tabIneq.active = false" }
new UI { name = "btnIneq"; type = button; label = "Неравенство"; action = "tab = 2; tabThm.active = false; tabIneq.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float TAU = 6.283185307179586;
float gap = 0.35;
float aA = 3.49; float aB = 5.06; float aC = 0.349; float aD = 2.09;
float pOx = 0; float pOy = 0;
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float pDx = 0; float pDy = 0; float pD2x = 0; float pD2y = 0;
float sx = 0; float sy = 0;
float onCircle = 0;

// Подпись стороны PQ: середина, вынесенная наружу от центра окружности
Function lblX(P, Q) {
  float mx = (P.pos.x + Q.pos.x) / 2; float my = (P.pos.y + Q.pos.y) / 2;
  float l = sqrt((mx - O.pos.x) ^ 2 + (my - O.pos.y) ^ 2);
  if (l < 0.001) { return mx; }
  return mx + 0.45 * (mx - O.pos.x) / l;
}
Function lblY(P, Q) {
  float mx = (P.pos.x + Q.pos.x) / 2; float my = (P.pos.y + Q.pos.y) / 2;
  float l = sqrt((mx - O.pos.x) ^ 2 + (my - O.pos.y) ^ 2);
  if (l < 0.001) { return my; }
  return my + 0.45 * (my - O.pos.y) / l;
}

Function md(x) { return x - floor(x / TAU) * TAU; }

// Угол вершины t, зажатый между соседями (lo — предыдущая, hi — следующая против
// часовой) с зазором gap: вершина не может обогнать соседнюю.
Function clampAng(t, lo, hi) {
  float s = md(hi - lo) - 2 * gap;
  float r = md(t - lo - gap);
  if (r <= s) { return t; }
  if (r - s < TAU - r) { return md(lo + gap + s); }
  return md(lo + gap);
}

Function placeAll() {
  A.pos.x = O.pos.x + R * cos(aA); A.pos.y = O.pos.y + R * sin(aA);
  B.pos.x = O.pos.x + R * cos(aB); B.pos.y = O.pos.y + R * sin(aB);
  C.pos.x = O.pos.x + R * cos(aC); C.pos.y = O.pos.y + R * sin(aC);
  D.pos.x = O.pos.x + R * cos(aD); D.pos.y = O.pos.y + R * sin(aD);
  return 0;
}

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Свободная D2: четырёхугольник ABCD2 выпуклый (все повороты в одну сторону, с запасом
// по углу), D2 не ближе 1 к соседям, в поле
Function turn(ax, ay, bx, by, cx, cy) {
  return ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / (sqrt((bx - ax) ^ 2 + (by - ay) ^ 2) * sqrt((cx - bx) ^ 2 + (cy - by) ^ 2) + 0.000001);
}
Function okD2(x, y) {
  if (!inField(x, y)) { return false; }
  if (sqrt((x - A.pos.x) ^ 2 + (y - A.pos.y) ^ 2) < 1 || sqrt((x - C.pos.x) ^ 2 + (y - C.pos.y) ^ 2) < 1) { return false; }
  return turn(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y) > 0.15 && turn(B.pos.x, B.pos.y, C.pos.x, C.pos.y, x, y) > 0.15
      && turn(C.pos.x, C.pos.y, x, y, A.pos.x, A.pos.y) > 0.15 && turn(x, y, A.pos.x, A.pos.y, B.pos.x, B.pos.y) > 0.15;
}
// Наибольшая допустимая доля хода (путь проверяется по промежуточным точкам)
Function reach(x0, y0, dx, dy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (okD2(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (okD2(x0 + dx * mid, y0 + dy * mid)) { good = mid; } else { bad = mid; }
  }
  return good;
}
// Плавный ход D2 из (px, py) в (nx, ny): допустимая часть, остаток — по осям
Function slide(px, py, nx, ny) {
  float t = reach(px, py, nx - px, ny - py);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  if (t < 1) {
    cx = cx + (nx - cx) * reach(cx, cy, nx - cx, 0);
    cy = cy + (ny - cy) * reach(cx, cy, 0, ny - cy);
  }
  sx = cx; sy = cy;
  return 0;
}

// Угол вершины которой-то из A, B, C (w = 1, 2, 3) — поставить и проверить выпуклость
// ABCD2 (нужно на вкладке «Неравенство»: вершина на окружности не может уехать туда,
// где четырёхугольник со свободной D перестал бы быть выпуклым)
Function setAng(w, v) {
  if (w == 1) { aA = v; } else if (w == 2) { aB = v; } else { aC = v; }
  placeAll();
  return okD2(D2.pos.x, D2.pos.y);
}
// Ход вершины w по окружности от угла a0 к a1 — до последнего допустимого положения
// (путь по 16 точкам + уточнение делением пополам)
Function moveAng(w, a0, a1) {
  float d = md(a1 - a0 + TAU / 2) - TAU / 2;
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) { if (setAng(w, a0 + d * (i + 1) / 16)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; } }
  }
  if (bad <= 1) {
    repeat (12) {
      float mid = (good + bad) / 2;
      if (setAng(w, a0 + d * mid)) { good = mid; } else { bad = mid; }
    }
  }
  setAng(w, md(a0 + d * good));
  return 0;
}

// Надёжно поставить D2 в допустимое место: от середины дуги CA (со стороны D) к
// середине хорды AC
Function resetD2() {
  float mid = aC + md(aA - aC) / 2;
  float ex = O.pos.x + R * 0.9 * cos(mid); float ey = O.pos.y + R * 0.9 * sin(mid);
  float hx = (A.pos.x + C.pos.x) / 2; float hy = (A.pos.y + C.pos.y) / 2;
  repeat (20) {
    float s = 1 - i / 20;
    if (!okD2(D2.pos.x, D2.pos.y)) { D2.pos.x = hx + (ex - hx) * s; D2.pos.y = hy + (ey - hy) * s; }
  }
  return 0;
}

Function f2(v) { return format(v, 2); }

Start {
  placeAll();
  pOx = O.pos.x; pOy = O.pos.y;
  pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y;
  pDx = D.pos.x; pDy = D.pos.y; pD2x = D2.pos.x; pD2y = D2.pos.y;
}

Update {
  float mO = abs(O.pos.x - pOx) + abs(O.pos.y - pOy);
  float mA = abs(A.pos.x - pAx) + abs(A.pos.y - pAy);
  float mB = abs(B.pos.x - pBx) + abs(B.pos.y - pBy);
  float mC = abs(C.pos.x - pCx) + abs(C.pos.y - pCy);
  float mD = abs(D.pos.x - pDx) + abs(D.pos.y - pDy);
  float mD2 = abs(D2.pos.x - pD2x) + abs(D2.pos.y - pD2y);
  float m = max(mO, mA, mB, mC, mD, mD2);
  float d2dx = D2.pos.x - pD2x; float d2dy = D2.pos.y - pD2y;
  if (m > 0.000001) {
    if (mA > 0.000001 && abs(mA - mB) < 0.000001 && abs(mA - mC) < 0.000001 && (abs(mA - mD) < 0.000001 || abs(mA - mD2) < 0.000001)) {
      // Фигура целиком: сдвигаем центр на тот же вектор, D2 едет вместе с фигурой
      O.pos.x = pOx + A.pos.x - pAx; O.pos.y = pOy + A.pos.y - pAy;
      if (mD2 < 0.000001) { D2.pos.x = pD2x + A.pos.x - pAx; D2.pos.y = pD2y + A.pos.y - pAy; }
    } else if (mA == m) {
      float nA = clampAng(atan2(A.pos.y - O.pos.y, A.pos.x - O.pos.x), aD, aB);
      if (tab == 2) { moveAng(1, aA, nA); } else { aA = nA; }
    } else if (mB == m) {
      float nB = clampAng(atan2(B.pos.y - O.pos.y, B.pos.x - O.pos.x), aA, aC);
      if (tab == 2) { moveAng(2, aB, nB); } else { aB = nB; }
    } else if (mC == m) {
      float nC = clampAng(atan2(C.pos.y - O.pos.y, C.pos.x - O.pos.x), aB, aD);
      if (tab == 2) { moveAng(3, aC, nC); } else { aC = nC; }
    }
    else if (mD == m) { aD = clampAng(atan2(D.pos.y - O.pos.y, D.pos.x - O.pos.x), aC, aA); }
    else if (mO == m) { D2.pos.x = pD2x + O.pos.x - pOx; D2.pos.y = pD2y + O.pos.y - pOy; }
  }
  // Окружность целиком в поле
  O.pos.x = min(max(O.pos.x, -fieldMaxX + R), fieldMaxX - R);
  O.pos.y = min(max(O.pos.y, -fieldMaxY + R), fieldMaxY - R);
  placeAll();

  // Свободная D2: плавное ограничение выпуклостью; рядом с окружностью — «примагничивается» к ней
  if (mD2 == m && m > 0.000001) {
    slide(pD2x, pD2y, D2.pos.x, D2.pos.y);
    D2.pos.x = sx; D2.pos.y = sy;
  } else if (!okD2(D2.pos.x, D2.pos.y)) {
    // Например, после перемещения вершин на вкладке «Теорема» — D2 в недопустимом месте
    D2.pos.x = pD2x; D2.pos.y = pD2y;
    resetD2();
  }
  float rd = sqrt((D2.pos.x - O.pos.x) ^ 2 + (D2.pos.y - O.pos.y) ^ 2);
  onCircle = 0;
  if (abs(rd - R) < 0.15 && rd > 0.001) {
    float cxs = O.pos.x + (D2.pos.x - O.pos.x) * R / rd; float cys = O.pos.y + (D2.pos.y - O.pos.y) * R / rd;
    if (okD2(cxs, cys)) { D2.pos.x = cxs; D2.pos.y = cys; onCircle = 1; }
  }

  pOx = O.pos.x; pOy = O.pos.y;
  pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y;
  pDx = D.pos.x; pDy = D.pos.y; pD2x = D2.pos.x; pD2y = D2.pos.y;

  if (tab == 1) {
    info = "**Теорема Птолемея:** во вписанном четырёхугольнике произведение диагоналей равно сумме произведений противоположных сторон: ac + bd = pq.\n\nac + bd = " + f2(ab.length) + " · " + f2(cd.length) + " + " + f2(bc.length) + " · " + f2(da.length) + " = " + f2(ab.length * cd.length + bc.length * da.length) + ";   pq = " + f2(ac.length) + " · " + f2(bd.length) + " = " + f2(ac.length * bd.length) + ".";
  } else {
    float s2 = ab.length * cd2.length + bc.length * da2.length;
    float pq2 = ac.length * bd2.length;
    string rel = "<";
    if (onCircle == 1) { rel = "="; }
    info = "**Неравенство Птолемея:** в любом выпуклом четырёхугольнике pq ≤ ac + bd, причём равенство достигается только для вписанного четырёхугольника.\n\npq = " + f2(pq2) + " " + rel + " ac + bd = " + f2(s2) + ".";
    if (onCircle == 1) { info = info + " Вершина D на окружности — четырёхугольник вписанный."; }
  }
}
]
