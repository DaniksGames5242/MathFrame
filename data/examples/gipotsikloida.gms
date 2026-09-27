[
description = "{info}"
field width = 16; field height = 16;
camera type = fixed;
float R = 3; float n = 4; float r = 0.75; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.25 }
new Circle { name = "fix"; center = O; radius = R; color = #f59e0b; thickness = 1.5 }
new Curve { name = "hy"; type = parametric; x = "(R - r) * cos(6.2832 * t) + r * cos((R - r) / r * 6.2832 * t)"; y = "(R - r) * sin(6.2832 * t) - r * sin((R - r) / r * 6.2832 * t)"; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "R / r"; variable = n; min = 2; max = 6; step = 1; default = 4 }
Update {
  r = R / n;
  string name = "кривая"; if (n == 3) { name = "дельтоида"; } if (n == 4) { name = "астроида"; }
  info = "**Гипоциклоида** — траектория точки подвижной окружности радиуса r, катящейся без проскальзывания по внутренней стороне неподвижной окружности радиуса R (оранжевая).\n\nПри R/r = " + format(n, 0) + " кривая замкнута и состоит из " + format(n, 0) + " арок (" + name + ").";
}
]
