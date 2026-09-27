[
description = "{info}"
field width = 14; field height = 14;
camera type = fixed;
float r = 3; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.3 }
new Circle { name = "w"; center = O; radius = r; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "радиус r"; variable = r; min = 1; max = 6; step = 0.1; default = 3 }
Update {
  info = "**Длина окружности** C = 2πr — предел периметров вписанных правильных многоугольников при неограниченном увеличении числа сторон.\n\nПри r = " + format(r, 1) + ": C = 2π × " + format(r, 1) + " ≈ " + format(6.2832 * r, 2) + ".";
}
]
