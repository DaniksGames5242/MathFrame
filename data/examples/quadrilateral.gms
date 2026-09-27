[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
new Point { name = "A"; pos = (-6, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (6, 4); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-4, 3); text = true("D"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "quad"; elements = (ab, bc, cd, da) }
new Point { name = "Mab"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Mbc"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Mcd"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Mda"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "vAC"; pos = (Mab, Mbc); color = #f59e0b }
new Line { name = "vBD"; pos = (Mbc, Mcd); color = #f59e0b }
new Line { name = "vCA"; pos = (Mcd, Mda); color = #f59e0b }
new Line { name = "vDB"; pos = (Mda, Mab); color = #f59e0b }
string info = "";
Update {
  Mab.pos.x = (A.pos.x + B.pos.x) / 2; Mab.pos.y = (A.pos.y + B.pos.y) / 2;
  Mbc.pos.x = (B.pos.x + C.pos.x) / 2; Mbc.pos.y = (B.pos.y + C.pos.y) / 2;
  Mcd.pos.x = (C.pos.x + D.pos.x) / 2; Mcd.pos.y = (C.pos.y + D.pos.y) / 2;
  Mda.pos.x = (D.pos.x + A.pos.x) / 2; Mda.pos.y = (D.pos.y + A.pos.y) / 2;
  float SQ = abs((B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (C.pos.x - A.pos.x) * (B.pos.y - A.pos.y)) / 2 + abs((C.pos.x - A.pos.x) * (D.pos.y - A.pos.y) - (D.pos.x - A.pos.x) * (C.pos.y - A.pos.y)) / 2;
  info = "**Четырёхугольник ABCD** — четыре стороны, две диагонали, сумма углов 2·180° = 360°.\n\n**Теорема Вариньона:** середины сторон (оранжевые точки) всегда образуют параллелограмм, площадь которого равна половине площади четырёхугольника ABCD = " + format(SQ, 2) + ".";
}
]
