[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float x0 = 2; float y0 = -1; float r = 3; string info = "";
new Point { name = "O"; pos = (2, -1); dynamic = false; collision = false; size = 0.3 }
new Circle { name = "w"; center = O; radius = r; color = #3b82f6; thickness = 3 }
show axes = true; show grid = true;
new UI { type = slider; label = "x₀"; variable = x0; min = -6; max = 6; step = 0.5; default = 2 }
new UI { type = slider; label = "y₀"; variable = y0; min = -4; max = 4; step = 0.5; default = -1 }
new UI { type = slider; label = "радиус r"; variable = r; min = 1; max = 5; step = 0.1; default = 3 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  O.pos.x = x0; O.pos.y = y0;
  string sx = "− " + format(x0, 1); if (x0 < 0) { sx = "+ " + format(-x0, 1); }
  string sy = "− " + format(y0, 1); if (y0 < 0) { sy = "+ " + format(-y0, 1); }
  info = "**Уравнение окружности** с центром (x₀; y₀) и радиусом r: (x − x₀)² + (y − y₀)² = r².\n\nПри x₀ = " + num(x0, 1) + ", y₀ = " + num(y0, 1) + ", r = " + format(r, 1) + ": (x " + sx + ")² + (y " + sy + ")² = " + format(r * r, 2) + ".";
}
]
