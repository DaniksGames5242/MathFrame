[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- B и C — основание, свободны (только не слипаются и не выходят за поле).
// A держится на серединном перпендикуляре BC (линия bis, extend = true — точка может
// уходить дальше отрезка), t — знаковая высота: любое положение на этой прямой даёт
// AB = AC, а высота (t) не меняется при сдвиге основания. ----
new Point { name = "B"; pos = (-4, -2); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (4, -2); text = true("C"); pauseOnDrag = false }

new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "P2"; pos = (0, 1); dynamic = false; collision = false; active = false }
new Line { name = "bis"; pos = (P1, P2); active = false; interact = false }
new Point { name = "A"; line = "bis"; t = 3.6; extend = true; text = true("A"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

draw EquallySing { name = "eqLegs"; edges = (ab, ca); type = 1 }

new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcA"; angle = "angA"; measure = false }
draw Angle { name = "arcB"; angle = "angB"; count = 1 }
draw Angle { name = "arcC"; angle = "angC"; count = 1 }

// Высота к основанию: H — вычисляемое основание высоты из A на BC. hc — вспомогательная
// невидимая линия H-C (общая точка H с ah), нужна только для отметки прямого угла.
new Point { name = "H"; construct = altitude; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("H") }
new Line { name = "ah"; pos = (A, H); interact = false }
new Line { name = "hc"; pos = (H, C); color = "transparent"; interact = false }
new Angle { name = "angH"; lines = (ah, hc) }
draw Angle { name = "arcH"; angle = "angH"; measure = false }

// ---- Логика ----
string info = "";
float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;
float pat = 3.6;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Допустимо ли основание (bx,by)-(cx,cy): обе точки в поле, длина не меньше 0.35
// (иначе стороны схлопываются в точку).
Function ok(bx, by, cx, cy) {
  if (!inField(bx, by) || !inField(cx, cy)) { return false; }
  float dx = cx - bx; float dy = cy - by;
  return sqrt(dx * dx + dy * dy) >= 0.35;
}

// Наибольшая доля хода (0..1) точки (px,py)->(px+dx,py+dy) при неподвижной другой
// точке основания (ox,oy), допустимая целиком (проверка по 16 промежуточным точкам).
Function reach(px, py, dx, dy, ox, oy, movingB) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      float t = (i + 1) / 16; float valid = 0;
      if (movingB > 0.5) { if (ok(px + dx * t, py + dy * t, ox, oy)) { valid = 1; } }
      else { if (ok(ox, oy, px + dx * t, py + dy * t)) { valid = 1; } }
      if (valid > 0.5) { good = t; } else { bad = t; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2; float valid = 0;
    if (movingB > 0.5) { if (ok(px + dx * mid, py + dy * mid, ox, oy)) { valid = 1; } }
    else { if (ok(ox, oy, px + dx * mid, py + dy * mid)) { valid = 1; } }
    if (valid > 0.5) { good = mid; } else { bad = mid; }
  }
  return good;
}

float sx = 0; float sy = 0;
Function slide(px, py, nx, ny, ox, oy, movingB) {
  float t = reach(px, py, nx - px, ny - py, ox, oy, movingB);
  float cx2 = px + (nx - px) * t; float cy2 = py + (ny - py) * t;
  float rx = nx - cx2; float ry = ny - cy2;
  if (t < 1) {
    cx2 = cx2 + rx * reach(cx2, cy2, rx, 0, ox, oy, movingB);
    cy2 = cy2 + ry * reach(cx2, cy2, 0, ry, ox, oy, movingB);
  }
  sx = cx2; sy = cy2;
  return 0;
}

float paxA = 0; float payA = 3.6;

Start {
  pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y; pat = A.t;
  paxA = A.pos.x; payA = A.pos.y;
}

Update {
  // Перетаскивание фигуры целиком (клик внутри треугольника, не по вершине): B и C
  // сдвигаются на один и тот же вектор — обрабатываем отдельно, иначе логика ниже
  // (одна вершина двигается, другая держится на месте) исказила бы фигуру.
  float shx = B.pos.x - pbx; float shy = B.pos.y - pby;
  float shx2 = C.pos.x - pcx; float shy2 = C.pos.y - pcy;
  float isShift = 0;
  if (abs(shx - shx2) < 0.0001 && abs(shy - shy2) < 0.0001 && abs(shx) + abs(shy) > 0.000001) { isShift = 1; }
  if (isShift > 0.5) {
    // Наибольшая допустимая доля сдвига, при которой B, C и старая A (со своим сдвигом)
    // остаются в поле — целиком в поле держит и вычисляемая позже A (формула её не меняет
    // при чистом переносе, только вместе с базой).
    float good = 0; float bad = 2;
    repeat (16) {
      if (bad > 1) {
        float tt = (i + 1) / 16; float valid = 0;
        if (inField(pbx + shx * tt, pby + shy * tt) && inField(pcx + shx * tt, pcy + shy * tt) && inField(paxA + shx * tt, payA + shy * tt)) { valid = 1; }
        if (valid > 0.5) { good = tt; } else { bad = tt; }
      }
    }
    if (bad <= 1) {
      repeat (12) {
        float mid2 = (good + bad) / 2; float valid = 0;
        if (inField(pbx + shx * mid2, pby + shy * mid2) && inField(pcx + shx * mid2, pcy + shy * mid2) && inField(paxA + shx * mid2, payA + shy * mid2)) { valid = 1; }
        if (valid > 0.5) { good = mid2; } else { bad = mid2; }
      }
    }
    B.pos.x = pbx + shx * good; B.pos.y = pby + shy * good;
    C.pos.x = pcx + shx * good; C.pos.y = pcy + shy * good;
  } else {
    float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
    float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
    if (mB >= mC && mB > 0.000001) {
      slide(pbx, pby, B.pos.x, B.pos.y, pcx, pcy, 1);
      B.pos.x = sx; B.pos.y = sy; C.pos.x = pcx; C.pos.y = pcy;
    } else if (mC > mB && mC > 0.000001) {
      slide(pcx, pcy, C.pos.x, C.pos.y, pbx, pby, 0);
      C.pos.x = sx; C.pos.y = sy; B.pos.x = pbx; B.pos.y = pby;
    }
    if (!ok(B.pos.x, B.pos.y, C.pos.x, C.pos.y)) {
      B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
    }
  }
  pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  // Серединный перпендикуляр основания: направление unit-длины, P1/P2 задают линию,
  // A едет по ней параметром t (высота, знак — сторона основания).
  float mx = (pbx + pcx) / 2; float my = (pby + pcy) / 2;
  float dx = pcx - pbx; float dy = pcy - pby;
  float len = sqrt(dx * dx + dy * dy);
  float ux = -dy / len; float uy = dx / len;
  P1.pos.x = mx - ux; P1.pos.y = my - uy;
  P2.pos.x = mx + ux; P2.pos.y = my + uy;

  // Точка на линии P1..P2 позиционируется движком как P1 + t·(P2−P1); P1 = центр − u,
  // P2 = центр + u (u — единичный вектор), поэтому реальное смещение от центра — s = 2t − 1
  // (при t = 0.5 точка в центре, s = 0). Дальше работаем со знаковой высотой s: точная
  // граница по x и по y считается напрямую (mx + s·ux в [-fieldMaxX, fieldMaxX] и
  // my + s·uy в [-fieldMaxY, fieldMaxY]), не итеративно — иначе у самой границы поля
  // сходимость была бы слишком медленной. |s| не меньше 0.35, иначе A сливается с основанием.
  float loS = -1000; float hiS = 1000;
  if (abs(ux) > 0.000001) {
    float b1x = (fieldMaxX - mx) / ux; float b2x = (-fieldMaxX - mx) / ux;
    if (b1x < b2x) { if (b1x > loS) { loS = b1x; } if (b2x < hiS) { hiS = b2x; } }
    else { if (b2x > loS) { loS = b2x; } if (b1x < hiS) { hiS = b1x; } }
  }
  if (abs(uy) > 0.000001) {
    float b1y = (fieldMaxY - my) / uy; float b2y = (-fieldMaxY - my) / uy;
    if (b1y < b2y) { if (b1y > loS) { loS = b1y; } if (b2y < hiS) { hiS = b2y; } }
    else { if (b2y > loS) { loS = b2y; } if (b1y < hiS) { hiS = b1y; } }
  }
  float s = A.t * 2 - 1;
  if (s < loS) { s = loS; } if (s > hiS) { s = hiS; }
  if (abs(s) < 0.35) {
    if (s < 0) { s = -0.35; if (s < loS) { s = loS; } }
    else { s = 0.35; if (s > hiS) { s = hiS; } }
  }
  float ax = mx + s * ux; float ay = my + s * uy;
  // Страховка: у самой границы поля погрешность вычисления loS/hiS может на долю
  // промилле вывести A за пределы — обрезаем координаты напрямую и пересчитываем s.
  if (ax < -fieldMaxX) { ax = -fieldMaxX; } if (ax > fieldMaxX) { ax = fieldMaxX; }
  if (ay < -fieldMaxY) { ay = -fieldMaxY; } if (ay > fieldMaxY) { ay = fieldMaxY; }
  if (abs(ux) > abs(uy)) { s = (ax - mx) / ux; } else { s = (ay - my) / uy; }
  float t = (s + 1) / 2;
  A.t = t; pat = t; paxA = ax; payA = ay;

  float b = ab.length; float a = bc.length; float h = ah.length;
  float alphaV = angA.measure; float betaB = angB.measure;
  info = "**Боковые стороны равны:** AB = CA = " + format(b, 2) + ", основание BC = " + format(a, 2) + ".\n\n**Углы при основании равны:** ∠B = ∠C = " + format(betaB, 0) + "°, угол при вершине ∠A = " + format(alphaV, 0) + "° (∠A + 2∠B = " + format(alphaV + 2 * betaB, 0) + "°).\n\n**Высота к основанию AH = " + format(h, 2) + "** совпадает с медианой и биссектрисой. Площадь S = ½·BC·AH = " + format(0.5 * a * h, 2) + ", периметр P = BC + 2·AB = " + format(a + 2 * b, 2) + ".";
}
]
