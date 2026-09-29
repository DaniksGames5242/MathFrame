[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// Ромб с прямым углом при A: A и B свободны (задают положение, поворот и размер),
// D получается поворотом вектора AB на 90° вокруг A (значит AD = AB и угол A прямой
// по построению), C замыкает параллелограмм. Такая фигура — всегда квадрат.
new Point { name = "A"; pos = (-3, -2); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (2, -2); text = true("B"); pauseOnDrag = false }
new Point { name = "D"; dynamic = false; collision = false; interact = false; text = true("D") }
new Point { name = "C"; dynamic = false; collision = false; interact = false; text = true("C") }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Angle { name = "angA"; lines = (ab, da) }
draw Angle { name = "arcA"; angle = "angA"; measure = false }

new Line { name = "ac"; pos = (A, C); active = false; interact = false }
new Line { name = "bd"; pos = (B, D); active = false; interact = false }

string info = "";
float pax = -3; float pay = -2; float pbx = 2; float pby = -2;
float rx = 0; float ry = 0; float tv = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

// Допустимо ли положение (ax, ay), (bx, by): D и C, вычисленные поворотом AB на 90°
// вокруг A, тоже остаются в поле, а сторона не короче 0.35 (вершины не сливаются).
Function shapeOk(ax, ay, bx, by) {
  float dx = ax - (by - ay); float dy = ay + (bx - ax);
  float cx = bx + dx - ax; float cy = by + dy - ay;
  float side = sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
  if (side < 0.35) { return false; }
  return inField(ax, ay) && inField(bx, by) && inField(dx, dy) && inField(cx, cy);
}

// Наибольшая доля t хода (ax0,ay0,bx0,by0) -> (+dax,+day,+dbx,+dby), при которой фигура
// остаётся допустимой на всём пути (проверка по 16 промежуточным точкам, чтобы резкий
// рывок не «перепрыгнул» вырожденное положение, затем уточнение делением пополам).
Function reach(ax0, ay0, bx0, by0, dax, day, dbx, dby) {
  float good = 0; float bad = 2;
  repeat (16) {
    float t = (i + 1) / 16;
    if (bad > 1) {
      if (shapeOk(ax0 + dax * t, ay0 + day * t, bx0 + dbx * t, by0 + dby * t)) { good = t; } else { bad = t; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (shapeOk(ax0 + dax * mid, ay0 + day * mid, bx0 + dbx * mid, by0 + dby * mid)) { good = mid; } else { bad = mid; }
  }
  return good;
}

Start { pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; }

Update {
  float dax = A.pos.x - pax; float day = A.pos.y - pay;
  float dbx = B.pos.x - pbx; float dby = B.pos.y - pby;
  float m = abs(dax) + abs(day) + abs(dbx) + abs(dby);
  float diff = abs(dax - dbx) + abs(day - dby);
  if (m > 0.000001) {
    if (diff < 0.000001) {
      // Фигуру тащат целиком (A и B сдвинуты на один вектор) — сдвигаем обе вместе.
      tv = reach(pax, pay, pbx, pby, dax, day, dbx, dby);
      A.pos.x = pax + dax * tv; A.pos.y = pay + day * tv;
      B.pos.x = pbx + dbx * tv; B.pos.y = pby + dby * tv;
    } else if (abs(dax) + abs(day) >= abs(dbx) + abs(dby)) {
      tv = reach(pax, pay, pbx, pby, dax, day, 0, 0);
      A.pos.x = pax + dax * tv; A.pos.y = pay + day * tv;
      B.pos.x = pbx; B.pos.y = pby;
    } else {
      tv = reach(pax, pay, pbx, pby, 0, 0, dbx, dby);
      B.pos.x = pbx + dbx * tv; B.pos.y = pby + dby * tv;
      A.pos.x = pax; A.pos.y = pay;
    }
  }
  D.pos.x = A.pos.x - (B.pos.y - A.pos.y); D.pos.y = A.pos.y + (B.pos.x - A.pos.x);
  C.pos.x = B.pos.x + D.pos.x - A.pos.x; C.pos.y = B.pos.y + D.pos.y - A.pos.y;
  // Страховка: если кадр всё же дал недопустимое положение, откатываемся целиком.
  if (!shapeOk(A.pos.x, A.pos.y, B.pos.x, B.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    D.pos.x = A.pos.x - (B.pos.y - A.pos.y); D.pos.y = A.pos.y + (B.pos.x - A.pos.x);
    C.pos.x = B.pos.x + D.pos.x - A.pos.x; C.pos.y = B.pos.y + D.pos.y - A.pos.y;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;

  info = "**Ромб с прямым углом** — все стороны равны и все углы прямые, то есть квадрат: AB = BC = CD = DA = " + format(ab.length, 2) + ".\n\n**Диагонали равны и перпендикулярны:** AC = BD = " + format(ac.length, 2) + ".";
}
]
