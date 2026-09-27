[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-4, -2); pauseOnDrag = false }
new Point { name = "B"; pos = (-1, 1); pauseOnDrag = false }
new Point { name = "C"; pos = (2, -2); pauseOnDrag = false }
new Point { name = "D"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Line { name = "ab"; pos = (A, B); color = #3b82f6 }
draw Vector { name = "vab"; edge = "ab" }
new Line { name = "cd"; pos = (C, D); color = #22c55e }
draw Vector { name = "vcd"; edge = "cd" }
Update {
  D.pos.x = C.pos.x + (B.pos.x - A.pos.x); D.pos.y = C.pos.y + (B.pos.y - A.pos.y);
  float len = sqrt((B.pos.x-A.pos.x)*(B.pos.x-A.pos.x)+(B.pos.y-A.pos.y)*(B.pos.y-A.pos.y));
  info = "**Вектор AB** — направленный отрезок от начала A к концу B, |AB| = " + format(len,2) + ".\n\nЗелёный вектор CD равен AB: он получен переносом AB так, что начало попало в C — длина и направление те же, положение любое.";
}
]
