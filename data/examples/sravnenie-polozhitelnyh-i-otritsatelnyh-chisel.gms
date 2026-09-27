[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
func f(x) = 0;
draw Function { name = "ax"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 1 }
float p = -6; float q = 3; string info = "";
new Point { name = "A"; pos = (-6, 0.4); dynamic = true; collision = false; color = #f59e0b; collideWithPoints = false }
new Point { name = "B"; pos = (3, -0.4); dynamic = true; collision = false; color = #22c55e; collideWithPoints = false }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  p = A.pos.x; q = B.pos.x; A.pos.y = 0.4; B.pos.y = -0.4;
  string cmp = "A > B"; if (p < q) { cmp = "A < B"; } if (abs(p - q) < 0.001) { cmp = "A = B"; }
  info = "**A = " + num(p, 1) + ", B = " + num(q, 1) + ": " + cmp + "**. " + "На координатной прямой правее лежит бо́льшее число.";
}
]
