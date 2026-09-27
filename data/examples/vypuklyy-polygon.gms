[
description = "{info}"
field width = 14; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (0, 5) }
new Point { name = "B"; pos = (5, 1) }
new Point { name = "C"; pos = (3, -5) }
new Point { name = "D"; pos = (-3, -5) }
new Point { name = "E"; pos = (-5, 1) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "de"; pos = (D, E) }
new Line { name = "ea"; pos = (E, A) }
new Figure { name = "poly"; elements = (ab, bc, cd, de, ea) }
Function cr(p, q, r) { return (q.pos.x - p.pos.x) * (r.pos.y - q.pos.y) - (q.pos.y - p.pos.y) * (r.pos.x - q.pos.x); }
Update {
  float s1 = cr(A, B, C); float s2 = cr(B, C, D); float s3 = cr(C, D, E); float s4 = cr(D, E, A); float s5 = cr(E, A, B);
  float allPos = 0; if (s1 >= 0 && s2 >= 0 && s3 >= 0 && s4 >= 0 && s5 >= 0) { allPos = 1; }
  float allNeg = 0; if (s1 <= 0 && s2 <= 0 && s3 <= 0 && s4 <= 0 && s5 <= 0) { allNeg = 1; }
  string res = "невыпуклый: есть вершина с внутренним углом больше 180°, направление поворота контура в ней меняется";
  if (allPos > 0.5 || allNeg > 0.5) { res = "выпуклый: направление поворота при обходе контура не меняется, а отрезок между любыми двумя его точками лежит внутри фигуры"; }
  info = "Пятиугольник ABCDE сейчас **" + res + "**.";
}
]
