[
description = "{info}"
field width = 18; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-1, 3) }
new Point { name = "B"; pos = (-5, -4) }
new Point { name = "C"; pos = (6, -4) }
new Point { name = "D"; pos = (-8, -4.5) }
new Point { name = "E"; pos = (-3, -1) }
new Point { name = "A1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "B1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "C1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Line { name = "sec"; pos = (A1, B1); color = #22c55e }
new Figure { name = "tri"; elements = (ab, bc, ca) }
Function tOnLine(p1x, p1y, p2x, p2y, q1x, q1y, q2x, q2y) {
  float dnm = (p2x - p1x) * (q2y - q1y) - (p2y - p1y) * (q2x - q1x);
  if (abs(dnm) < 0.0001) { dnm = 0.0001; }
  return ((q1x - p1x) * (q2y - q1y) - (q1y - p1y) * (q2x - q1x)) / dnm;
}
Update {
  float t1 = tOnLine(B.pos.x, B.pos.y, C.pos.x, C.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y);
  float t2 = tOnLine(C.pos.x, C.pos.y, A.pos.x, A.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y);
  float t3 = tOnLine(A.pos.x, A.pos.y, B.pos.x, B.pos.y, D.pos.x, D.pos.y, E.pos.x, E.pos.y);
  if (abs(t1) < 0.02) { t1 = 0.02; } if (abs(t2) < 0.02) { t2 = 0.02; } if (abs(t3) < 0.02) { t3 = 0.02; }
  A1.pos.x = B.pos.x + t1 * (C.pos.x - B.pos.x); A1.pos.y = B.pos.y + t1 * (C.pos.y - B.pos.y);
  B1.pos.x = C.pos.x + t2 * (A.pos.x - C.pos.x); B1.pos.y = C.pos.y + t2 * (A.pos.y - C.pos.y);
  C1.pos.x = A.pos.x + t3 * (B.pos.x - A.pos.x); C1.pos.y = A.pos.y + t3 * (B.pos.y - A.pos.y);
  float r1 = abs(1 - t2) / abs(t2); float r2 = abs(1 - t1) / abs(t1); float r3 = abs(1 - t3) / abs(t3);
  info = "Зелёная секущая пересекает прямые BC, CA, AB (стороны или их продолжения) в точках A₁, B₁, C₁. По теореме Менелая эти три точки коллинеарны тогда и только тогда, когда (AB₁/B₁C)·(CA₁/A₁B)·(BC₁/C₁A) = 1. Проверка: " + format(r1, 2) + " × " + format(r2, 2) + " × " + format(r3, 2) + " = " + format(r1 * r2 * r3, 2) + ".";
}
]
