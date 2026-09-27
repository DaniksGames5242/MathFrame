[
description = "{info}"
field width = 16; field height = 16;
camera type = fixed;
float R = 3; float n = 3; float r = 1; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.25 }
new Circle { name = "fix"; center = O; radius = R; color = #f59e0b; thickness = 1.5 }
new Curve { name = "ep"; type = parametric; x = "(R + r) * cos(6.2832 * t) - r * cos((R + r) / r * 6.2832 * t)"; y = "(R + r) * sin(6.2832 * t) - r * sin((R + r) / r * 6.2832 * t)"; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "R / r"; variable = n; min = 2; max = 5; step = 1; default = 3 }
Update {
  r = R / n;
  info = "**Эпициклоида** — траектория точки подвижной окружности радиуса r (катится по внешней стороне неподвижной окружности радиуса R, оранжевая), без проскальзывания.\n\nПри R/r = " + format(n, 0) + " (целое число) кривая замкнута и состоит из " + format(n, 0) + " арок.";
}
]
