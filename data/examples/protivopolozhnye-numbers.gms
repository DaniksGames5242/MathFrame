[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
func f(x) = 0;
draw Function { name = "ax"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 1 }
float a = 4; string info = "";
new Point { name = "A"; pos = (4, 0.4); dynamic = true; collision = false; color = #f59e0b }
new Point { name = "B"; pos = (-4, -0.4); dynamic = false; collision = false; color = #22c55e }
new UI { type = slider; label = "a"; variable = a; min = -9; max = 9; step = 0.5; default = 4 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  if (abs(A.pos.x - a) > 0.001) { a = A.pos.x; }
  A.pos.x = a; A.pos.y = 0.4; B.pos.x = -a; B.pos.y = -0.4;
  info = "**Точки a = " + num(a, 1) + " и −a = " + num(-a, 1) + " противоположны**: они лежат на равном расстоянии от нуля по разные стороны, а их сумма a + (−a) = 0.";
}
]
