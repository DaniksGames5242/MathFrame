[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float a = 3; float l = 4; string info = "";
new Point { name = "A"; pos = (-6, 0); dynamic = false; collision = false; active = false }
new Point { name = "B"; pos = (6, 0); dynamic = false; collision = false; active = false }
new Line { name = "base"; pos = (A, B); thickness = 4 }
new Point { name = "P1"; pos = (-3, 0); dynamic = false; collision = false; active = false }
new Point { name = "P2"; pos = (1, 0); dynamic = false; collision = false; active = false }
new Line { name = "fav"; pos = (P1, P2); thickness = 8; color = #3b82f6 }
new UI { type = slider; label = "начало зоны a"; variable = a; min = 0; max = 12 - l; step = 0.1; default = 3 }
new UI { type = slider; label = "длина зоны l"; variable = l; min = 0.5; max = 12; step = 0.1; default = 4 }
Update {
  P1.pos.x = -6 + a; P1.pos.y = 0; P2.pos.x = -6 + a + l; P2.pos.y = 0;
  info = "**Геометрическое определение вероятности**: точка бросается наудачу на отрезок длины L = 12; вероятность попадания в выделенную зону длины l равна отношению длин P = l/L.\n\nПри l = " + format(l, 1) + " вероятность P = " + format(l, 1) + "/12 = " + format(l / 12, 3) + ".";
}
]
