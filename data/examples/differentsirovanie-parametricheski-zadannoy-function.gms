[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float T = 1.2; string info = "";
new Curve { name = "cv"; type = parametric; x = "(-3+6*t)*(-3+6*t)"; y = "(-3+6*t)*(-3+6*t)*(-3+6*t)"; color = #3b82f6; thickness = 3 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "t"; variable = T; min = -3; max = 3; step = 0.05; default = 1.2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(T) < 0.15) { T = 0.15; }
  P.pos.x = T * T; P.pos.y = T * T * T;
  float dydx = 1.5 * T;
  info = "**Параметрически заданная кривая**: x = t², y = t³ при t = " + num(T, 2) + " — точка (" + num(P.pos.x, 2) + "; " + num(P.pos.y, 2) + ").\n\nx′ₜ = 2t, y′ₜ = 3t², поэтому y′ₓ = y′ₜ / x′ₜ = 3t/2 = " + num(dydx, 2) + ".";
}
]
