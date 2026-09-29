[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Равнобедренный треугольник: основание BC свободно, вершина A — на серединном
// перпендикуляре BC (та же схема, что в ravnobedrennyy.gms). M — середина основания:
// отрезок AM и есть медиана к основанию, она же высота и биссектриса. ----
new Point { name = "B"; pos = (-4, -2); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (4, -2); text = true("C"); pauseOnDrag = false }

new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "P2"; pos = (0, 1); dynamic = false; collision = false; active = false }
new Line { name = "bis"; pos = (P1, P2); active = false; interact = false }
new Point { name = "A"; line = "bis"; t = 2.5; extend = true; text = true("A"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

new Point { name = "M"; construct = median; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("M") }
new Line { name = "am"; pos = (A, M) }

// Прямой угол между медианой AM и основанием: mExt — невидимая линия M–(за B), общая
// точка M с am, нужна только чтобы отметить прямой угол.
new Line { name = "mExt"; pos = (M, B); color = "transparent"; interact = false }
new Angle { name = "angM"; lines = (am, mExt) }
draw Angle { name = "arcM"; angle = "angM"; measure = false }

// ---- Логика ----
string info = "";
float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function ok(bx, by, cx, cy) {
  if (!inField(bx, by) || !inField(cx, cy)) { return false; }
  float dx = cx - bx; float dy = cy - by;
  return sqrt(dx * dx + dy * dy) >= 0.35;
}
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

float paxA = 0; float payA = 4;

Start {
  pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
  paxA = A.pos.x; payA = A.pos.y;
}

Update {
  float shx = B.pos.x - pbx; float shy = B.pos.y - pby;
  float shx2 = C.pos.x - pcx; float shy2 = C.pos.y - pcy;
  float isShift = 0;
  if (abs(shx - shx2) < 0.0001 && abs(shy - shy2) < 0.0001 && abs(shx) + abs(shy) > 0.000001) { isShift = 1; }
  if (isShift > 0.5) {
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

  float mx = (pbx + pcx) / 2; float my = (pby + pcy) / 2;
  float dx = pcx - pbx; float dy = pcy - pby;
  float len = sqrt(dx * dx + dy * dy);
  float ux = -dy / len; float uy = dx / len;
  P1.pos.x = mx - ux; P1.pos.y = my - uy;
  P2.pos.x = mx + ux; P2.pos.y = my + uy;

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
  if (ax < -fieldMaxX) { ax = -fieldMaxX; } if (ax > fieldMaxX) { ax = fieldMaxX; }
  if (ay < -fieldMaxY) { ay = -fieldMaxY; } if (ay > fieldMaxY) { ay = fieldMaxY; }
  if (abs(ux) > abs(uy)) { s = (ax - mx) / ux; } else { s = (ay - my) / uy; }
  float t = (s + 1) / 2;
  A.t = t; paxA = ax; payA = ay;

  float a = ab.length; float c = bc.length; float m = am.length;
  info = "**Медиана к основанию AM = " + format(m, 2) + "** — совпадает с высотой и биссектрисой: угол AMB = 90°, BM = MC = " + format(bc.length / 2, 2) + ".\n\n**По теореме Пифагора:** m = √(AB² − (BC/2)²) = √(" + format(a, 2) + "² − " + format(c / 2, 2) + "²) = " + format(m, 2) + ".\n\n**Площадь** S = ½·BC·AM = " + format(0.5 * c * m, 2) + ".";
}
]
