[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float R = 3; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "c"; center = O; radius = R }
new UI { type = slider; label = "радиус R"; variable = R; min = 0.5; max = 4.5; step = 0.1; default = 3 }
Update {
  float S = 3.1416 * R * R;
  info = "**Площадь круга** радиуса R = " + format(R, 1) + ": S = πR² = π × " + format(R, 1) + "² ≈ " + format(S, 2) + ".";
}
]
