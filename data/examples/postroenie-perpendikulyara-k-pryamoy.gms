[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-6, -2); text = true("A") }
new Point { name = "B"; pos = (6, 1); text = true("B") }
new Point { name = "P"; pos = (0, 4); text = true("P") }
new Point { name = "F"; pos = (0, -1); dynamic = false; collision = false; color = #3b82f6; text = true("F") }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "pf"; pos = (P, F); color = #3b82f6 }
new Line { name = "fb"; pos = (F, B); color = "transparent" }
new Angle { name = "ang1"; lines = (pf, fb); lock = true }
draw Angle { name = "da1"; angle = "ang1" }
Update {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float d2 = dx * dx + dy * dy;
  float t = ((P.pos.x - A.pos.x) * dx + (P.pos.y - A.pos.y) * dy) / d2;
  F.pos.x = A.pos.x + t * dx; F.pos.y = A.pos.y + t * dy;
  info = "**PF — перпендикуляр из точки P к прямой AB.** Из P проведена окружность, пересекающая AB в двух точках; из них — две равные дуги, пересекающиеся во второй точке. Прямая через P и эту точку встречает AB под прямым углом в основании F.";
}
]
