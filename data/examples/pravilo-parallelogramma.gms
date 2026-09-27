[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "A"; pos = (5, 1); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "B"; pos = (1, 4); pauseOnDrag = false; color = #f59e0b }
new Point { name = "C"; pos = (6, 5); dynamic = false; collision = false; size = 0.4; color = #22c55e }
new Line { name = "oa"; pos = (O, A); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "ob"; pos = (O, B); color = #f59e0b; thickness = 3; interact = false }
new Line { name = "bc"; pos = (B, C); color = #3b82f6; thickness = 2; interact = false }
new Line { name = "ac"; pos = (A, C); color = #f59e0b; thickness = 2; interact = false }
new Line { name = "oc"; pos = (O, C); color = #22c55e; thickness = 3; interact = false }
draw Vector { name = "va"; edge = "oa"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "vb"; edge = "ob"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vs"; edge = "oc"; pos = 1; color = #22c55e; thickness = 3 }
string info = "";
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Update {
  C.pos.x = A.pos.x + B.pos.x; C.pos.y = A.pos.y + B.pos.y;
  info = "**Правило параллелограмма:** векторы a = OA и b = OB отложены от общей точки O; стороны BC и AC равны и параллельны OA и OB — фигура OACB параллелограмм. Его диагональ OC из точки O — сумма a + b (зелёная).\n\na = (" + num(A.pos.x) + "; " + num(A.pos.y) + "), b = (" + num(B.pos.x) + "; " + num(B.pos.y) + "), a + b = (" + num(C.pos.x) + "; " + num(C.pos.y) + ").";
}
]
