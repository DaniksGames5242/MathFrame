[
description = "{info}"

field width = 22;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC — три вершины свободны. Треугольник A'B'C' строится равным ABC
// (поворот на угол rot вокруг точки O2 плюс сдвиг), но с независимым положением и
// поворотом — ползунки меняют его расположение, не форму. Все стороны и углы совпадают,
// что подтверждается живыми числами. ----
new Point { name = "A"; pos = (-9, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (-1, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-5, 3); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }
draw Angle { name = "arcC"; angle = "angC" }

new Point { name = "A2"; pos = (0, 0); text = true("A'"); dynamic = false; collision = false }
new Point { name = "B2"; pos = (0, 0); text = true("B'"); dynamic = false; collision = false }
new Point { name = "C2"; pos = (0, 0); text = true("C'"); dynamic = false; collision = false }
new Line { name = "ab2"; pos = (A2, B2); interact = false }
new Line { name = "bc2"; pos = (B2, C2); interact = false }
new Line { name = "ca2"; pos = (C2, A2); interact = false }
new Figure { name = "abc2"; elements = (ab2, bc2, ca2) }
new Angle { name = "angA2"; lines = (ab2, ca2) }
new Angle { name = "angB2"; lines = (ab2, bc2) }
new Angle { name = "angC2"; lines = (bc2, ca2) }
draw Angle { name = "arcA2"; angle = "angA2" }
draw Angle { name = "arcB2"; angle = "angB2" }
draw Angle { name = "arcC2"; angle = "angC2" }

new UI { name = "sRot"; type = slider; label = "поворот"; variable = rot; min = -180; max = 180; step = 1; default = 35 }
new UI { name = "sFlip"; type = select; label = "отражение"; variable = flip; options = ("no", "yes"); labels = ("без отражения", "с отражением"); default = "no" }
new UI { name = "sShiftX"; type = slider; label = "сдвиг вправо"; variable = shX; min = 0; max = 10; step = 0.1; default = 8 }

// ---- Логика ----
float rot = 35; string flip = "no"; float shX = 8;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function area2(ax, ay, bx, by, cx, cy) { return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); }
Function ok(ax, ay, bx, by, cx, cy) {
  if (!inField(ax, ay) || !inField(bx, by) || !inField(cx, cy)) { return false; }
  return abs(area2(ax, ay, bx, by, cx, cy)) >= 0.7;
}
Function reach(x0, y0, dx, dy, ox1, oy1, ox2, oy2) {
  float good = 0; float bad = 2;
  repeat (16) { if (bad > 1) { float t = (i + 1) / 16; if (ok(x0 + dx * t, y0 + dy * t, ox1, oy1, ox2, oy2)) { good = t; } else { bad = t; } } }
  if (bad > 1) { return 1; }
  repeat (12) { float mid = (good + bad) / 2; if (ok(x0 + dx * mid, y0 + dy * mid, ox1, oy1, ox2, oy2)) { good = mid; } else { bad = mid; } }
  return good;
}
float sx = 0; float sy = 0;
Function slide(px, py, nx, ny, ox1, oy1, ox2, oy2) {
  float t = reach(px, py, nx - px, ny - py, ox1, oy1, ox2, oy2);
  float cxr = px + (nx - px) * t; float cyr = py + (ny - py) * t;
  float rx = nx - cxr; float ry = ny - cyr;
  if (t < 1) { cxr = cxr + rx * reach(cxr, cyr, rx, 0, ox1, oy1, ox2, oy2); cyr = cyr + ry * reach(cxr, cyr, 0, ry, ox1, oy1, ox2, oy2); }
  sx = cxr; sy = cyr;
  return 0;
}

Start { pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y; }

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  if (m > 0.000001) {
    if (mA == m) { slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy); A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy; }
    else if (mB == m) { slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy); B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy; }
    else { slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay, pbx, pby); C.pos.x = sx; C.pos.y = sy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; }
  }
  if (!ok(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y)) { A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy; }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  // Центр тяжести исходного треугольника — центр поворота/отражения.
  float ox = (pax + pbx + pcx) / 3; float oy = (pay + pby + pcy) / 3;
  float ang = rot * 3.14159265 / 180;
  float cs = cos(ang); float sn = sin(ang);
  float fsign = 1; if (flip == "yes") { fsign = -1; }
  float ox2 = ox + shX; // сдвиг центра фигуры вправо

  float ax0 = (pax - ox) * fsign; float ay0 = pay - oy;
  float bx0 = (pbx - ox) * fsign; float by0 = pby - oy;
  float cx0 = (pcx - ox) * fsign; float cy0 = pcy - oy;

  float rax = ox2 + ax0 * cs - ay0 * sn; float ray = oy + ax0 * sn + ay0 * cs;
  float rbx = ox2 + bx0 * cs - by0 * sn; float rby = oy + bx0 * sn + by0 * cs;
  float rcx = ox2 + cx0 * cs - cy0 * sn; float rcy = oy + cx0 * sn + cy0 * cs;
  // Копия — не перетаскиваемая фигура, но всё равно не должна уходить за поле: если сдвиг
  // и поворот вынесли её за границу, сдвигаем всю копию целиком обратно внутрь параллельным
  // переносом (перенос — тоже движение плоскости, форма и углы не меняются).
  float limX = fieldMaxX - 0.4; float limY = fieldMaxY - 0.4;
  float maxX = max(rax, max(rbx, rcx)); float minX = min(rax, min(rbx, rcx));
  float maxY = max(ray, max(rby, rcy)); float minY = min(ray, min(rby, rcy));
  float dx = 0; if (maxX > limX) { dx = limX - maxX; } if (minX < -limX) { dx = -limX - minX; }
  float dy = 0; if (maxY > limY) { dy = limY - maxY; } if (minY < -limY) { dy = -limY - minY; }
  A2.pos.x = rax + dx; A2.pos.y = ray + dy;
  B2.pos.x = rbx + dx; B2.pos.y = rby + dy;
  C2.pos.x = rcx + dx; C2.pos.y = rcy + dy;

  string how = "поворотом и переносом";
  if (flip == "yes") { how = "отражением, поворотом и переносом"; }
  info = "**Треугольник A'B'C' получен из ABC " + how + "** — движением плоскости, при котором расстояния не меняются, поэтому все стороны и углы совпадают:\n\nAB = A'B' = " + format(ab.length, 2) + ", BC = B'C' = " + format(bc.length, 2) + ", CA = C'A' = " + format(ca.length, 2) + ";\n\n∠A = ∠A' = " + format(angA.measure, 0) + "°, ∠B = ∠B' = " + format(angB.measure, 0) + "°, ∠C = ∠C' = " + format(angC.measure, 0) + "°.\n\nЭто и есть равенство треугольников: △ABC = △A'B'C'.";
}
]
