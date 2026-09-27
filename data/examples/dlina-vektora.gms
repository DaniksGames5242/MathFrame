[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "A"; pos = (4, 3); pauseOnDrag = false }
new Line { name = "oa"; pos = (O, A); color = #3b82f6 }
draw Vector { name = "voa"; edge = "oa" }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float dx = A.pos.x; float dy = A.pos.y; float len = sqrt(dx*dx+dy*dy);
  info = "**Длина вектора OA** — расстояние от начала до конца: при координатах (" + num(dx,1) + "; " + num(dy,1) + ") длина |OA| = √(x² + y²) = √(" + num(dx,1) + "² + " + num(dy,1) + "²) = **" + format(len,2) + "**.";
}
]
