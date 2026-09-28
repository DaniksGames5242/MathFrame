[
description = "{info}"

field width = 22;
field height = 13;
camera type = fixed;

// ---- Треугольник ABC — три вершины свободны. Треугольник A'B'C' — его гомотетичный образ
// с центром в A и коэффициентом k (ползунок): A' = A, а B', C' лежат на лучах AB, AC на
// расстоянии k·AB, k·AC. Углы совпадают, стороны и площадь меняются по k и k². ----
new Point { name = "A"; pos = (-9, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (-2, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-6, 3); text = true("C"); pauseOnDrag = false }
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

new Point { name = "B2"; pos = (0, 0); text = true("B'"); dynamic = false; collision = false }
new Point { name = "C2"; pos = (0, 0); text = true("C'"); dynamic = false; collision = false }
new Line { name = "ab2"; pos = (A, B2); interact = false; color = #f59e0b }
new Line { name = "bc2"; pos = (B2, C2); interact = false; color = #f59e0b }
new Line { name = "ca2"; pos = (C2, A); interact = false; color = #f59e0b }
new Angle { name = "angB2"; lines = (ab2, bc2) }
new Angle { name = "angC2"; lines = (bc2, ca2) }
draw Angle { name = "arcB2"; angle = "angB2"; measure = false }
draw Angle { name = "arcC2"; angle = "angC2"; measure = false }

new UI { name = "sK"; type = slider; label = "коэффициент k"; variable = kv; min = 0.3; max = 2.2; step = 0.05; default = 1.6 }

// ---- Логика ----
float kv = 1.6;
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

  // k, при котором B' и C' ещё в поле (гомотетия из A) — не даём копии убежать за границу:
  // бинарный поиск наибольшего k ≤ kv, при котором обе точки остаются в поле.
  float dbx = pbx - pax; float dby = pby - pay;
  float dcx = pcx - pax; float dcy = pcy - pay;
  float k = kv;
  if (!inField(pax + dbx * k, pay + dby * k) || !inField(pax + dcx * k, pay + dcy * k)) {
    float lo = 0; float hi = k;
    repeat (20) {
      float mid = (lo + hi) / 2;
      if (inField(pax + dbx * mid, pay + dby * mid) && inField(pax + dcx * mid, pay + dcy * mid)) { lo = mid; } else { hi = mid; }
    }
    k = lo;
  }
  B2.pos.x = A.pos.x + dbx * k; B2.pos.y = A.pos.y + dby * k;
  C2.pos.x = A.pos.x + dcx * k; C2.pos.y = A.pos.y + dcy * k;

  info = "**Треугольник AB'C' подобен ABC с коэффициентом k = " + format(k, 2) + "** (гомотетия с центром A): углы совпадают — ∠A общий, ∠B = ∠AB'C' = " + format(angB.measure, 0) + "°, ∠C = ∠AC'B' = " + format(angC.measure, 0) + "°.\n\n**Стороны пропорциональны:** AB' = k·AB = " + format(ab2.length, 2) + " (AB = " + format(ab.length, 2) + "), AC' = k·AC = " + format(ca2.length, 2) + " (AC = " + format(ca.length, 2) + "), B'C' = k·BC = " + format(bc2.length, 2) + " (BC = " + format(bc.length, 2) + ").\n\n**Отношение площадей** равно k² ≈ " + format(k * k, 2) + ".";
}
]
