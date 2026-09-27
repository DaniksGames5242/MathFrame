[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = ""; float rad = 3;
new Point { name = "A"; pos = (-6, 2); text = true("A") }
new Point { name = "B"; pos = (-3, 3); text = true("B") }
new Point { name = "O"; pos = (0, -2); text = true("O") }
new Point { name = "D"; pos = (5, 1); text = true("D") }
new Point { name = "C"; pos = (2, -1); dynamic = false; collision = false; color = #3b82f6; text = true("C") }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "ray"; pos = (O, D) }
new Line { name = "oc"; pos = (O, C); color = #3b82f6 }
new Circle { name = "arc"; center = O; radius = rad; color = #f59e0b }
draw EquallySing { name = "eq1"; edges = (ab, oc); type = 1 }
Update {
  rad = ab.length;
  float dx = D.pos.x - O.pos.x; float dy = D.pos.y - O.pos.y; float k = ab.length / sqrt(dx * dx + dy * dy);
  C.pos.x = O.pos.x + dx * k; C.pos.y = O.pos.y + dy * k;
  info = "**Отрезок OC равен отрезку AB.** Циркулем переносят раствор AB (длина " + format(ab.length, 2) + "): дуга радиусом AB с центром O пересекает луч OD в точке C — отрезок от O до этой засечки равен данному.";
}
]
