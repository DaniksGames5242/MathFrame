[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
new Point { name = "A"; pos = (-5, -2); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "B"; pos = (0, 3); pauseOnDrag = false; color = #f59e0b }
new Point { name = "C"; pos = (5, -2); pauseOnDrag = false; color = #22c55e }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "bc"; pos = (B, C); color = #f59e0b; thickness = 3; interact = false }
new Line { name = "ac"; pos = (A, C); color = #22c55e; thickness = 3; interact = false }
draw Vector { name = "vab"; edge = "ab"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "vbc"; edge = "bc"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vac"; edge = "ac"; pos = 1; color = #22c55e; thickness = 3 }
string info = "";
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Update {
  float dx1 = B.pos.x - A.pos.x; float dy1 = B.pos.y - A.pos.y;
  float dx2 = C.pos.x - B.pos.x; float dy2 = C.pos.y - B.pos.y;
  info = "**Правило треугольника:** конец первого вектора AB совпадает с началом второго BC, а их сумма — вектор AC, идущий из начала первого в конец второго. Где бы ни стояла точка B, точка C — свободно.\n\nAB = (" + num(dx1) + "; " + num(dy1) + "), BC = (" + num(dx2) + "; " + num(dy2) + "), AB + BC = (" + num(dx1 + dx2) + "; " + num(dy1 + dy2) + "), а AC = (" + num(C.pos.x - A.pos.x) + "; " + num(C.pos.y - A.pos.y) + ") — совпадает.";
}
]
