[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float x0 = 50; float x = 42; string info = "";
show axes = true;
draw Graph { name = "gd"; graph = "g"; nodeRadius = 0; edgeWidth = 4; labels = false; interactive = false }
new Point { name = "P0"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #22c55e }
new Point { name = "Px"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #f59e0b }
draw Text { name = "l0"; pos = (0, 1.2); text = "x₀"; size = 0.9; color = #22c55e }
draw Text { name = "lx"; pos = (0, -1.6); text = "x"; size = 0.9; color = #f59e0b }
new UI { type = slider; label = "приближённое значение x"; variable = x; min = 30; max = 70; step = 0.5; default = 42 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  float p0 = (x0 - 50) * 0.32; float px = (x - 50) * 0.32;
  P0.pos.x = p0; P0.pos.y = 0; Px.pos.x = px; Px.pos.y = 0;
  g = newGraph(); addNode(g, "p0", [p0, 0]); addNode(g, "p1", [px, 0]); addEdge(g, "p0", "p1");
  float dx = abs(x - x0); float rel = dx / x * 100;
  info = "**Относительная погрешность** — отношение абсолютной погрешности к приближённому значению x: |x − x₀| / x. При x₀ = " + format(x0, 0) + ", x = " + format(x, 1) + " абсолютная погрешность |x − x₀| = " + format(dx, 1) + ", а относительная — " + format(rel, 2) + "%.";
}
]
