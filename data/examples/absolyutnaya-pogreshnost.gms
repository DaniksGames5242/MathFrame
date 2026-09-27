[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float a = 7.5; float ax = 6.5; string info = "";
show axes = true;
draw Graph { name = "gd"; graph = "g"; nodeRadius = 0; edgeWidth = 4; labels = false; interactive = false }
new Point { name = "Pa"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #22c55e }
new Point { name = "Pax"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #f59e0b }
draw Text { name = "la"; pos = (0, 1.2); text = "a"; size = 0.9; color = #22c55e }
draw Text { name = "lax"; pos = (0, -1.6); text = "a*"; size = 0.9; color = #f59e0b }
new UI { type = slider; label = "приближённое значение a*"; variable = ax; min = 5; max = 10; step = 0.1; default = 6.5 }
Update {
  float xa = (a - 7.5) * 1.6; float xax = (ax - 7.5) * 1.6;
  Pa.pos.x = xa; Pa.pos.y = 0; Pax.pos.x = xax; Pax.pos.y = 0;
  g = newGraph(); addNode(g, "p0", [xa, 0]); addNode(g, "p1", [xax, 0]); addEdge(g, "p0", "p1");
  float d = abs(ax - a);
  info = "**Абсолютная погрешность** — модуль разности точного значения a = " + format(a, 1) + " и приближённого a* = " + format(ax, 1) + ": Δa = |a* − a| = " + format(d, 1) + ".";
}
]
