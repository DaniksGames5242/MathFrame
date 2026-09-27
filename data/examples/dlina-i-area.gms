[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float R = 3; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "c"; center = O; radius = R }
new UI { type = slider; label = "радиус R"; variable = R; min = 0.5; max = 4.5; step = 0.1; default = 3 }
Update {
  float L = 6.2832 * R; float S = 3.1416 * R * R;
  info = "**Окружность** радиуса R = " + format(R, 1) + ": длина L = 2πR = " + format(L, 2) + ".\n\n**Круг** той же окружности: площадь S = πR² = " + format(S, 2) + ".";
}
]
