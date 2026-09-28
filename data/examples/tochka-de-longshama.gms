[
description = "{info}"

field width = 22;
field height = 15;
camera type = fixed;

new Point { name = "A"; pos = (-7, -4); text = true("A") }
new Point { name = "B"; pos = (7, -4.5); text = true("B") }
new Point { name = "C"; pos = (1, 5); text = true("C") }

new Line { name = "ab"; pos = (A, B); interact = false }
new Line { name = "bc"; pos = (B, C); interact = false }
new Line { name = "ca"; pos = (C, A); interact = false }
new Figure { name = "abc"; elements = (ab, bc, ca); interact = false }

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; text = true("H") }
new Point { name = "G"; pos = (0, 0); dynamic = false; collision = false; text = true("G") }
new Point { name = "L"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; text = true("L") }
new Line { name = "euler"; pos = (H, L); interact = false; active = false }
draw Punctir { name = "eulerLine"; edge = "euler" }

string info = "";
float ix = 0; float iy = 0;

// Пересечение прямых P1 + t·D1 и P2 + s·D2 — результат в (ix, iy).
Function interLL(p1x, p1y, d1x, d1y, p2x, p2y, d2x, d2y) {
  float den = d1x * d2y - d1y * d2x;
  if (abs(den) < 0.000001) { return 0; }
  float t = ((p2x - p1x) * d2y - (p2y - p1y) * d2x) / den;
  ix = p1x + t * d1x; iy = p1y + t * d1y;
  return 1;
}

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float ax = A.pos.x; float ay = A.pos.y;
  float bx = B.pos.x; float by = B.pos.y;
  float cx = C.pos.x; float cy = C.pos.y;

  float ok1 = interLL(ax, ay, -(cy - by), cx - bx, bx, by, -(cy - ay), cx - ax);
  float hx = ix; float hy = iy;
  float ok2 = interLL((ax + bx) / 2, (ay + by) / 2, -(by - ay), bx - ax, (bx + cx) / 2, (by + cy) / 2, -(cy - by), cx - bx);
  float ox = ix; float oy = iy;

  if (ok1 == 1 && ok2 == 1) {
    H.pos.x = hx; H.pos.y = hy;
    O.pos.x = ox; O.pos.y = oy;
    G.pos.x = (ax + bx + cx) / 3; G.pos.y = (ay + by + cy) / 3;
    // Точка де Лонгшам — отражение ортоцентра относительно центра описанной окружности:
    // OL = 2·OH, L лежит на прямой Эйлера за H, вдвое дальше от O, чем H.
    float lx = 2 * ox - hx; float ly = 2 * oy - hy;
    L.pos.x = lx; L.pos.y = ly;

    float oh = sqrt((ox - hx) * (ox - hx) + (oy - hy) * (oy - hy));
    float ol = sqrt((ox - lx) * (ox - lx) + (oy - ly) * (oy - ly));

    info = "**L — точка де Лонгшам**, изогонально сопряжённая ортоцентру H. Она лежит на прямой Эйлера — той же, что O, G и H — и получается отражением H относительно центра описанной окружности O: OL = " + format(ol, 2) + " = 2 · OH = 2 · " + format(oh, 2) + " = " + format(2 * oh, 2) + ".\n\n**Внутри или снаружи треугольника.** У остроугольного треугольника L лежит вне треугольника, у тупоугольного — внутри, а при прямом угле совпадает с H.";
  }
}
]
