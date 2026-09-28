[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Прямоугольный треугольник, угол C заблокирован на 90°. Гипотенуза AB —
// диаметр описанной окружности, её середина O — центр этой окружности. ----
new Point { name = "A"; pos = (-5.5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5.5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0, 2.5); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B); color = #3b82f6 }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

new Angle { name = "angC"; lines = (ca, bc); lock = true }
draw Angle { name = "arcC"; angle = "angC"; measure = false }

new Point { name = "O"; construct = median; vertex = C; base = "ab"; dynamic = false; text = true("O") }
new Circle { name = "circ"; center = "O"; radius = "A"; interact = false }
new Line { name = "co"; pos = (C, O); interact = false }

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

  info = "**Гипотенуза AB** = " + format(ab.length, 2) + " — наибольшая сторона, так как лежит против прямого угла C = " + format(angC.measure, 0) + "°.\n\n**Длина через катеты:** AB = √(CA² + CB²) = √(" + format(ca.length * ca.length, 1) + " + " + format(bc.length * bc.length, 1) + ") = " + format(sqrt(ca.length * ca.length + bc.length * bc.length), 2) + ".\n\n**Служит диаметром описанной окружности:** её центр O — середина AB, медиана CO = " + format(co.length, 2) + " равна половине гипотенузы " + format(ab.length / 2, 2) + ".";
}
]
