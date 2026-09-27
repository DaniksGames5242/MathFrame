[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-4, -1) }
new Point { name = "B"; pos = (3, 2) }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3 }
Update {
  info = "**Длина отрезка** AB — неотрицательное число, равное нулю только когда A и B совпадают, и не зависящее от положения отрезка на плоскости.\n\nAB = √((xB − xA)² + (yB − yA)²) = " + format(ab.length, 2) + ".";
}
]
