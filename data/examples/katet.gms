[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Прямоугольный треугольник с прямым углом при C (заблокирован). Катет CA
// выделен цветом. Показаны его проекция на гипотенузу и высота из C. ----
new Point { name = "A"; pos = (-6, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-0.5, 2.5); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A); color = #3b82f6 }
new Figure { name = "abc"; elements = (ab, bc, ca) }

new Angle { name = "angC"; lines = (ca, bc); lock = true }
draw Angle { name = "arcC"; angle = "angC"; measure = false }

// Высота из C на гипотенузу и проекция катета CA (точка H — основание высоты).
new Point { name = "H"; construct = altitude; vertex = C; base = "ab"; dynamic = false; text = true("H") }
new Line { name = "ch"; pos = (C, H); interact = false }
new Line { name = "ah"; pos = (A, H); interact = false; color = #f59e0b }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
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
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  float proj = ah.length;
  info = "**Катет CA** = " + format(ca.length, 2) + " — короче гипотенузы AB = " + format(ab.length, 2) + ", так как лежит против острого угла B.\n\n**Проекция CA на гипотенузу:** AH = " + format(proj, 2) + " = CA² / AB = " + format(ca.length * ca.length / ab.length, 2) + ".\n\n**Высота CH** = " + format(ch.length, 2) + " — среднее пропорциональное между проекциями катетов: CH² = " + format(ch.length * ch.length, 2) + ", AH · HB = " + format(proj * (ab.length - proj), 2) + ".";
}
]
