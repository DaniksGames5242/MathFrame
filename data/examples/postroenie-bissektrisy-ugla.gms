[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = ""; float m = 0;
new Point { name = "O"; pos = (0, -3); text = true("O") }
new Point { name = "A"; pos = (-5, 3); text = true("A") }
new Point { name = "B"; pos = (5, 2); text = true("B") }
new Point { name = "D"; pos = (0, 3); dynamic = false; collision = false; color = #3b82f6; text = true("D") }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Line { name = "od"; pos = (O, D); color = #3b82f6 }
new Angle { name = "ang1"; lines = (oa, od) }
new Angle { name = "ang2"; lines = (od, ob) }
draw Angle { name = "da1"; angle = "ang1"; count = 1 }
draw Angle { name = "da2"; angle = "ang2"; count = 1 }
Update {
  float ax = A.pos.x - O.pos.x; float ay = A.pos.y - O.pos.y; float la = sqrt(ax * ax + ay * ay);
  float bx = B.pos.x - O.pos.x; float by = B.pos.y - O.pos.y; float lb = sqrt(bx * bx + by * by);
  float dx = ax / la + bx / lb; float dy = ay / la + by / lb; float ld = sqrt(dx * dx + dy * dy);
  D.pos.x = O.pos.x + 4 * dx / ld; D.pos.y = O.pos.y + 4 * dy / ld;
  m = ang1.measure;
  info = "**Луч OD — биссектриса угла AOB.** Дуга из O засекает на сторонах точки, равные дуги из них пересекаются в точке на биссектрисе: она делит угол пополам, так как треугольники по обе стороны от OD равны по трём сторонам — оба угла равны " + format(m, 1) + "°.";
}
]
