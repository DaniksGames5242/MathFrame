[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
new Point { name = "A"; pos = (-6, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-6, 4); text = true("C"); pauseOnDrag = false; pos = (-6, 4) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Angle { name = "angA"; lines = (ab, ca); lock = true }
draw Angle { name = "arcA"; angle = "angA" }
string info = "";
Update {
  float a = ab.length; float b = ca.length; float S = 0.5 * a * b;
  info = "**Прямоугольный треугольник**: угол при A равен 90°, катеты AB = " + format(a, 2) + " и AC = " + format(b, 2) + " перпендикулярны и играют роль основания и высоты друг для друга.\n\nS = ½·a·b = ½ · " + format(a, 2) + " · " + format(b, 2) + " = " + format(S, 2) + ".";
}
]
