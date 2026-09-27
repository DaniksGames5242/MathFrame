[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float lambda = -1.5; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "A"; pos = (3, 2); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false; size = 0.4; color = #f59e0b }
new Line { name = "oa"; pos = (O, A); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "oc"; pos = (O, C); color = #f59e0b; thickness = 3; interact = false }
draw Vector { name = "va"; edge = "oa"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "vc"; edge = "oc"; pos = 1; color = #f59e0b; thickness = 3 }
new UI { type = slider; label = "число λ"; variable = lambda; min = -2; max = 2; step = 0.1; default = -1.5 }
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Update {
  if (abs(lambda) < 0.05) { lambda = 0.1; }
  C.pos.x = lambda * A.pos.x; C.pos.y = lambda * A.pos.y;
  string dir = "то же"; if (lambda < 0) { dir = "противоположное"; }
  info = "**λa** при λ = " + num(lambda) + ": длина |λa| = |λ|·|a| = " + format(abs(lambda), 1) + " × " + format(sqrt(A.pos.x * A.pos.x + A.pos.y * A.pos.y), 2) + ", направление — " + dir + " направлению a.\n\na = (" + num(A.pos.x) + "; " + num(A.pos.y) + "), λa = (" + num(C.pos.x) + "; " + num(C.pos.y) + ").";
}
]
