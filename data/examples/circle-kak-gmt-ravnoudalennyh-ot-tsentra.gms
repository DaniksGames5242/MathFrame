[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float R = 3; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "c"; center = O; radius = R }
new Point { name = "P"; pos = (3, 2); text = true("P"); collideWithPoints = false }
new Line { name = "op"; pos = (O, P); color = #f59e0b }
new UI { type = slider; label = "радиус R"; variable = R; min = 1; max = 6; step = 0.1; default = 3 }
Update {
  float d = sqrt(P.pos.x * P.pos.x + P.pos.y * P.pos.y);
  string rel = "P лежит внутри окружности (OP < R)"; if (d > R + 0.1) { rel = "P лежит вне окружности (OP > R)"; } if (abs(d - R) < 0.1) { rel = "P лежит на окружности (OP = R)"; }
  info = "**Окружность** — множество точек, удалённых от центра O на радиус R. Отрезок OP — радиус, если P лежит на окружности.\n\nOP = " + format(d, 2) + ", R = " + format(R, 1) + ": " + rel + ".";
}
]
