[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = ""; float ang = 0; float len = 3;
new Point { name = "O"; pos = (-5, -1); text = true("O") }
new Point { name = "A"; pos = (-2, 1); text = true("A") }
new Point { name = "B"; pos = (-3, -3); text = true("B") }
new Point { name = "O2"; pos = (3, 3); text = true("O'") }
new Point { name = "A2"; pos = (7, 3); text = true("A'") }
new Point { name = "B2"; pos = (5, 1); dynamic = false; collision = false; color = #3b82f6; text = true("B'") }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Line { name = "o2a2"; pos = (O2, A2) }
new Line { name = "o2b2"; pos = (O2, B2); color = #3b82f6 }
new Angle { name = "ang1"; lines = (oa, ob) }
new Angle { name = "ang2"; lines = (o2a2, o2b2) }
draw Angle { name = "da1"; angle = "ang1"; count = 1 }
draw Angle { name = "da2"; angle = "ang2"; count = 1 }
Update {
  ang = atan2(B.pos.y - O.pos.y, B.pos.x - O.pos.x) - atan2(A.pos.y - O.pos.y, A.pos.x - O.pos.x);
  len = o2a2.length;
  float base = atan2(A2.pos.y - O2.pos.y, A2.pos.x - O2.pos.x);
  B2.pos.x = O2.pos.x + len * cos(base + ang); B2.pos.y = O2.pos.y + len * sin(base + ang);
  info = "**Угол O' построен равным углу O.** Дугой одного радиуса из O и O' отмечены точки A, B и A', и раствором AB из A' — точка B'. Треугольники OAB и O'A'B' равны по трём сторонам, поэтому углы AOB и A'O'B' равны.";
}
]
