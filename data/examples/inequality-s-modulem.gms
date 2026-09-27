[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float h = 1; float b = 4; string info = "";
func f(x) = abs(x - h);
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "R2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "h"; variable = h; min = -5; max = 5; step = 0.5; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 7; step = 0.5; default = 4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float lo = h - b; float hi = h + b;
  R1.pos.x = lo; R1.pos.y = 0; R2.pos.x = hi; R2.pos.y = 0;
  info = "Неравенство |x − " + num(h, 1) + "| < " + format(b, 1) + " верно там, где график |x − h| ниже горизонтали y = " + format(b, 1) + ": это интервал между отмеченными точками.\n\nРешение: " + num(lo, 1) + " < x < " + num(hi, 1) + ".";
}
]
