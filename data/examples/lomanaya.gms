[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-6, -3) }
new Point { name = "B"; pos = (-2, 3) }
new Point { name = "C"; pos = (2, -2) }
new Point { name = "D"; pos = (6, 2) }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3 }
new Line { name = "bc"; pos = (B, C); color = #3b82f6; thickness = 3 }
new Line { name = "cd"; pos = (C, D); color = #3b82f6; thickness = 3 }
Update {
  info = "**Ломаная** ABCD состоит из трёх звеньев: AB, BC, CD, соединённых в вершинах B и C. Длины звеньев: AB = " + format(ab.length, 2) + ", BC = " + format(bc.length, 2) + ", CD = " + format(cd.length, 2) + ".";
}
]
