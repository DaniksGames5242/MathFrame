[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Равносторонний треугольник ABC: вершины свободны, форма держится в Update (та же схема,
// что в ravnostoronniy.gms: двигают вершину — соседняя стоит на месте, третья считается поворотом на 60°). ----
new Point { name = "A"; pos = (-3, -2.6); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3, -2.6); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0, 2.596152); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

// Основания медианы, биссектрисы и высоты из вершины A — это три разных построения, но одна точка.
new Point { name = "M"; construct = median; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("M") }
new Point { name = "D"; construct = bisector; vertex = A; base = "bc"; dynamic = false; collision = false }
new Point { name = "H"; construct = altitude; vertex = A; base = "bc"; dynamic = false; collision = false }

// ---- Вкладка 1: из вершины A — медиана AM, биссектриса AD, высота AH (линии разной толщины,
// чтобы были видны все три, хотя лежат друг на друге) ----
new Line { name = "am"; pos = (A, M); interact = false; color = #3b82f6; thickness = 7; layer = 10 }
new Line { name = "ad"; pos = (A, D); interact = false; color = #22c55e; thickness = 4.5; layer = 20 }
new Line { name = "ah"; pos = (A, H); interact = false; color = #f59e0b; thickness = 2; layer = 30 }
new Line { name = "hb"; pos = (H, B); color = "transparent"; interact = false }
new Angle { name = "angBAD"; lines = (ab, ad) }
new Angle { name = "angDAC"; lines = (ad, ca) }
new Angle { name = "angH"; lines = (ah, hb) }
draw Angle { name = "arcBAD"; angle = "angBAD"; radius = 1.6 }
draw Angle { name = "arcDAC"; angle = "angDAC"; radius = 1.6 }
draw Angle { name = "arcH"; angle = "angH"; measure = false }
new Claster { name = "tab1"; elements = (M, am, ad, ah, hb, arcBAD, arcDAC, arcH); active = true }

// ---- Вкладка 2: линии из всех трёх вершин пересекаются в одной точке O ----
new Point { name = "Mb"; construct = median; vertex = B; base = "ca"; dynamic = false; collision = false; text = true("N") }
new Point { name = "Mc"; construct = median; vertex = C; base = "ab"; dynamic = false; collision = false; text = true("K") }
new Point { name = "Ma"; construct = median; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("M") }
new Line { name = "ma"; pos = (A, Ma); interact = false }
new Line { name = "mb"; pos = (B, Mb); interact = false }
new Line { name = "mc"; pos = (C, Mc); interact = false }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; interact = false; text = true("O") }
new Claster { name = "tab2"; elements = (Ma, Mb, Mc, ma, mb, mc, O); active = false }

new UI { name = "btn1"; type = button; label = "Из одной вершины"; action = "tab = 1; tab1.active = true; tab2.active = false" }
new UI { name = "btn2"; type = button; label = "Из всех вершин"; action = "tab = 2; tab1.active = false; tab2.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;
float sx = 0; float sy = 0;
float rc = 0.5;
float rs = 0.8660254;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Допустимо ли положение (x, y) двигаемой вершины при неподвижной соседней (qx, qy):
// третья вершина (x, y) + поворот на 60° вектора к соседней лежит в поле, сторона не короче 0.9.
Function ok(x, y, qx, qy) {
  float dx = qx - x; float dy = qy - y;
  if (!inField(x, y) || !inField(x + dx * rc - dy * rs, y + dx * rs + dy * rc)) { return false; }
  return sqrt(dx * dx + dy * dy) >= 0.9;
}

Function reach(x0, y0, dx, dy, qx, qy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, qx, qy)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, qx, qy)) { good = mid; } else { bad = mid; }
  }
  return good;
}

Function slide(px, py, nx, ny, qx, qy) {
  float t = reach(px, py, nx - px, ny - py, qx, qy);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(cx, cy, rx, 0, qx, qy);
    cy = cy + ry * reach(cx, cy, 0, ry, qx, qy);
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
    // A двигают, B на месте, C = A + поворот на 60° вектора AB.
    slide(pax, pay, A.pos.x, A.pos.y, pbx, pby);
    A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby;
    C.pos.x = sx + (pbx - sx) * rc - (pby - sy) * rs; C.pos.y = sy + (pbx - sx) * rs + (pby - sy) * rc;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, pcx, pcy);
    B.pos.x = sx; B.pos.y = sy; C.pos.x = pcx; C.pos.y = pcy;
    A.pos.x = sx + (pcx - sx) * rc - (pcy - sy) * rs; A.pos.y = sy + (pcx - sx) * rs + (pcy - sy) * rc;
  } else {
    slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay);
    C.pos.x = sx; C.pos.y = sy; A.pos.x = pax; A.pos.y = pay;
    B.pos.x = sx + (pax - sx) * rc - (pay - sy) * rs; B.pos.y = sy + (pax - sx) * rs + (pay - sy) * rc;
  }
  // Страховка: не равносторонний или вершина вне поля — возврат в последнее корректное положение.
  float l1 = sqrt((B.pos.x - A.pos.x) * (B.pos.x - A.pos.x) + (B.pos.y - A.pos.y) * (B.pos.y - A.pos.y));
  float l2 = sqrt((C.pos.x - B.pos.x) * (C.pos.x - B.pos.x) + (C.pos.y - B.pos.y) * (C.pos.y - B.pos.y));
  float l3 = sqrt((A.pos.x - C.pos.x) * (A.pos.x - C.pos.x) + (A.pos.y - C.pos.y) * (A.pos.y - C.pos.y));
  if (abs(l1 - l2) + abs(l2 - l3) > 0.0001 || !inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  float a = ab.length;
  O.pos.x = (pax + pbx + pcx) / 3; O.pos.y = (pay + pby + pcy) / 3;
  float mlen = am.length;
  if (tab == 1) {
    info = "**Медиана, биссектриса и высота из вершины A совпадают:** AM = AD = AH = " + format(mlen, 2) + " = a√3/2. Основания M, D, H — одна точка, середина BC: BM = MC = " + format(a / 2, 2) + ".\n\n**Биссектриса делит угол пополам:** ∠BAD = ∠DAC = " + format(angBAD.measure, 1) + "° (половина ∠A = 60°). **Высота перпендикулярна BC:** ∠AHB = 90°.";
  } else {
    info = "**Три линии из вершин пересекаются в одной точке O** (для каждой вершины медиана, биссектриса и высота — один отрезок): AM = BN = CK = " + format(mlen, 2) + ".\n\n**O делит каждую линию в отношении 2 : 1, считая от вершины:** AO = " + format(a * 0.5773503, 2) + ", OM = " + format(a * 0.2886751, 2) + ", AO : OM = " + format((a * 0.5773503) / (a * 0.2886751), 1) + ".";
  }
}
]
