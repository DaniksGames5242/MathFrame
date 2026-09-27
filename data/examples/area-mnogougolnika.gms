[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-4, 2) }
new Point { name = "B"; pos = (3, 3) }
new Point { name = "C"; pos = (4, -3) }
new Point { name = "D"; pos = (-3, -2) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "quad"; elements = (ab, bc, cd, da) }
draw Filling { name = "fill"; figure = "quad"; color = #3b82f6 }
Update {
  float s2 = (A.pos.x * B.pos.y - B.pos.x * A.pos.y) + (B.pos.x * C.pos.y - C.pos.x * B.pos.y) + (C.pos.x * D.pos.y - D.pos.x * C.pos.y) + (D.pos.x * A.pos.y - A.pos.x * D.pos.y);
  float s = abs(s2) / 2;
  info = "**Площадь** ABCD через координаты вершин (формула Гаусса): S = ½|Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)| = " + format(s, 2) + ".\n\nЕё можно проверить, разбив четырёхугольник диагональю на два треугольника и сложив их площади.";
}
]
