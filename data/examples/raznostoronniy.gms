[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-4, -3) }
new Point { name = "B"; pos = (4, -3) }
new Point { name = "C"; pos = (1, 3) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
Update {
  string vid = "разносторонний: все три стороны разной длины"; if (abs(ab.length - bc.length) < 0.05 || abs(bc.length - ca.length) < 0.05 || abs(ca.length - ab.length) < 0.05) { vid = "сейчас не разносторонний — сдвиньте вершину, чтобы все стороны различались"; }
  info = "**Стороны треугольника ABC**: AB = " + format(ab.length, 1) + ", BC = " + format(bc.length, 1) + ", CA = " + format(ca.length, 1) + ".\n\nТреугольник " + vid + ".";
}
]
