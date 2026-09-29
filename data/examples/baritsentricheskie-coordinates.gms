[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float ax0 = -6; float ay0 = -3.5; float bx0 = 5; float by0 = -3.5; float cx0 = -1; float cy0 = 4.5;
float al = 0.33; float be = 0.33; float ga = 0.34; string info = "";
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1, 4.5); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
new Point { name = "P"; pos = (0.5, 0.5); color = #f59e0b; text = true("P"); pauseOnDrag = false }
new Line { name = "pa"; pos = (P, A); color = #3b82f6; thickness = 1.5 }
new Line { name = "pb"; pos = (P, B); color = #22c55e; thickness = 1.5 }
new Line { name = "pc"; pos = (P, C); color = #f59e0b; thickness = 1.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function area2(px, py, qx, qy, rx, ry) { return (qx - px) * (ry - py) - (qy - py) * (rx - px); }
Update {
  float s2 = area2(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y);
  if (abs(s2) < 6) {
    A.pos.x = ax0; A.pos.y = ay0; B.pos.x = bx0; B.pos.y = by0; C.pos.x = cx0; C.pos.y = cy0;
    s2 = area2(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y);
  }
  ax0 = A.pos.x; ay0 = A.pos.y; bx0 = B.pos.x; by0 = B.pos.y; cx0 = C.pos.x; cy0 = C.pos.y;
  al = area2(P.pos.x, P.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y) / s2;
  be = area2(P.pos.x, P.pos.y, C.pos.x, C.pos.y, A.pos.x, A.pos.y) / s2;
  ga = 1 - al - be;
  float rx = al * A.pos.x + be * B.pos.x + ga * C.pos.x;
  float ry = al * A.pos.y + be * B.pos.y + ga * C.pos.y;
  string where = "внутри треугольника (все координаты положительны)";
  if (al < 0 || be < 0 || ga < 0) { where = "вне треугольника (есть отрицательная координата)"; }
  if (abs(al) < 0.01 || abs(be) < 0.01 || abs(ga) < 0.01) { where = "на прямой, содержащей сторону (одна из координат равна нулю)"; }
  info = "**Барицентрические координаты** точки P относительно треугольника ABC — числа (α : β : γ) с α + β + γ = 1, для которых P — центр масс масс α, β, γ, помещённых в вершины A, B, C: P = αA + βB + γC.\n\n**P = (" + num(al, 3) + " : " + num(be, 3) + " : " + num(ga, 3) + ")**, сумма = " + format(al + be + ga, 3) + ". Каждая координата — отношение (ориентированных) площадей: α = S(PBC) / S(ABC), β = S(PCA) / S(ABC), γ = S(PAB) / S(ABC).\n\nПроверка: αA + βB + γC = (" + num(rx, 2) + "; " + num(ry, 2) + "), P = (" + num(P.pos.x, 2) + "; " + num(P.pos.y, 2) + ").\n\nТочка P лежит " + where + ". В вершинах координаты (1 : 0 : 0), (0 : 1 : 0), (0 : 0 : 1), в центроиде (⅓ : ⅓ : ⅓).";
}
]
