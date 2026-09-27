[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "S1"; pos = (-1, -4) }
new Point { name = "S2"; pos = (2, 4) }
new Point { name = "A"; pos = (-4, 2); text = true("A") }
new Point { name = "A2"; pos = (2, 2); dynamic = false; collision = false; color = #3b82f6; text = true("A'") }
new Line { name = "axis"; pos = (S1, S2) }
new Line { name = "aa2"; pos = (A, A2); color = #3b82f6 }
Update {
  float dx = S2.pos.x - S1.pos.x; float dy = S2.pos.y - S1.pos.y; float d2 = dx * dx + dy * dy;
  float t = ((A.pos.x - S1.pos.x) * dx + (A.pos.y - S1.pos.y) * dy) / d2;
  float fx = S1.pos.x + t * dx; float fy = S1.pos.y + t * dy;
  A2.pos.x = 2 * fx - A.pos.x; A2.pos.y = 2 * fy - A.pos.y;
  float dA = sqrt((A.pos.x - fx) * (A.pos.x - fx) + (A.pos.y - fy) * (A.pos.y - fy));
  info = "**Точка A' симметрична точке A относительно прямой.** Отрезок AA' перпендикулярен оси и делится ею пополам: расстояние от A до оси равно расстоянию от A' до оси и равно " + format(dA, 2) + ". Все точки самой оси при этом отображении неподвижны.";
}
]
