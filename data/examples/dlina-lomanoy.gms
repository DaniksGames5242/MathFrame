[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-6, -3) }
new Point { name = "B"; pos = (-3, 3) }
new Point { name = "C"; pos = (1, -1) }
new Point { name = "D"; pos = (4, 3) }
new Point { name = "E"; pos = (6, -2) }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3 }
new Line { name = "bc"; pos = (B, C); color = #3b82f6; thickness = 3 }
new Line { name = "cd"; pos = (C, D); color = #3b82f6; thickness = 3 }
new Line { name = "de"; pos = (D, E); color = #3b82f6; thickness = 3 }
Update {
  float L = ab.length + bc.length + cd.length + de.length;
  info = "**Длина ломаной** ABCDE равна сумме длин звеньев: " + format(ab.length, 2) + " + " + format(bc.length, 2) + " + " + format(cd.length, 2) + " + " + format(de.length, 2) + " = " + format(L, 2) + ".";
}
]
