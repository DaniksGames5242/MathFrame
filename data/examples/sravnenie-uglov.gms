[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
string info = "";
new Point { name = "O1"; pos = (-6, -3); dynamic = false; collision = false }
new Point { name = "A1"; pos = (-1, -3) }
new Point { name = "B1"; pos = (-4, 1) }
new Line { name = "o1a1"; pos = (O1, A1); color = #3b82f6 }
new Line { name = "o1b1"; pos = (O1, B1); color = #3b82f6 }
new Angle { name = "ang1"; lines = (o1a1, o1b1) }
draw Angle { name = "d1"; angle = "ang1" }
new Point { name = "O2"; pos = (2, -3); dynamic = false; collision = false }
new Point { name = "A2"; pos = (7, -3) }
new Point { name = "B2"; pos = (5, 2) }
new Line { name = "o2a2"; pos = (O2, A2); color = #f59e0b }
new Line { name = "o2b2"; pos = (O2, B2); color = #f59e0b }
new Angle { name = "ang2"; lines = (o2a2, o2b2) }
draw Angle { name = "d2"; angle = "ang2" }
Update {
  string cmp = "равен";
  if (ang1.measure > ang2.measure) { cmp = "больше"; }
  if (ang1.measure < ang2.measure) { cmp = "меньше"; }
  info = "Синий угол = " + format(ang1.measure, 1) + "°, оранжевый угол = " + format(ang2.measure, 1) + "°. Синий угол " + cmp + " оранжевого.";
}
]
