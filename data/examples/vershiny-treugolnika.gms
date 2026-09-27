[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float pax = -5; float pay = -3; float pbx = 5; float pby = -3; float pcx = 0; float pcy = 4; string info = "";
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0, 4); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
Update {
  float area = (B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y);
  if (abs(area) < 1) { A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy; }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
  float gx = (A.pos.x + B.pos.x + C.pos.x) / 3; float gy = (A.pos.y + B.pos.y + C.pos.y) / 3;
  info = "**Вершины треугольника** A, B, C — не лежат на одной прямой, каждая противолежит своей стороне: A — стороне BC, B — стороне CA, C — стороне AB.\n\nЦентр масс вершин G = (" + format(gx, 2) + "; " + format(gy, 2) + ") — это точка (A + B + C)/3, она всегда внутри треугольника.";
}
]
