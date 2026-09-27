[
description = "{info}"

field width = 20;
field height = 12;
show boundary = true;

// ---- Вершины: все четыре перетаскиваются. Условие «ABCD — параллелограмм»
// поддерживается в Update: у перетаскиваемой вершины соседние остаются на месте,
// а противоположная пересчитывается (например, C = B + D − A). ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (6.5, 3.5); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-2.5, 3.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }

new Figure { name = "abcd"; elements = (ab, bc, cd, da); interact = false }

// ---- Вкладка 1: стороны и углы ----
draw EquallySing { name = "eqAbCd"; edges = (ab, cd); type = 1 }
draw EquallySing { name = "eqBcDa"; edges = (bc, da); type = 2 }

new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB"; count = 2 }
draw Angle { name = "arcC"; angle = "angC" }
draw Angle { name = "arcD"; angle = "angD"; count = 2 }

new Claster { name = "tabSides"; elements = (eqAbCd, eqBcDa, arcA, arcB, arcC, arcD); active = true }

// ---- Вкладка 2: диагонали делятся точкой пересечения пополам ----
new Line { name = "diagAC"; pos = (A, C); active = false; interact = false }
new Point { name = "O"; construct = median; vertex = B; base = "diagAC"; dynamic = false; text = true("O") }
new Line { name = "ao"; pos = (A, O); interact = false }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "bo"; pos = (B, O); interact = false }
new Line { name = "od"; pos = (O, D); interact = false }
draw EquallySing { name = "eqAoOc"; edges = (ao, oc); type = 1 }
draw EquallySing { name = "eqBoOd"; edges = (bo, od); type = 2 }

new Claster { name = "tabDiag"; elements = (O, ao, oc, bo, od, eqAoOc, eqBoOd); active = false }

// ---- Вкладка 3: площадь = основание × высота ----
new Point { name = "H"; construct = altitude; vertex = D; base = "ab"; dynamic = false; text = true("H") }
new Line { name = "dh"; pos = (D, H); interact = false }
// Прямой угол при H отмечается между DH и невидимой (transparent) вспомогательной HA.
// Пунктир продолжения стороны AB рисуется по отдельной скрытой линии haExt — у неё цвет
// не задан, поэтому пунктир следует теме. Слой 1 — под стороной AB: пунктир заметен,
// только когда основание высоты H выходит за отрезок AB.
new Line { name = "ha"; pos = (H, A); color = "transparent"; interact = false; layer = 1 }
new Line { name = "haExt"; pos = (H, A); active = false; interact = false }
draw Punctir { name = "extAB"; edge = "haExt"; layer = 1 }
new Angle { name = "angH"; lines = (dh, ha) }
draw Angle { name = "arcH"; angle = "angH"; measure = false }

new Claster { name = "tabArea"; elements = (H, dh, ha, arcH, extAB); active = false }

// ---- Кнопки вкладок ----
new UI { name = "btnSides"; type = button; label = "Стороны и углы"; action = "tab = 1; tabSides.active = true; tabDiag.active = false; tabArea.active = false" }
new UI { name = "btnDiag"; type = button; label = "Диагонали"; action = "tab = 2; tabSides.active = false; tabDiag.active = true; tabArea.active = false" }
new UI { name = "btnArea"; type = button; label = "Площадь"; action = "tab = 3; tabSides.active = false; tabDiag.active = false; tabArea.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0;
float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float lim = 0.4;

// Лежит ли точка (x, y) внутри поля с отступом lim от границы
Function inField(x, y) {
  return abs(x) <= 10 - lim && abs(y) <= 6 - lim;
}

// Невырожденный ли параллелограмм с вершиной (px, py) и соседями (ax, ay), (bx, by):
// обе стороны не короче 1.5, угол при вершине от 15° до 165° (sin ≥ 0.26).
Function okShape(px, py, ax, ay, bx, by) {
  float ux = ax - px; float uy = ay - py;
  float vx = bx - px; float vy = by - py;
  float lu = sqrt(ux * ux + uy * uy);
  float lv = sqrt(vx * vx + vy * vy);
  if (lu < 1.5 || lv < 1.5) { return false; }
  return abs(ux * vy - uy * vx) / (lu * lv) >= 0.26;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
}

Update {
  // Какая вершина сдвинулась — у той пересчитываем противоположную.
  // Если противоположная вышла бы за поле или фигура выродилась бы (слишком короткая
  // сторона, слишком острый угол), ход отменяется.
  if (A.pos.x != pax || A.pos.y != pay) {
    if (inField(B.pos.x + D.pos.x - A.pos.x, B.pos.y + D.pos.y - A.pos.y) && okShape(A.pos.x, A.pos.y, B.pos.x, B.pos.y, D.pos.x, D.pos.y)) {
      C.pos.x = B.pos.x + D.pos.x - A.pos.x; C.pos.y = B.pos.y + D.pos.y - A.pos.y;
    } else { A.pos.x = pax; A.pos.y = pay; }
  } else if (B.pos.x != pbx || B.pos.y != pby) {
    if (inField(A.pos.x + C.pos.x - B.pos.x, A.pos.y + C.pos.y - B.pos.y) && okShape(B.pos.x, B.pos.y, A.pos.x, A.pos.y, C.pos.x, C.pos.y)) {
      D.pos.x = A.pos.x + C.pos.x - B.pos.x; D.pos.y = A.pos.y + C.pos.y - B.pos.y;
    } else { B.pos.x = pbx; B.pos.y = pby; }
  } else if (C.pos.x != pcx || C.pos.y != pcy) {
    if (inField(B.pos.x + D.pos.x - C.pos.x, B.pos.y + D.pos.y - C.pos.y) && okShape(C.pos.x, C.pos.y, B.pos.x, B.pos.y, D.pos.x, D.pos.y)) {
      A.pos.x = B.pos.x + D.pos.x - C.pos.x; A.pos.y = B.pos.y + D.pos.y - C.pos.y;
    } else { C.pos.x = pcx; C.pos.y = pcy; }
  } else if (D.pos.x != pdx || D.pos.y != pdy) {
    if (inField(A.pos.x + C.pos.x - D.pos.x, A.pos.y + C.pos.y - D.pos.y) && okShape(D.pos.x, D.pos.y, A.pos.x, A.pos.y, C.pos.x, C.pos.y)) {
      B.pos.x = A.pos.x + C.pos.x - D.pos.x; B.pos.y = A.pos.y + C.pos.y - D.pos.y;
    } else { D.pos.x = pdx; D.pos.y = pdy; }
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  if (tab == 1) {
    info = "Перетаскивайте любую вершину — фигура всегда остаётся параллелограммом.\n\n**Противоположные стороны равны:** AB = CD = " + format(ab.length, 2) + ", BC = DA = " + format(bc.length, 2) + ".\n\n**Противоположные углы равны, соседние в сумме дают 180°:** ∠A = ∠C = " + format(angA.measure, 0) + "°, ∠B = ∠D = " + format(angB.measure, 0) + "°, ∠A + ∠B = " + format(angA.measure + angB.measure, 0) + "°.";
  } else if (tab == 2) {
    info = "**Диагонали точкой пересечения делятся пополам:** AO = OC = " + format(ao.length, 2) + ", BO = OD = " + format(bo.length, 2) + ".";
  } else {
    info = "**Площадь равна произведению основания на высоту:** S = AB · DH = " + format(ab.length, 2) + " · " + format(dh.length, 2) + " = " + format(ab.length * dh.length, 2) + ".";
  }
}
]
