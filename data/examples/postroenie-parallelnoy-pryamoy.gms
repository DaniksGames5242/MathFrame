[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-6, -3); text = true("A") }
new Point { name = "B"; pos = (5, -1); text = true("B") }
new Point { name = "P"; pos = (-1, 3); text = true("P") }
new Point { name = "Q"; pos = (4, 4); dynamic = false; collision = false; color = #3b82f6; text = true("Q") }
new Point { name = "R"; pos = (-1, 3); dynamic = false; collision = false; active = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "pq"; pos = (P, Q); color = #3b82f6 }
new Line { name = "pa"; pos = (P, A) }
new Line { name = "pr"; pos = (P, R); color = "transparent" }
new Angle { name = "ang1"; lines = (pa, ab) }
new Angle { name = "ang2"; lines = (pr, pa) }
draw Angle { name = "da1"; angle = "ang1" }
draw Angle { name = "da2"; angle = "ang2" }
Update {
  Q.pos.x = P.pos.x + (B.pos.x - A.pos.x); Q.pos.y = P.pos.y + (B.pos.y - A.pos.y);
  R.pos.x = P.pos.x - (B.pos.x - A.pos.x); R.pos.y = P.pos.y - (B.pos.y - A.pos.y);
  info = "**Прямая PQ параллельна прямой AB.** Через P проведён отрезок PA к прямой AB — секущая. Угол PAB (" + format(ang1.measure, 1) + "°) и угол при вершине P, лежащий по другую сторону секущей (" + format(ang2.measure, 1) + "°), — накрест лежащие внутренние углы при этой секущей: они равны, это и есть признак параллельности PQ и AB.";
}
]
