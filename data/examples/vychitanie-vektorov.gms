[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "A"; pos = (5, 2); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "B"; pos = (1, 4); pauseOnDrag = false; color = #f59e0b }
new Line { name = "oa"; pos = (O, A); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "ob"; pos = (O, B); color = #f59e0b; thickness = 3; interact = false }
new Line { name = "ba"; pos = (B, A); color = #22c55e; thickness = 3; interact = false }
draw Vector { name = "va"; edge = "oa"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "vb"; edge = "ob"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vd"; edge = "ba"; pos = 1; color = #22c55e; thickness = 3 }
string info = "";
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Update {
  float dx = A.pos.x - B.pos.x; float dy = A.pos.y - B.pos.y;
  info = "**Вычитание векторов:** разность a − b — вектор, идущий из конца b в конец a, если оба отложены от общей точки O (зелёный BA).\n\na = (" + num(A.pos.x) + "; " + num(A.pos.y) + "), b = (" + num(B.pos.x) + "; " + num(B.pos.y) + "), a − b = (" + num(dx) + "; " + num(dy) + ").";
}
]
