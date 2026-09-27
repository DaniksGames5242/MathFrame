[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-4, -3) }
new Point { name = "B"; pos = (-3, 3) }
new Point { name = "C"; pos = (3, 2) }
new Point { name = "D"; pos = (4, -3) }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3 }
new Line { name = "bc"; pos = (B, C); color = #3b82f6; thickness = 3 }
new Line { name = "cd"; pos = (C, D); color = #3b82f6; thickness = 3 }
new Line { name = "da"; pos = (D, A); color = #3b82f6; thickness = 3 }
new Figure { name = "fig"; elements = (ab, bc, cd, da) }
Update {
  info = "**Замкнутая ломаная** ABCD: последняя вершина D соединена звеном DA с первой вершиной A, поэтому у контура нет концов — каждая вершина принадлежит двум звеньям. Периметр = " + format(ab.length + bc.length + cd.length + da.length, 2) + ".";
}
]
