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
new Point { name = "H"; pos = (0, -4); dynamic = false; collision = false; text = true("H") }
new Line { name = "hgt"; pos = (C, H) }
string info = "";
Update {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y;
  float t = ((C.pos.x - A.pos.x) * dx + (C.pos.y - A.pos.y) * dy) / (dx * dx + dy * dy);
  H.pos.x = A.pos.x + t * dx; H.pos.y = A.pos.y + t * dy;
  float a = ab.length;
  float S = max(0.02, abs((B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y)) / 2);
  float h = 2 * S / a;
  info = "**Площадь треугольника** через основание AB (a = " + format(a, 2) + ") и высоту h = " + format(h, 2) + ", опущенную из C: S = ½·a·h = ½ · " + format(a, 2) + " · " + format(h, 2) + " = " + format(S, 2) + ".\n\nПлощадь не зависит от выбора стороны за основание — с любой другой стороной результат будет тем же.";
}
]
