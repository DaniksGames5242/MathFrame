[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
new Point { name = "A"; pos = (-3, -2); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "B"; pos = (4, 3); pauseOnDrag = false; color = #f59e0b }
new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; size = 0.2; color = #f59e0b }
new Line { name = "ab"; pos = (A, B); color = #22c55e; thickness = 3; interact = false }
new Line { name = "ak"; pos = (A, K); color = #f59e0b; thickness = 1.5; interact = false }
new Line { name = "kb"; pos = (K, B); color = #f59e0b; thickness = 1.5; interact = false }
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Update {
  K.pos.x = B.pos.x; K.pos.y = A.pos.y;
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y;
  float d = sqrt(dx * dx + dy * dy);
  info = "Отрезок AB — гипотенуза прямоугольного треугольника с катетами |Δx| = " + format(abs(dx), 1) + " и |Δy| = " + format(abs(dy), 1) + ". По теореме Пифагора расстояние d = √(Δx² + Δy²) = √(" + format(abs(dx), 1) + "² + " + format(abs(dy), 1) + "²) ≈ **" + format(d, 2) + "**.";
}
]
