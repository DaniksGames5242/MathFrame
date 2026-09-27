[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-6, 0); dynamic = false; collision = false }
new Point { name = "M"; pos = (2, 2); color = #3b82f6 }
new Point { name = "F"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false }
new Line { name = "aF"; pos = (A, F) }
Update {
  float dx = M.pos.x - A.pos.x; float dy = M.pos.y - A.pos.y;
  float len = sqrt(dx * dx + dy * dy);
  if (len < 0.2) { len = 0.2; }
  F.pos.x = A.pos.x + dx / len * 100; F.pos.y = A.pos.y + dy / len * 100;
  info = "**Луч AM** — часть прямой, ограниченная точкой A и бесконечно продолжающаяся через M в одну сторону. Точка A — начало луча, точка M задаёт его направление.\n\nЛюбая другая точка на этом же луче от A в сторону M даёт тот же самый луч.";
}
]
