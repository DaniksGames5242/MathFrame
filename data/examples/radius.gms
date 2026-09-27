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
  info = "**Радиус вписанной окружности** — расстояние от центра I до любой стороны, одно и то же для всех трёх сторон (a = " + format(a, 2) + ", b = " + format(b, 2) + ", c = " + format(c, 2) + ").\n\nr = S / p = " + format(S, 2) + " / " + format(p, 2) + " = " + format(r, 2) + ".";
}
]
