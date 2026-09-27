[
description = "{info}"
field width = 14; field height = 12;
camera type = fixed;
float r = 3.5; string info = "";
new Point { name = "O"; pos = (0, 0) }
new Circle { name = "w"; center = O; radius = r }
new UI { type = slider; label = "радиус r"; variable = r; min = 1; max = 5; step = 0.1; default = 3.5 }
Update {
  info = "**Центр** окружности — точка O, равноудалённая от всех её точек; от неё отсчитывается радиус r = " + format(r, 1) + ", и положение центра однозначно определяет всю окружность.\n\nПри O = (" + format(O.pos.x, 1) + "; " + format(O.pos.y, 1) + ") уравнение окружности: (x − " + format(O.pos.x, 1) + ")² + (y − " + format(O.pos.y, 1) + ")² = " + format(r * r, 1) + ".";
}
]
