[
description = "{info}"
field width = 6; field height = 6;
camera type = fixed;
float th = 0.9; string info = "";
show axes = true; show grid = true;
new Curve { name = "circ"; type = parametric; x = "cos(6.2832 * t)"; y = "sin(6.2832 * t)"; }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "P"; pos = (1, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "Px"; pos = (1, 0); dynamic = false; collision = false; color = #3b82f6 }
new Line { name = "rad"; pos = (O, P); }
new Line { name = "proj"; pos = (P, Px); }
new UI { type = slider; label = "угол θ (рад)"; variable = th; min = 0; max = 6.28; step = 0.05; default = 0.9 }
Update {
  P.pos.x = cos(th); P.pos.y = sin(th); Px.pos.x = cos(th); Px.pos.y = 0;
  info = "**Единичная окружность:** точка P соответствует углу θ, отложенному от оси Ox против часовой стрелки. Её координаты — (cos θ; sin θ).\n\nПри θ = " + format(th, 2) + ": cos θ = " + format(cos(th), 2) + " (абсцисса P), sin θ = " + format(sin(th), 2) + " (ордината P).";
}
]
