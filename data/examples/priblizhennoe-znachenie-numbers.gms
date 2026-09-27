[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float a = 1.41421356; float ax = 1.2; string info = "";
show axes = true;
new Point { name = "Pa"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #22c55e }
new Point { name = "Pax"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #f59e0b }
draw Text { name = "la"; pos = (0, 1.2); text = "√2"; size = 0.9; color = #22c55e }
draw Text { name = "lax"; pos = (0, -1.6); text = "приближённое a*"; size = 0.9; color = #f59e0b }
new UI { type = slider; label = "приближённое значение a*"; variable = ax; min = 1; max = 2; step = 0.001; default = 1.2 }
Update {
  Pa.pos.x = (a - 1.5) * 6; Pa.pos.y = 0;
  Pax.pos.x = (ax - 1.5) * 6; Pax.pos.y = 0;
  float d = abs(ax - a);
  info = "**Приближённое значение** a* заменяет точное число a = √2 ≈ " + format(a, 4) + " и не совпадает с ним точно.\n\nПри a* = " + format(ax, 3) + " отличие от точного значения составляет |a* − a| = " + format(d, 4) + ".";
}
]
