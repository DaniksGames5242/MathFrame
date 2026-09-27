[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-6, -1) }
new Point { name = "B"; pos = (-3, 3) }
new Point { name = "C"; pos = (0, -1.5) }
new Point { name = "D"; pos = (3, 3) }
new Point { name = "E"; pos = (6, -1) }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3 }
new Line { name = "bc"; pos = (B, C); color = #3b82f6; thickness = 3 }
new Line { name = "cd"; pos = (C, D); color = #3b82f6; thickness = 3 }
new Line { name = "de"; pos = (D, E); color = #3b82f6; thickness = 3 }
Update {
  float c1 = (B.pos.x - A.pos.x) * (C.pos.y - B.pos.y) - (B.pos.y - A.pos.y) * (C.pos.x - B.pos.x);
  float c2 = (C.pos.x - B.pos.x) * (D.pos.y - C.pos.y) - (C.pos.y - B.pos.y) * (D.pos.x - C.pos.x);
  float c3 = (D.pos.x - C.pos.x) * (E.pos.y - D.pos.y) - (D.pos.y - C.pos.y) * (E.pos.x - D.pos.x);
  string res = "выпуклая — все звенья поворачивают в одну сторону";
  if (!((c1 > 0 && c2 > 0 && c3 > 0) || (c1 < 0 && c2 < 0 && c3 < 0))) { res = "невыпуклая — в одной из вершин поворот идёт в другую сторону"; }
  info = "Ломаная ABCDE сейчас **" + res + "**.";
}
]
