[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = ""; float r = 4;
new Point { name = "A"; pos = (-5, -1); text = true("A") }
new Point { name = "B"; pos = (4, 2); text = true("B") }
new Point { name = "P1"; pos = (0, 4); dynamic = false; collision = false; color = #3b82f6; text = true("P") }
new Point { name = "P2"; pos = (0, -4); dynamic = false; collision = false; color = #3b82f6; text = true("Q") }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "pq"; pos = (P1, P2); color = #3b82f6 }
new Circle { name = "cA"; center = A; radius = r; color = #f59e0b }
new Circle { name = "cB"; center = B; radius = r; color = #f59e0b }
new UI { type = slider; label = "радиус циркуля r"; variable = r; min = 0; max = 6; step = 0.1; default = 4 }
Update {
  float d = ab.length; if (r < d / 2 + 0.15) { r = d / 2 + 0.15; }
  float mx = (A.pos.x + B.pos.x) / 2; float my = (A.pos.y + B.pos.y) / 2;
  float ux = (B.pos.x - A.pos.x) / d; float uy = (B.pos.y - A.pos.y) / d;
  float h = sqrt(r * r - (d / 2) * (d / 2));
  P1.pos.x = mx - h * uy; P1.pos.y = my + h * ux;
  P2.pos.x = mx + h * uy; P2.pos.y = my - h * ux;
  info = "**Прямая PQ — серединный перпендикуляр отрезка AB.** Из A и B проведены окружности равного радиуса r = " + format(r, 2) + " (r должен быть больше половины AB = " + format(d / 2, 2) + "); прямая через точки их пересечения перпендикулярна AB и проходит через его середину.";
}
]
