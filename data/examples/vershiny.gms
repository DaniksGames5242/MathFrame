[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-5, 3); color = #f59e0b }
new Point { name = "B"; pos = (4, 4) }
new Point { name = "C"; pos = (5, -3) }
new Point { name = "D"; pos = (-4, -4) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "q"; elements = (ab, bc, cd, da) }
new Angle { name = "angA"; lines = (ab, da) }
draw Angle { name = "arcA"; angle = "angA" }
Update {
  info = "**Вершина A** (выделена) — точка излома ломаной ABCD, где сходятся две соседние стороны, AB и DA.\n\nОна принадлежит обеим сторонам сразу и служит вершиной внутреннего угла A = " + format(angA.measure, 0) + "°. Число вершин четырёхугольника всегда равно числу его сторон — четыре.";
}
]
