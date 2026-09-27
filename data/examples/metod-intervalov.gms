[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = -1; float c = -4; string info = "";
func f(x) = (x - a) * (x - b) * (x - c);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = true }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = true }
new Point { name = "R3"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "корень x₁"; variable = a; min = -5; max = 5; step = 0.2; default = 1 }
new UI { type = slider; label = "корень x₂"; variable = b; min = -5; max = 5; step = 0.2; default = -1 }
new UI { type = slider; label = "корень x₃"; variable = c; min = -5; max = 5; step = 0.2; default = -4 }
Update {
  R1.pos.x = a; R1.pos.y = 0;
  R2.pos.x = b; R2.pos.y = 0;
  R3.pos.x = c; R3.pos.y = 0;
  info = "f(x) = (x − " + format(a, 1) + ")(x − " + format(b, 1) + ")(x − " + format(c, 1) + "). Корни: " + format(c, 1) + ", " + format(b, 1) + ", " + format(a, 1) + ".";
}
]
