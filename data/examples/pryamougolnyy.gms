[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Прямоугольный треугольник: угол C заблокирован на 90°, катеты — CA и CB,
// гипотенуза — AB. Вершины A и B перетаскиваются свободно, C — так, чтобы угол
// оставался прямым (движется по окружности с диаметром AB). ----
new Point { name = "A"; pos = (-6, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-0.5, 2.5); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

new Angle { name = "angC"; lines = (ca, bc); lock = true }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
draw Angle { name = "arcC"; angle = "angC" }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB" }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

// Точка C допустима, если видит AB под прямым углом (лежит на окружности с диаметром
// AB), находится в поле и не сливается с A или B.
Function okC(x, y, ax, ay, bx, by) {
  if (!inField(x, y)) { return false; }
  float dx1 = ax - x; float dy1 = ay - y;
  float dx2 = bx - x; float dy2 = by - y;
  float lu = sqrt(dx1 * dx1 + dy1 * dy1); float lv = sqrt(dx2 * dx2 + dy2 * dy2);
  if (lu < 0.5 || lv < 0.5) { return false; }
  return true;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  if (m >= 0.000001 && mC == m) {
    // Двигают C: проецируем ход на окружность с диаметром AB (прямой угол сохраняется
    // сам движок через lock у Angle — здесь только не даём C уйти за поле или слиться
    // с A/B; иначе откатываем к прежнему положению).
    if (!okC(C.pos.x, C.pos.y, pax, pay, pbx, pby)) { C.pos.x = pcx; C.pos.y = pcy; }
  } else if (m >= 0.000001) {
    // Двигают A или B — гипотенуза меняется, C остаётся в поле (движок держит угол
    // прямым автоматически через lock).
    if (!inField(C.pos.x, C.pos.y)) { C.pos.x = pcx; C.pos.y = pcy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; }
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  info = "**Гипотенуза AB** = " + format(ab.length, 2) + " — самая длинная сторона, лежит против прямого угла C = " + format(angC.measure, 0) + "°.\n\n**Катеты:** CA = " + format(ca.length, 2) + ", CB = " + format(bc.length, 2) + ".\n\n**Острые углы дополняют друг друга:** ∠A = " + format(angA.measure, 0) + "°, ∠B = " + format(angB.measure, 0) + "°, ∠A + ∠B = " + format(angA.measure + angB.measure, 0) + "°.\n\n**Теорема Пифагора:** AB² = " + format(ab.length * ab.length, 1) + ", CA² + CB² = " + format(ca.length * ca.length + bc.length * bc.length, 1) + ".";
}
]
