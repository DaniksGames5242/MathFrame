[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Прямоугольник ABCD задаётся диагональю AC (оба конца свободно перетаскиваются)
// и вершиной B — она ходит по окружности Фалеса, построенной на AC как на диаметре:
// вписанный угол, опирающийся на диаметр, всегда прямой, поэтому ∠ABC = 90° при любом
// положении B. Противоположная вершина D = A + C − B (как в параллелограмме — центр
// диагоналей общий). Так прямоугольник остаётся прямоугольником при любом перетаскивании,
// но не вырождается ни в квадрат, ни в отрезок. ----
new Point { name = "A"; pos = (-5, -2); text = true("A") }
new Point { name = "C"; pos = (5, 2); text = true("C") }
// O — середина диагонали AC (и, поскольку D = A + C − B, одновременно середина BD:
// центр диагоналей у прямоугольника, как у любого параллелограмма, общий).
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "thales"; center = "O"; radius = "A"; active = false; collision = false }
new Point { name = "B"; circle = "thales"; t = 0.2; text = true("B") }
new Point { name = "D"; pos = (0, 0); dynamic = false; collision = false; text = true("D") }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

// ---- Вкладка 1: стороны и прямые углы ----
draw EquallySing { name = "eqAbCd"; edges = (ab, cd); type = 1 }
draw EquallySing { name = "eqBcDa"; edges = (bc, da); type = 2 }

new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA"; measure = false }
draw Angle { name = "arcB"; angle = "angB"; measure = false }
draw Angle { name = "arcC"; angle = "angC"; measure = false }
draw Angle { name = "arcD"; angle = "angD"; measure = false }

new Claster { name = "tabSides"; elements = (eqAbCd, eqBcDa, arcA, arcB, arcC, arcD); active = true }

// ---- Вкладка 2: диагонали равны и все четыре отрезка от них до точки O равны между собой ----
new Line { name = "ao"; pos = (A, O); interact = false }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "bo"; pos = (B, O); interact = false }
new Line { name = "od"; pos = (O, D); interact = false }
draw EquallySing { name = "eqHalves"; edges = (ao, oc, bo, od); type = 1 }
new Claster { name = "tabDiag"; elements = (ao, oc, bo, od, eqHalves); active = false }

// ---- Кнопки вкладок ----
new UI { name = "btnSides"; type = button; label = "Стороны и углы"; action = "tab = 1; tabSides.active = true; tabDiag.active = false" }
new UI { name = "btnDiag"; type = button; label = "Диагонали"; action = "tab = 2; tabSides.active = false; tabDiag.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pcx = 0; float pcy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

// Точка на окружности Фалеса (B) движок не прижимает к полю — только свободные точки.
// Поэтому окружность с центром O = середина AC и радиусом r = |OA| должна целиком
// помещаться в поле: тогда B остаётся в поле при любом положении на ней. Проверяем это
// для кандидатной пары концов диагонали (ax, ay), (cx, cy).
Function circleOk(ax, ay, cx, cy) {
  float ox = (ax + cx) / 2; float oy = (ay + cy) / 2;
  float dx = cx - ax; float dy = cy - ay;
  float r = sqrt(dx * dx + dy * dy) / 2;
  if (r < 0.9) { return false; }
  return (fieldMaxX - abs(ox)) >= r && (fieldMaxY - abs(oy)) >= r;
}

// Наибольшая доля t ∈ [0, 1] хода одного конца диагонали из (x0, y0) на вектор (dx, dy)
// при неподвижном другом конце (ox, oy), до которой окружность Фалеса ещё умещается в
// поле. Путь проверяется по промежуточным точкам, иначе резкий рывок «перепрыгнет» границу.
Function reach(x0, y0, dx, dy, ox, oy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (circleOk(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ox, oy)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (circleOk(x0 + dx * mid, y0 + dy * mid, ox, oy)) { good = mid; } else { bad = mid; }
  }
  return good;
}

Function slide(px, py, nx, ny, ox, oy) {
  float t = reach(px, py, nx - px, ny - py, ox, oy);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(cx, cy, rx, 0, ox, oy);
    cy = cy + ry * reach(cx, cy, 0, ry, ox, oy);
  }
  sx = cx; sy = cy;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pcx = C.pos.x; pcy = C.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float shift = abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay));
  if (mA < 0.000001 && mC < 0.000001) {
    // Ничего не двигали (в т.ч. если двигали только B).
  } else if (shift < 0.000001) {
    // Диагональ перенесли целиком (перетаскивание фигуры) — форма не меняется, но
    // окружность может упереться в границу поля; при нарушении откатываем перенос.
    if (!circleOk(A.pos.x, A.pos.y, C.pos.x, C.pos.y)) {
      A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
    }
  } else if (mA >= mC) {
    slide(pax, pay, A.pos.x, A.pos.y, pcx, pcy);
    A.pos.x = sx; A.pos.y = sy; C.pos.x = pcx; C.pos.y = pcy;
  } else {
    slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay);
    C.pos.x = sx; C.pos.y = sy; A.pos.x = pax; A.pos.y = pay;
  }
  pax = A.pos.x; pay = A.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  // Центр окружности Фалеса — середина диагонали AC (окружность и B на ней следуют за
  // ней сами). Противоположная вершина: центр диагоналей общий, как у любого
  // параллелограмма.
  O.pos.x = (A.pos.x + C.pos.x) / 2;
  O.pos.y = (A.pos.y + C.pos.y) / 2;
  D.pos.x = A.pos.x + C.pos.x - B.pos.x;
  D.pos.y = A.pos.y + C.pos.y - B.pos.y;

  if (tab == 1) {
    info = "**Противоположные стороны равны:** AB = CD = " + format(ab.length, 2) + ", BC = DA = " + format(bc.length, 2) + ".\n\n**Все углы прямые:** ∠A = ∠B = ∠C = ∠D = " + format(angA.measure, 0) + "° — вершина B лежит на окружности, построенной на диагонали AC как на диаметре, а вписанный угол, опирающийся на диаметр, всегда прямой.";
  } else {
    info = "**Диагонали равны и делятся точкой O пополам:** AO = OC = BO = OD = " + format(ao.length, 2) + ".";
  }
}
]
