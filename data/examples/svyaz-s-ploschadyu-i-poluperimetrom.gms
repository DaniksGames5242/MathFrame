[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
new Point { name = "A"; pos = (-6, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (6, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (1, 5); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; text = true("I") }
float r = 1;
new Circle { name = "inc"; center = "I"; radius = r; color = #3b82f6 }
string info = "";
Update {
  float a = bc.length; float b = ca.length; float c = ab.length; float per = a + b + c;
  I.pos.x = (a * A.pos.x + b * B.pos.x + c * C.pos.x) / per;
  I.pos.y = (a * A.pos.y + b * B.pos.y + c * C.pos.y) / per;
  float p = per / 2;
  float S = max(0.02, abs((B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y)) / 2);
  r = S / p;
  info = "**S = p · r**: площадь треугольника равна произведению полупериметра на радиус вписанной окружности, ведь треугольник разбивается на три треугольника с общей вершиной I и высотой r к каждой стороне.\n\np = " + format(p, 2) + ", r = " + format(r, 2) + ", S = p · r = " + format(p, 2) + " · " + format(r, 2) + " = " + format(p * r, 2) + " (совпадает с площадью, вычисленной напрямую: " + format(S, 2) + ").";
}
]
