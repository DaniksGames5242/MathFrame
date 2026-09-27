[
description = "{info}"
field width = 14; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (0, 5) }
new Point { name = "B"; pos = (5, 1) }
new Point { name = "C"; pos = (3, -5) }
new Point { name = "D"; pos = (0, -1) }
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
  float sum = 0; if (s1 >= 0) { sum = sum + 1; } if (s2 >= 0) { sum = sum + 1; } if (s3 >= 0) { sum = sum + 1; } if (s4 >= 0) { sum = sum + 1; } if (s5 >= 0) { sum = sum + 1; }
  string v = ""; if (sum <= 1) { if (s1 >= 0) { v = "B"; } if (s2 >= 0) { v = "C"; } if (s3 >= 0) { v = "D"; } if (s4 >= 0) { v = "E"; } if (s5 >= 0) { v = "A"; } }
  if (sum >= 4) { if (s1 < 0) { v = "B"; } if (s2 < 0) { v = "C"; } if (s3 < 0) { v = "D"; } if (s4 < 0) { v = "E"; } if (s5 < 0) { v = "A"; } }
  string res = "выпуклый — вогнутых вершин нет";
  if (v != "") { res = "невыпуклый: вершина " + v + " — вогнутая, угол при ней больше 180°, и две выходящие из неё стороны направлены внутрь многоугольника"; }
  info = "Пятиугольник ABCDE сейчас **" + res + "**.";
}
]
