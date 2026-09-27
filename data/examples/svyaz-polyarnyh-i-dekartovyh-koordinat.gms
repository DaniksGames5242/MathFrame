[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float r = 5; float phi = 0.6; string info = "";
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "op"; pos = (O, P) }
new UI { type = slider; label = "r"; variable = r; min = 0.5; max = 7; step = 0.1; default = 5 }
new UI { type = slider; label = "φ"; variable = phi; min = 0; max = 6.28; step = 0.01; default = 0.6 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  P.pos.x = r * cos(phi); P.pos.y = r * sin(phi);
  info = "**Связь полярных и декартовых координат:** x = r·cos φ, y = r·sin φ.\n\nПри r = " + format(r, 1) + ", φ = " + format(phi, 2) + ": точка P = (" + num(P.pos.x, 2) + "; " + num(P.pos.y, 2) + "). Обратно: r = √(x² + y²), φ — через арктангенс y/x с учётом четверти.";
}
]
