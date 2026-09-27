[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-5, 3) }
new Point { name = "B"; pos = (4, 4) }
new Point { name = "C"; pos = (5, -3) }
new Point { name = "D"; pos = (-4, -4) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "q"; elements = (ab, bc, cd, da) }
new Line { name = "ac"; pos = (A, C); color = #3b82f6 }
new Line { name = "bd"; pos = (B, D); color = #f59e0b }
Update {
  info = "**Диагонали четырёхугольника ABCD** — отрезки AC (синий) и BD (оранжевый), соединяющие противоположные вершины.\n\nAC = " + format(ac.length, 2) + ", BD = " + format(bd.length, 2) + ". Каждая диагональ разбивает четырёхугольник на два треугольника.";
}
]
