[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-5, 3) }
new Point { name = "B"; pos = (4, 4) }
new Point { name = "C"; pos = (5, -3) }
new Point { name = "D"; pos = (-4, -4) }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "q"; elements = (ab, bc, cd, da) }
new Line { name = "ac"; pos = (A, C); color = #3b82f6 }
new Line { name = "bd"; pos = (B, D); color = #f59e0b }
Update {
  float s = A.pos.x * B.pos.y - B.pos.x * A.pos.y;
  s = s + B.pos.x * C.pos.y - C.pos.x * B.pos.y;
  s = s + C.pos.x * D.pos.y - D.pos.x * C.pos.y;
  s = s + D.pos.x * A.pos.y - A.pos.x * D.pos.y;
  float area = abs(s) / 2;
  float vax = C.pos.x - A.pos.x; float vay = C.pos.y - A.pos.y;
  float vbx = D.pos.x - B.pos.x; float vby = D.pos.y - B.pos.y;
  float cr = abs(vax * vby - vay * vbx);
  float formula = cr / 2;
  info = "**Площадь через диагонали и угол** между ними: S = ½·AC·BD·sin θ.\n\nAC = " + format(ac.length, 2) + ", BD = " + format(bd.length, 2) + ", формула даёт S ≈ " + format(formula, 2) + ", площадь по вершинам — S ≈ " + format(area, 2) + ".";
}
]
