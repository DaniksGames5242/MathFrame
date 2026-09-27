[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); color = #f59e0b }
new Point { name = "M"; pos = (3, 2); color = #3b82f6 }
new Point { name = "F1"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }
new Point { name = "F2"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #3b82f6 }
new Line { name = "oF1"; pos = (O, F1) }
new Line { name = "oF2"; pos = (O, F2); color = #3b82f6 }
Update {
  float dx = M.pos.x - O.pos.x; float dy = M.pos.y - O.pos.y;
  float len = sqrt(dx * dx + dy * dy);
  if (len < 0.2) { len = 0.2; }
  F2.pos.x = O.pos.x + dx / len * 100; F2.pos.y = O.pos.y + dy / len * 100;
  F1.pos.x = O.pos.x - dx / len * 100; F1.pos.y = O.pos.y - dy / len * 100;
  info = "**Противоположные лучи** — два луча с общим началом O, лежащие на одной прямой, но направленные в разные стороны: синий через M и чёрный в противоположную сторону.\n\nВместе они составляют всю прямую: вне точки O у них нет общих точек, так как любая другая точка прямой лежит только по одну сторону от O.";
}
]
