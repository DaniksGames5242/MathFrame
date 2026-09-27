[
description = "{info}"
field width = 12; field height = 12;
camera type = fixed;
float r = 4; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Circle { name = "w"; center = O; radius = r }
new Point { name = "P"; circle = "w"; t = 0.2 }
new UI { type = slider; label = "радиус r"; variable = r; min = 1; max = 5.5; step = 0.1; default = 4 }
Update {
  float len = 2 * pi * r;
  float s = pi * r * r;
  info = "**Окружность** — множество точек (например P), равноудалённых от центра O на радиус r = " + format(r, 1) + ". Совокупно с внутренней областью она образует круг.\n\nДлина окружности C = 2πr = " + format(len, 2) + ", площадь круга S = πr² = " + format(s, 2) + ".";
}
]
