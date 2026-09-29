[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Вкладка 1. Вписанный четырёхугольник: вершины A, B, C, D лежат на окружности и
// перетаскиваются по ней (соседние вершины друг через друга не проходят, порядок
// обхода сохраняется). ----
new Point { name = "O1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "w"; center = O1; radius = 4.2 }
new Point { name = "A"; circle = "w"; t = 0.38; text = true("A"); pauseOnDrag = false }
new Point { name = "B"; circle = "w"; t = 0.63; text = true("B"); pauseOnDrag = false }
new Point { name = "C"; circle = "w"; t = 0.88; text = true("C"); pauseOnDrag = false }
new Point { name = "D"; circle = "w"; t = 0.10; text = true("D"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }
new Line { name = "ac"; pos = (A, C); interact = false }
new Line { name = "bd"; pos = (B, D); interact = false }
new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB"; count = 2 }
draw Angle { name = "arcC"; angle = "angC" }
draw Angle { name = "arcD"; angle = "angD"; count = 2 }
new Claster { name = "tabCyc"; elements = (O1, w, A, B, C, D, ab, bc, cd, da, abcd, ac, bd, arcA, arcB, arcC, arcD); active = true }

// ---- Вкладка 2. Описанный четырёхугольник: вписанная окружность фиксирована, по ней
// перетаскиваются четыре точки касания K, L, M, N; вершины — пересечения касательных в
// соседних точках касания (вычисляются в Update). Так получается любой описанный
// четырёхугольник. ----
new Point { name = "O2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "wi"; center = O2; radius = 2.2 }
new Point { name = "kAB"; circle = "wi"; t = 0.02; text = true("K"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "kBC"; circle = "wi"; t = 0.22; text = true("L"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "kCD"; circle = "wi"; t = 0.55; text = true("M"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "kDA"; circle = "wi"; t = 0.77; text = true("N"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "pA"; pos = (0, 0); dynamic = false; collision = false; text = true("A") }
new Point { name = "pB"; pos = (0, 0); dynamic = false; collision = false; text = true("B") }
new Point { name = "pC"; pos = (0, 0); dynamic = false; collision = false; text = true("C") }
new Point { name = "pD"; pos = (0, 0); dynamic = false; collision = false; text = true("D") }
new Line { name = "qab"; pos = (pA, pB) }
new Line { name = "qbc"; pos = (pB, pC) }
new Line { name = "qcd"; pos = (pC, pD) }
new Line { name = "qda"; pos = (pD, pA) }
new Figure { name = "qabcd"; elements = (qab, qbc, qcd, qda) }
// Отрезки касательных из каждой вершины равны — по паре с одинаковой отметкой.
new Line { name = "sa1"; pos = (pA, kAB); interact = false }
new Line { name = "sa2"; pos = (pA, kDA); interact = false }
new Line { name = "sb1"; pos = (pB, kAB); interact = false }
new Line { name = "sb2"; pos = (pB, kBC); interact = false }
new Line { name = "sc1"; pos = (pC, kBC); interact = false }
new Line { name = "sc2"; pos = (pC, kCD); interact = false }
new Line { name = "sd1"; pos = (pD, kCD); interact = false }
new Line { name = "sd2"; pos = (pD, kDA); interact = false }
draw EquallySing { name = "eqA"; edges = (sa1, sa2); type = 1 }
draw EquallySing { name = "eqB"; edges = (sb1, sb2); type = 2 }
draw EquallySing { name = "eqC"; edges = (sc1, sc2); type = 3 }
draw EquallySing { name = "eqD"; edges = (sd1, sd2); type = 1 }
new Claster { name = "tabTan"; elements = (O2, wi, kAB, kBC, kCD, kDA, pA, pB, pC, pD, qab, qbc, qcd, qda, qabcd, sa1, sa2, sb1, sb2, sc1, sc2, sd1, sd2, eqA, eqB, eqC, eqD); active = false }

new UI { name = "btnCyc"; type = button; label = "Вписанный"; action = "tab = 1; tabCyc.active = true; tabTan.active = false" }
new UI { name = "btnTan"; type = button; label = "Описанный"; action = "tab = 2; tabCyc.active = false; tabTan.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float orient = 0;
float rin = 2.2;
float ptA = 0.38; float ptB = 0.63; float ptC = 0.88; float ptD = 0.10;
float ptAB = 0.02; float ptBC = 0.22; float ptCD = 0.55; float ptDA = 0.77;

// Угол в диапазон [0, 2π).
Function wrap(x) { if (x < 0) { return x + 2 * pi; } if (x >= 2 * pi) { return x - 2 * pi; } return x; }

Update {
  // Направление обхода по t (против или по часовой) определяем один раз по начальному положению.
  if (orient == 0) {
    orient = 1;
    if (wrap(atan2(kBC.pos.y, kBC.pos.x) - atan2(kAB.pos.y, kAB.pos.x)) > pi) { orient = -1; }
  }
  // Вписанный: порядок вершин A, B, C, D по окружности не должен нарушаться (иначе
  // получится самопересекающийся четырёхугольник), а соседние вершины не должны слипаться —
  // такой ход отменяется (проверка по промежуткам между соседними вершинами).
  float hA = orient * atan2(A.pos.y, A.pos.x); float hB = orient * atan2(B.pos.y, B.pos.x);
  float hC = orient * atan2(C.pos.y, C.pos.x); float hD = orient * atan2(D.pos.y, D.pos.x);
  float e1 = wrap(hB - hA); float e2 = wrap(hC - hB); float e3 = wrap(hD - hC); float e4 = wrap(hA - hD);
  if (min(e1, e2, e3, e4) < 0.1 || abs(e1 + e2 + e3 + e4 - 2 * pi) > 0.001) {
    A.t = ptA; B.t = ptB; C.t = ptC; D.t = ptD;
  } else {
    ptA = A.t; ptB = B.t; ptC = C.t; ptD = D.t;
  }
  // Углы точек касания (в направлении обхода) и промежутки между соседними.
  float fAB = orient * atan2(kAB.pos.y, kAB.pos.x); float fBC = orient * atan2(kBC.pos.y, kBC.pos.x);
  float fCD = orient * atan2(kCD.pos.y, kCD.pos.x); float fDA = orient * atan2(kDA.pos.y, kDA.pos.x);
  float gB = wrap(fBC - fAB); float gC = wrap(fCD - fBC); float gD = wrap(fDA - fCD); float gA = wrap(fAB - fDA);
  // Промежуток не меньше 0.6 и не больше 2.2 рад (иначе вершина слишком близко или далеко):
  // такой ход отменяется.
  float lo = min(gA, gB, gC, gD); float hi = max(gA, gB, gC, gD);
  if (lo < 0.6 || hi > 2.2 || abs(gA + gB + gC + gD - 2 * pi) > 0.001) {
    kAB.t = ptAB; kBC.t = ptBC; kCD.t = ptCD; kDA.t = ptDA;
    fAB = orient * atan2(kAB.pos.y, kAB.pos.x); fBC = orient * atan2(kBC.pos.y, kBC.pos.x);
    fCD = orient * atan2(kCD.pos.y, kCD.pos.x); fDA = orient * atan2(kDA.pos.y, kDA.pos.x);
    gB = wrap(fBC - fAB); gC = wrap(fCD - fBC); gD = wrap(fDA - fCD); gA = wrap(fAB - fDA);
  } else {
    ptAB = kAB.t; ptBC = kBC.t; ptCD = kCD.t; ptDA = kDA.t;
  }
  // Вершина между точками касания (fa, fb) с промежутком g: на биссектрисе, на расстоянии r / cos(g/2).
  float rB = rin / cos(gB / 2); float aB = orient * (fAB + gB / 2);
  float rC = rin / cos(gC / 2); float aC = orient * (fBC + gC / 2);
  float rD = rin / cos(gD / 2); float aD = orient * (fCD + gD / 2);
  float rA = rin / cos(gA / 2); float aA = orient * (fDA + gA / 2);
  pB.pos.x = rB * cos(aB); pB.pos.y = rB * sin(aB);
  pC.pos.x = rC * cos(aC); pC.pos.y = rC * sin(aC);
  pD.pos.x = rD * cos(aD); pD.pos.y = rD * sin(aD);
  pA.pos.x = rA * cos(aA); pA.pos.y = rA * sin(aA);

  if (tab == 1) {
    info = "**Вписанный четырёхугольник — все вершины на одной окружности. Сумма противоположных углов равна 180°:** ∠A + ∠C = " + format(angA.measure, 1) + "° + " + format(angC.measure, 1) + "° = " + format(angA.measure + angC.measure, 1) + "°, ∠B + ∠D = " + format(angB.measure, 1) + "° + " + format(angD.measure, 1) + "° = " + format(angB.measure + angD.measure, 1) + "°.\n\n**Теорема Птолемея:** AC · BD = " + format(ac.length, 2) + " · " + format(bd.length, 2) + " = " + format(ac.length * bd.length, 2) + " = AB · CD + BC · DA = " + format(ab.length * cd.length + bc.length * da.length, 2) + ".\n\nУсловие вписанности — про углы.";
  } else {
    float ta = rin * tan(gA / 2); float tb = rin * tan(gB / 2); float tc = rin * tan(gC / 2); float td = rin * tan(gD / 2);
    info = "**Описанный четырёхугольник — окружность касается всех четырёх сторон.** Отрезки касательных из одной вершины равны: из A — " + format(ta, 2) + ", из B — " + format(tb, 2) + ", из C — " + format(tc, 2) + ", из D — " + format(td, 2) + ".\n\n**Суммы противоположных сторон равны:** AB + CD = (" + format(ta, 2) + " + " + format(tb, 2) + ") + (" + format(tc, 2) + " + " + format(td, 2) + ") = " + format(qab.length + qcd.length, 2) + ", BC + DA = (" + format(tb, 2) + " + " + format(tc, 2) + ") + (" + format(td, 2) + " + " + format(ta, 2) + ") = " + format(qbc.length + qda.length, 2) + ".\n\nУсловие описанности — про стороны.";
  }
}
]
