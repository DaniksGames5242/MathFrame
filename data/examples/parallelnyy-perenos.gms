[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float dx = 3; float dy = 1; string info = "";
new Point { name = "A"; pos = (-3, -2); pauseOnDrag = false }
new Point { name = "A1"; pos = (0, -1); dynamic = false; collision = false; color = #22c55e }
new Line { name = "aa1"; pos = (A, A1); color = #22c55e }
new UI { type = slider; label = "вектор переноса — x"; variable = dx; min = -5; max = 5; step = 0.5; default = 3 }
new UI { type = slider; label = "вектор переноса — y"; variable = dy; min = -3; max = 3; step = 0.5; default = 1 }
Update {
  A1.pos.x = A.pos.x + dx; A1.pos.y = A.pos.y + dy;
  info = "**Параллельный перенос** на вектор (" + format(dx,1) + "; " + format(dy,1) + ") переводит A(" + format(A.pos.x,1) + "; " + format(A.pos.y,1) + ") в A′(" + format(A1.pos.x,1) + "; " + format(A1.pos.y,1) + ").\n\nОтрезок AA′ параллелен вектору переноса, а его длина равна длине вектора: " + format(sqrt(dx*dx+dy*dy),2) + ".";
}
]
