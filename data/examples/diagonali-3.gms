[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
float w = 8; float h = 5; string info = "";
new Point { name = "A"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "B"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "D"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "q"; elements = (ab, bc, cd, da) }
new Line { name = "ac"; pos = (A, C); color = #3b82f6 }
new Line { name = "bd"; pos = (B, D); color = #f59e0b }
new UI { type = slider; label = "ширина"; variable = w; min = 3; max = 14; step = 0.5; default = 8 }
new UI { type = slider; label = "высота"; variable = h; min = 3; max = 9; step = 0.5; default = 5 }
Update {
  A.pos.x = -w / 2; A.pos.y = -h / 2; B.pos.x = w / 2; B.pos.y = -h / 2;
  C.pos.x = w / 2; C.pos.y = h / 2; D.pos.x = -w / 2; D.pos.y = h / 2;
  info = "**Диагонали прямоугольника ABCD** AC (синяя) и BD (оранжевая) равны по длине: AC = " + format(ac.length, 2) + ", BD = " + format(bd.length, 2) + " — при любых размерах сторон.";
}
]
