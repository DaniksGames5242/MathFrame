[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Параллелограмм ABCD (схема parallelogram.gms: удержание формы при перетаскивании
// любой вершины). Вкладка 1 — диагонали пересекаются и делятся точкой O пополам, а
// вертикальные углы при O делают треугольники AOB и COD равными. Вкладка 2 — сумма
// квадратов диагоналей равна сумме квадратов всех сторон. Вкладка 3 — длины диагоналей
// и угол между ними (равны лишь у прямоугольника, перпендикулярны лишь у ромба). ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (6.5, 3.5); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-2.5, 3.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

// ---- Вкладка 1: точка пересечения диагоналей ----
new Line { name = "diagAC"; pos = (A, C); active = false; interact = false }
new Point { name = "O"; construct = median; vertex = B; base = "diagAC"; dynamic = false; text = true("O") }
new Line { name = "ao"; pos = (A, O); interact = false }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "bo"; pos = (B, O); interact = false }
new Line { name = "od"; pos = (O, D); interact = false }
draw EquallySing { name = "eqAoOc"; edges = (ao, oc); type = 1 }
draw EquallySing { name = "eqBoOd"; edges = (bo, od); type = 2 }
new Angle { name = "angAOB"; lines = (ao, bo) }
new Angle { name = "angCOD"; lines = (oc, od) }
draw Angle { name = "arcAOB"; angle = "angAOB"; measure = false }
draw Angle { name = "arcCOD"; angle = "angCOD"; measure = false }
new Claster { name = "tabCross"; elements = (O, ao, oc, bo, od, eqAoOc, eqBoOd, arcAOB, arcCOD); active = true }

// ---- Вкладка 2: сумма квадратов диагоналей ----
new Line { name = "sumAC"; pos = (A, C); interact = false }
new Line { name = "sumBD"; pos = (B, D); interact = false }
new Claster { name = "tabSum"; elements = (sumAC, sumBD); active = false }

// ---- Вкладка 3: длины диагоналей и угол между ними ----
new Line { name = "lenAC"; pos = (A, C); interact = false }
new Line { name = "lenBD"; pos = (B, D); interact = false }
new Claster { name = "tabLen"; elements = (lenAC, lenBD); active = false }

new UI { name = "btnCross"; type = button; label = "Пересечение диагоналей"; action = "tab = 1; tabCross.active = true; tabSum.active = false; tabLen.active = false" }
new UI { name = "btnSum"; type = button; label = "Сумма квадратов"; action = "tab = 2; tabCross.active = false; tabSum.active = true; tabLen.active = false" }
new UI { name = "btnLen"; type = button; label = "Длины и угол между ними"; action = "tab = 3; tabCross.active = false; tabSum.active = false; tabLen.active = true" }

// ---- Логика (шаблон parallelogram.gms: удержание формы) ----
float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0;
float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

Function ok(x, y, ax, ay, bx, by) {
  if (!inField(x, y) || !inField(ax + bx - x, ay + by - y)) { return false; }
  float ux = ax - x; float uy = ay - y;
  float vx = bx - x; float vy = by - y;
  float lu = sqrt(ux * ux + uy * uy);
  float lv = sqrt(vx * vx + vy * vy);
  if (lu < 0.35 || lv < 0.35) { return false; }
  return abs(ux * vy - uy * vx) / (lu * lv) >= 0.26;
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
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float m = max(mA, mB, mC, mD);
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));
  if (m < 0.000001 || shift < 0.000001) {
  } else if (mA == m) {
    slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pdx, pdy);
    A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; D.pos.x = pdx; D.pos.y = pdy;
    C.pos.x = pbx + pdx - sx; C.pos.y = pby + pdy - sy;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy);
    B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
    D.pos.x = pax + pcx - sx; D.pos.y = pay + pcy - sy;
  } else if (mC == m) {
    slide(pcx, pcy, C.pos.x, C.pos.y, pbx, pby, pdx, pdy);
    C.pos.x = sx; C.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; D.pos.x = pdx; D.pos.y = pdy;
    A.pos.x = pbx + pdx - sx; A.pos.y = pby + pdy - sy;
  } else {
    slide(pdx, pdy, D.pos.x, D.pos.y, pax, pay, pcx, pcy);
    D.pos.x = sx; D.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
    B.pos.x = pax + pcx - sx; B.pos.y = pay + pcy - sy;
  }
  if (abs(A.pos.x + C.pos.x - B.pos.x - D.pos.x) + abs(A.pos.y + C.pos.y - B.pos.y - D.pos.y) > 0.0001
      || !inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y) || !inField(D.pos.x, D.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  if (tab == 1) {
    info = "**Диагонали пересекаются и точкой O делятся пополам:** AO = OC = " + format(ao.length, 2) + ", BO = OD = " + format(bo.length, 2) + ".\n\n**Треугольники AOB и COD равны** по двум сторонам и углу между ними: AO = OC, BO = OD, а углы при O — вертикальные (отмечены дугами), значит равны.";
  } else if (tab == 3) {
    float d1 = ac_len(); float d2 = bd_len();
    info = "**Диагонали в общем случае не равны:** AC = " + format(d1, 2) + ", BD = " + format(d2, 2) + "; угол между ними " + format(diagAngle(), 1) + "°.\n\n**Равные диагонали — только у прямоугольника,** то есть при ∠A = 90°: сейчас ∠A = " + format(angA.measure, 1) + "°.\n\n**Перпендикулярные диагонали — только у ромба,** то есть при AB = BC: сейчас AB = " + format(ab.length, 2) + ", BC = " + format(bc.length, 2) + ".";
  } else {
    float d1 = ac_len(); float d2 = bd_len();
    info = "**Сумма квадратов диагоналей равна сумме квадратов всех сторон:** AC² + BD² = " + format(d1 * d1, 2) + " + " + format(d2 * d2, 2) + " = " + format(d1 * d1 + d2 * d2, 2) + ".\n\nAB² + BC² + CD² + DA² = " + format(ab.length * ab.length + bc.length * bc.length + cd.length * cd.length + da.length * da.length, 2) + " — те же значения, что подтверждает теорема косинусов, применённая к обоим треугольникам, на которые диагональ делит параллелограмм.";
  }
}

Function ac_len() { float dx = C.pos.x - A.pos.x; float dy = C.pos.y - A.pos.y; return sqrt(dx * dx + dy * dy); }
// Острый угол между прямыми AC и BD, в градусах.
Function diagAngle() {
  float ux = C.pos.x - A.pos.x; float uy = C.pos.y - A.pos.y;
  float vx = D.pos.x - B.pos.x; float vy = D.pos.y - B.pos.y;
  return acos(min(1, abs(ux * vx + uy * vy) / (sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy)))) * 180 / pi;
}
Function bd_len() { float dx = D.pos.x - B.pos.x; float dy = D.pos.y - B.pos.y; return sqrt(dx * dx + dy * dy); }
]
