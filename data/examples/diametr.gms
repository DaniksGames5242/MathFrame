[
description = "{info}"
field width = 12; field height = 12;
camera type = fixed;
float r = 4; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Circle { name = "w"; center = O; radius = r }
new Point { name = "A"; circle = "w"; t = 0.1 }
new Point { name = "B"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "ab"; pos = (A, B); color = #f59e0b }
new UI { type = slider; label = "радиус r"; variable = r; min = 1; max = 5.5; step = 0.1; default = 4 }
Update {
  B.pos.x = -A.pos.x; B.pos.y = -A.pos.y;
  info = "**Диаметр** AB проходит через центр O и делит окружность на две равные дуги; это наибольшая хорда окружности.\n\nПри любом положении A: AB = 2r = " + format(2 * r, 1) + " — вдвое длиннее радиуса, и точка O лежит ровно на середине AB.";
}
]
