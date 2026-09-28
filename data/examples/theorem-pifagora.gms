[
description = "{info}"

field width = 24;
field height = 18;
camera type = fixed;

// ---- Прямоугольный треугольник (угол C заблокирован на 90°) с квадратами,
// построенными на всех трёх сторонах: сумма площадей квадратов на катетах равна
// площади квадрата на гипотенузе — теорема Пифагора. ----
new Point { name = "A"; pos = (-2, 2); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (2, -2); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-2, -2); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }
new Angle { name = "angC"; lines = (ca, bc); lock = true }
draw Angle { name = "arcC"; angle = "angC"; measure = false }

// Вершины квадратов на сторонах — вычисляемые точки (поворот стороны на 90° наружу).
new Point { name = "Sa1"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Sa2"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Sb1"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Sb2"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Sc1"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Sc2"; pos = (0, 0); dynamic = false; collision = false }

new Line { name = "qa1"; pos = (B, Sa1); interact = false; color = #f59e0b }
new Line { name = "qa2"; pos = (Sa1, Sa2); interact = false; color = #f59e0b }
new Line { name = "qa3"; pos = (Sa2, C); interact = false; color = #f59e0b }
new Line { name = "qb1"; pos = (C, Sb1); interact = false; color = #f59e0b }
new Line { name = "qb2"; pos = (Sb1, Sb2); interact = false; color = #f59e0b }
new Line { name = "qb3"; pos = (Sb2, A); interact = false; color = #f59e0b }
new Line { name = "qc1"; pos = (A, Sc1); interact = false; color = #3b82f6 }
new Line { name = "qc2"; pos = (Sc1, Sc2); interact = false; color = #3b82f6 }
new Line { name = "qc3"; pos = (Sc2, B); interact = false; color = #3b82f6 }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;
Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

// Строит квадраты наружу на всех трёх сторонах треугольника A, B, C.
Function buildSquares() {
  float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y; float ax = A.pos.x; float ay = A.pos.y;
  float ux = cx - bx; float uy = cy - by;
  float nx = -uy; float ny = ux;
  float sign = 1; if ((nx * (ax - bx) + ny * (ay - by)) > 0) { sign = -1; }
  Sa1.pos.x = bx + sign * nx; Sa1.pos.y = by + sign * ny;
  Sa2.pos.x = cx + sign * nx; Sa2.pos.y = cy + sign * ny;

  float vx = ax - cx; float vy = ay - cy;
  float mx = -vy; float my = vx;
  float sign2 = 1; if ((mx * (bx - cx) + my * (by - cy)) > 0) { sign2 = -1; }
  Sb1.pos.x = cx + sign2 * mx; Sb1.pos.y = cy + sign2 * my;
  Sb2.pos.x = ax + sign2 * mx; Sb2.pos.y = ay + sign2 * my;

  float wx = bx - ax; float wy = by - ay;
  float px = -wy; float py = wx;
  float sign3 = 1; if ((px * (cx - ax) + py * (cy - ay)) > 0) { sign3 = -1; }
  Sc1.pos.x = ax + sign3 * px; Sc1.pos.y = ay + sign3 * py;
  Sc2.pos.x = bx + sign3 * px; Sc2.pos.y = by + sign3 * py;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
  buildSquares();
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  if (m >= 0.000001) {
    if (!inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y)) {
      A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
    }
  }
  buildSquares();
  // Страховка: если построенные квадраты вышли за поле, откатываем вершины треугольника
  // и пересчитываем квадраты заново по прежнему (корректному) положению.
  if (!inField(Sa1.pos.x, Sa1.pos.y) || !inField(Sa2.pos.x, Sa2.pos.y) || !inField(Sb1.pos.x, Sb1.pos.y)
      || !inField(Sb2.pos.x, Sb2.pos.y) || !inField(Sc1.pos.x, Sc1.pos.y) || !inField(Sc2.pos.x, Sc2.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
    buildSquares();
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  float a2 = bc.length * bc.length;
  float b2 = ca.length * ca.length;
  float c2 = ab.length * ab.length;

  info = "**Квадраты на катетах** (жёлтые), со сторонами a = BC = " + format(bc.length, 2) + " и b = CA = " + format(ca.length, 2) + ": a² = " + format(a2, 1) + ", b² = " + format(b2, 1) + ", a² + b² = " + format(a2 + b2, 1) + ".\n\n**Квадрат на гипотенузе** (синий) со стороной c = AB = " + format(ab.length, 2) + ": c² = " + format(c2, 1) + ".\n\n**Площади равны:** c² = a² + b² — теорема Пифагора.";
}
]
