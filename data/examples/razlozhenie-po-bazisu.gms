[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "E1"; pos = (3, 0.5); dynamic = false; collision = false; size = 0.35; color = #3b82f6 }
new Point { name = "E2"; pos = (1, 2.5); dynamic = false; collision = false; size = 0.35; color = #f59e0b }
new Point { name = "V"; pos = (5, 4); pauseOnDrag = false; color = #22c55e }
new Line { name = "oe1"; pos = (O, E1); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "oe2"; pos = (O, E2); color = #f59e0b; thickness = 3; interact = false }
new Line { name = "ov"; pos = (O, V); color = #22c55e; thickness = 3; interact = false }
draw Vector { name = "ve1"; edge = "oe1"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "ve2"; edge = "oe2"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vv"; edge = "ov"; pos = 1; color = #22c55e; thickness = 3 }
Function num(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Update {
  float det = E1.pos.x * E2.pos.y - E2.pos.x * E1.pos.y;
  float x = (V.pos.x * E2.pos.y - E2.pos.x * V.pos.y) / det;
  float y = (E1.pos.x * V.pos.y - V.pos.x * E1.pos.y) / det;
  info = "**Базис** e₁ (синий), e₂ (оранжевый) — неколлинеарны, поэтому любой вектор v (зелёный) раскладывается по ним единственным образом: v = x·e₁ + y·e₂.\n\nПри v = (" + num(V.pos.x) + "; " + num(V.pos.y) + ") координаты в этом базисе: x = " + num(x) + ", y = " + num(y) + ".";
}
]
