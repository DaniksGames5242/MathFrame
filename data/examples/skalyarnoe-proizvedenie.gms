[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "A"; pos = (5, 3); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "B"; pos = (4, -2); pauseOnDrag = false; color = #f59e0b }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; size = 0.3; color = #22c55e }
new Line { name = "oa"; pos = (O, A); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "ob"; pos = (O, B); color = #f59e0b; thickness = 3; interact = false }
new Line { name = "op"; pos = (O, P); color = #22c55e; thickness = 4; interact = false }
draw Vector { name = "va"; edge = "oa"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "vb"; edge = "ob"; pos = 1; color = #f59e0b; thickness = 3 }
Function num(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Update {
  float lb = sqrt(B.pos.x * B.pos.x + B.pos.y * B.pos.y);
  float dot = A.pos.x * B.pos.x + A.pos.y * B.pos.y;
  float t = dot / (lb * lb);
  P.pos.x = t * B.pos.x; P.pos.y = t * B.pos.y;
  float la = sqrt(A.pos.x * A.pos.x + A.pos.y * A.pos.y);
  float cosv = dot / (la * lb);
  string sign = "острый угол"; if (dot < 0) { sign = "тупой угол"; } if (abs(dot) < 0.05) { sign = "перпендикулярны"; }
  info = "**a · b** = a₁b₁ + a₂b₂ = " + num(A.pos.x) + "·" + num(B.pos.x) + " + " + num(A.pos.y) + "·" + num(B.pos.y) + " = **" + num(dot) + "**, cos φ = " + num(cosv) + " — " + sign + ".\n\nЗелёный отрезок — проекция a на b, равная (a·b)/|b| = " + num(dot / lb) + ".";
}
]
