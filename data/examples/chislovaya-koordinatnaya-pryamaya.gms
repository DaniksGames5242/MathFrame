[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
show axes = true;
new Point { name = "A"; pos = (-4, 0); color = #3b82f6 }
new Point { name = "B"; pos = (2, 0); color = #f59e0b }
new Point { name = "S"; pos = (4, 0); dynamic = false; collision = false; color = #22c55e }
string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(A.pos.y) > 0.001) { A.pos.y = 0; } if (abs(B.pos.y) > 0.001) { B.pos.y = 0; }
  S.pos.x = -A.pos.x;
  string ord = "A правее B (a > b)"; if (A.pos.x < B.pos.x) { ord = "A левее B (a < b)"; }
  info = "**Числовая прямая:** каждому действительному числу соответствует точка. A = " + num(A.pos.x, 2) + ", B = " + num(B.pos.x, 2) + " — " + ord + ".\n\nРасстояние между точками |a − b| = " + num(abs(A.pos.x - B.pos.x), 2) + ". Зелёная точка симметрична A относительно нуля и равна −a = " + num(-A.pos.x, 2) + ".";
}
]
