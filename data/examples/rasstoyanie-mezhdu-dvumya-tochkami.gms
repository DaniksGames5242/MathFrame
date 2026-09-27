[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
new Point { name = "A"; pos = (-3, -2); text = true("A") }
new Point { name = "B"; pos = (3, 2); text = true("B") }
new Line { name = "ab"; pos = (A, B) }
string info = "";
show axes = true; show grid = true;
Function num(x, d) { if (x < 0) { return "(−" + format(-x, d) + ")"; } return format(x, d); }
Update {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y;
  float d = sqrt(dx * dx + dy * dy);
  info = "**Расстояние между точками** A и B — длина отрезка AB: d = √((x₂ − x₁)² + (y₂ − y₁)²) = √(" + num(dx, 1) + "² + " + num(dy, 1) + "²) = " + format(d, 2) + ".";
}
]
