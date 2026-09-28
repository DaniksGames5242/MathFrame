[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC — три вершины свободны. D — точка на биссектрисе угла A и на
// стороне BC (построена как construct = bisector). Теорема: BD/DC = AB/AC, и
// AD² = AB·AC − BD·DC. ----
new Point { name = "A"; pos = (-2, 4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (-8, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (6, -3); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

new Point { name = "D"; construct = bisector; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("D") }
new Line { name = "ad"; pos = (A, D); interact = false }
new Angle { name = "angBAD"; lines = (ab, ad) }
new Angle { name = "angDAC"; lines = (ad, ca) }
draw Angle { name = "arcBAD"; angle = "angBAD"; measure = false }
draw Angle { name = "arcDAC"; angle = "angDAC"; measure = false }

// ---- Логика ----
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

  float ab_l = ab.length; float ac_l = ca.length;
  float bd = sqrt((D.pos.x - B.pos.x) * (D.pos.x - B.pos.x) + (D.pos.y - B.pos.y) * (D.pos.y - B.pos.y));
  float dc = sqrt((D.pos.x - C.pos.x) * (D.pos.x - C.pos.x) + (D.pos.y - C.pos.y) * (D.pos.y - C.pos.y));
  float ad_l = ad.length;
  float rhsSq = ab_l * ac_l - bd * dc;

  info = "**Биссектриса угла A делит противоположную сторону BC пропорционально прилежащим сторонам:** BD/DC = AB/AC — " + format(bd, 2) + "/" + format(dc, 2) + " = " + format(bd / dc, 2) + ", AB/AC = " + format(ab_l, 2) + "/" + format(ac_l, 2) + " = " + format(ab_l / ac_l, 2) + ".\n\n**Длина биссектрисы:** AD² = AB·AC − BD·DC = " + format(ab_l, 2) + "·" + format(ac_l, 2) + " − " + format(bd, 2) + "·" + format(dc, 2) + " = " + format(rhsSq, 2) + ", AD = " + format(ad_l, 2) + " ≈ √" + format(rhsSq, 2) + ".";
}
]
