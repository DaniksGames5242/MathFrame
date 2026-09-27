[
description = "{info}"
field width = 12; field height = 12;
camera type = fixed;
float r = 4; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Circle { name = "w"; center = O; radius = r }
new Point { name = "A"; circle = "w"; t = 0.15; color = #f59e0b }
new Point { name = "B"; circle = "w"; t = 0.6; color = #22c55e }
new Line { name = "oa"; pos = (O, A); color = #f59e0b }
new Line { name = "ob"; pos = (O, B); color = #22c55e }
new UI { type = slider; label = "радиус r"; variable = r; min = 1; max = 5.5; step = 0.1; default = 4 }
Update {
  info = "**Радиус** — отрезок от центра O до точки окружности. Куда бы ни попали точки A и B на окружность, OA = OB = r = " + format(r, 1) + ": все точки окружности равноудалены от центра.\n\nДлина окружности C = 2πr = " + format(2 * pi * r, 2) + ", площадь круга S = πr² = " + format(pi * r * r, 2) + ".";
}
]
