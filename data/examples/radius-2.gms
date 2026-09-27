[
description = "{info}"
field width = 20; field height = 16;
camera type = fixed;
new Point { name = "A"; pos = (-6, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (6, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (1, 4); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "circ"; points = (A, B, C); color = #3b82f6 }
string info = "";
Update {
  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y;
  float d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (abs(d) < 0.001) { d = 0.001; }
  float a2 = ax * ax + ay * ay; float b2 = bx * bx + by * by; float c2 = cx * cx + cy * cy;
  O.pos.x = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d;
  O.pos.y = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d;
  float R = sqrt((O.pos.x - ax) * (O.pos.x - ax) + (O.pos.y - ay) * (O.pos.y - ay));
  float a = bc.length; float b = ca.length; float c = ab.length;
  float S = max(0.02, abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2);
  info = "**Радиус описанной окружности** R = OA = OB = OC = " + format(R, 2) + " — расстояние от центра O до каждой вершины треугольника.\n\nЧерез стороны и площадь: R = a·b·c / (4S) = " + format(a, 2) + " · " + format(b, 2) + " · " + format(c, 2) + " / (4 · " + format(S, 2) + ") = " + format(R, 2) + ".";
}
]
