[
description = "{info}"
field width = 6; field height = 6;
camera type = fixed;
float th = 1.2; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Curve { name = "circ"; type = parametric; x = "cos(6.2832 * t)"; y = "sin(6.2832 * t)"; }
new Curve { name = "arc"; type = parametric; x = "cos(t * th)"; y = "sin(t * th)"; color = #3b82f6; thickness = 4 }
new Point { name = "P"; pos = (1, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "угол θ (рад)"; variable = th; min = 0.1; max = 6.28; step = 0.05; default = 1.2 }
Update {
  P.pos.x = cos(th); P.pos.y = sin(th);
  float deg = th * 180 / 3.14159;
  info = "**Радианная мера угла:** отношение длины дуги к радиусу. На окружности радиуса 1 длина дуги численно равна углу в радианах.\n\nθ = " + format(th, 2) + " рад ≈ " + format(deg, 1) + "°. Дуга (синяя) имеет длину " + format(th, 2) + ", столько же, сколько сам угол.";
}
]
