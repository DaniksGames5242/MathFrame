[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float dx = -2; string info = "";
func fl(x) = x - 1;
func fr(x) = x + 2;
draw Function { name = "gL"; f = "fl"; xmin = -10; xmax = 0; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gR"; f = "fr"; xmin = 0; xmax = 10; color = #3b82f6; thickness = 3 }
new Point { name = "PX"; pos = (0,0); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "x (приближение к 0)"; variable = dx; min = -5; max = 5; step = 0.05; default = -2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(dx) < 0.02) { dx = -0.02; }
  float fx = dx - 1; if (dx > 0) { fx = dx + 2; }
  PX.pos.x = dx; PX.pos.y = fx;
  string side = "слева"; float lim = -1; if (dx > 0) { side = "справа"; lim = 2; }
  info = "**Односторонние пределы:** при x → 0 " + side + " функция стремится к " + num(lim,0) + " (предел слева −1, предел справа 2 — они различны, поэтому в точке x = 0 предела не существует).\n\nПри x = " + num(dx,2) + ": f(x) = " + num(fx,2) + ".";
}
]
