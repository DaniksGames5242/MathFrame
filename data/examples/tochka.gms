[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
new Point { name = "A"; pos = (2, 1); text = true("A") }
string info = "";
show axes = true; show grid = true;
Update {
  info = "**Точка** не имеет размеров — ни длины, ни площади — и служит только для указания положения на плоскости. Положение A задаётся координатами: A(" + format(A.pos.x, 1) + "; " + format(A.pos.y, 1) + ").";
}
]
