[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 4 }
new Point { name = "A"; circle = "w"; t = 0.1; text = true("A"); pauseOnDrag = false }
new Point { name = "B"; circle = "w"; t = 0.55; text = true("B"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3 }
string info = "";
Update {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y;
  float len = sqrt(dx * dx + dy * dy) + 0.000001;
  float d = abs(dx * (O.pos.y - A.pos.y) - dy * (O.pos.x - A.pos.x)) / len;
  info = "**Хорда** AB соединяет две точки окружности радиуса r = 4. Длина AB = " + format(len, 2) + ", расстояние от центра O до хорды d = " + format(d, 2) + ".\n\nНаибольшая длина хорды равна диаметру 2r = 8.0 и достигается, когда хорда проходит через центр (d = 0). Хорды одинаковой длины равноудалены от центра.";
}
]
