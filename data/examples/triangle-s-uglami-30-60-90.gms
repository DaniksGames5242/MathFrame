[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- A и B задают гипотенузу и перетаскиваются свободно; C пересчитывается в Update
// как поворот вектора AB на 30° (угол при A) и сжатие в cos30 раз — так угол при A
// всегда ровно 30°, угол при C — ровно 90° (проверяется живыми числами в описании). ----
new Point { name = "A"; pos = (-5, -2); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -2); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (5, 3.2); text = true("C"); dynamic = false; collision = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C); interact = false }
new Line { name = "ca"; pos = (C, A); interact = false }

new Figure { name = "abc"; elements = (ab, bc, ca) }

new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB"; count = 2 }
draw Angle { name = "arcC"; angle = "angC"; measure = false }

// ---- Логика ----
float cos30 = 0.8660254; float sin30 = 0.5;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Вершина C — поворот вектора AB на 30° вокруг A, сжатый в cos30 раз (длина AC = AB·cos30).
Function cx(ax, ay, bx, by) {
  float vx = bx - ax; float vy = by - ay;
  return ax + cos30 * (vx * cos30 - vy * sin30);
}
Function cy(ax, ay, bx, by) {
  float vx = bx - ax; float vy = by - ay;
  return ay + cos30 * (vx * sin30 + vy * cos30);
}

// Допустимо ли положение (ax, ay), (bx, by): обе точки и вычисленная C — в поле,
// гипотенуза не короче 0.35 (иначе треугольник вырождается в точку).
Function ok(ax, ay, bx, by) {
  if (!inField(ax, ay) || !inField(bx, by)) { return false; }
  if (!inField(cx(ax, ay, bx, by), cy(ax, ay, bx, by))) { return false; }
  float dx = bx - ax; float dy = by - ay;
  return sqrt(dx * dx + dy * dy) >= 0.35;
}

// Наибольшая доля пути (0..1) из (ax0,ay0)→(ax0+dx,ay0+dy) при неподвижной второй точке
// (ox, oy), при которой весь путь допустим (проверка по 16 промежуточным точкам, чтобы
// резкий рывок не «перепрыгнул» узкую вырожденную зону).
Function reach(ax0, ay0, dx, dy, ox, oy, movingA) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      float t = (i + 1) / 16;
      float ok2 = 0;
      if (movingA > 0.5) { if (ok(ax0 + dx * t, ay0 + dy * t, ox, oy)) { ok2 = 1; } }
      else { if (ok(ox, oy, ax0 + dx * t, ay0 + dy * t)) { ok2 = 1; } }
      if (ok2 > 0.5) { good = t; } else { bad = t; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2; float ok2 = 0;
    if (movingA > 0.5) { if (ok(ax0 + dx * mid, ay0 + dy * mid, ox, oy)) { ok2 = 1; } }
    else { if (ok(ox, oy, ax0 + dx * mid, ay0 + dy * mid)) { ok2 = 1; } }
    if (ok2 > 0.5) { good = mid; } else { bad = mid; }
  }
  return good;
}

float sx = 0; float sy = 0;
// Плавное ограничение хода точки: допустимая доля пути, затем остаток раскладывается
// по осям — точка скользит вдоль границы поля, а не «прилипает».
Function slide(px, py, nx, ny, ox, oy, movingA) {
  float t = reach(px, py, nx - px, ny - py, ox, oy, movingA);
  float ccx = px + (nx - px) * t; float ccy = py + (ny - py) * t;
  float rx = nx - ccx; float ry = ny - ccy;
  if (t < 1) {
    ccx = ccx + rx * reach(ccx, ccy, rx, 0, ox, oy, movingA);
    ccy = ccy + ry * reach(ccx, ccy, 0, ry, ox, oy, movingA);
  }
  sx = ccx; sy = ccy;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  if (mA >= mB && mA > 0.000001) {
    slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, 1);
    A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby;
  } else if (mB > mA && mB > 0.000001) {
    slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, 0);
    B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay;
  }
  // Страховка: если положение всё же нарушено, откатываем к последнему верному.
  if (!ok(A.pos.x, A.pos.y, B.pos.x, B.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  C.pos.x = cx(pax, pay, pbx, pby); C.pos.y = cy(pax, pay, pbx, pby);

  float a = bc.length; float bLeg = ca.length; float c = ab.length;
  float r = a * (sqrt(3) - 1) / 2; float R = a;
  info = "**Стороны треугольника с углами 30°, 60°, 90° соотносятся как 1 : √3 : 2:** меньший катет (напротив угла 30°) BC = " + format(a, 2) + ", больший катет (напротив угла 60°) AC = " + format(bLeg, 2) + " ≈ " + format(a, 2) + "·√3, гипотенуза AB = " + format(c, 2) + " ≈ 2·" + format(a, 2) + ".\n\n**Площадь:** S = ½ · AC · BC = " + format(0.5 * a * bLeg, 2) + ".\n\n**Радиус вписанной окружности** r = a(√3 − 1)/2 ≈ " + format(r, 2) + ", **радиус описанной** R = a ≈ " + format(R, 2) + ".";
}
]
