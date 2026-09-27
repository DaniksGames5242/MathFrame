[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-6, -2); dynamic = false; collision = false }
new Point { name = "B"; pos = (6, 2); dynamic = false; collision = false }
new Line { name = "l1"; pos = (A, B) }
new Point { name = "C"; pos = (-5, 3) }
new Point { name = "D"; pos = (5, -1) }
new Line { name = "l2"; pos = (C, D); color = #3b82f6 }
Update {
  float cr = (B.pos.x - A.pos.x) * (D.pos.y - C.pos.y) - (B.pos.y - A.pos.y) * (D.pos.x - C.pos.x);
  float onl = (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y) - (C.pos.y - A.pos.y) * (B.pos.x - A.pos.x);
  info = "Чёрная прямая AB фиксирована, синюю CD задают две свободные точки.\n\n";
  if (abs(cr) > 0.3) { info = info + "Прямые пересекаются: направляющие векторы не коллинеарны."; }
  if (abs(cr) <= 0.3) {
    if (abs(onl) > 0.3) { info = info + "Прямые параллельны и различны: направляющие векторы коллинеарны, но точка C не лежит на AB."; }
    if (abs(onl) <= 0.3) { info = info + "**Прямые совпадают** — направляющие векторы коллинеарны, и точка C лежит на прямой AB: у прямых одно и то же множество точек."; }
  }
}
]
