[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string info = ""; float p = 3; float q = 2; float rad = 2.5;
new Point { name = "L"; pos = (-5, -3) }
new Point { name = "R"; pos = (0, -3); dynamic = false; collision = false }
new Point { name = "M"; pos = (5, -3); dynamic = false; collision = false }
new Point { name = "D"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; text = true("D") }
new Point { name = "O"; pos = (-5, -3); dynamic = false; collision = false; active = false }
new Line { name = "lr"; pos = (L, R) }
new Line { name = "rm"; pos = (R, M); color = #f59e0b }
new Line { name = "rd"; pos = (R, D); color = #3b82f6 }
new Circle { name = "circ"; center = O; radius = rad }
new UI { type = slider; label = "отрезок p"; variable = p; min = 0.5; max = 6; step = 0.1; default = 3 }
new UI { type = slider; label = "отрезок q"; variable = q; min = 0.5; max = 6; step = 0.1; default = 2 }
Update {
  M.pos.x = L.pos.x + p + q; M.pos.y = L.pos.y;
  R.pos.x = L.pos.x + p; R.pos.y = L.pos.y;
  O.pos.x = (L.pos.x + M.pos.x) / 2; O.pos.y = L.pos.y; rad = (p + q) / 2;
  D.pos.x = R.pos.x; D.pos.y = L.pos.y + sqrt(p * q);
  info = "**Отрезок RD — среднее пропорциональное отрезков p и q.** На прямой отложены p = " + format(p, 1) + " и q = " + format(q, 1) + ", на их сумме как на диаметре построена окружность; перпендикуляр в точке R до окружности даёт RD = √(p·q) = " + format(sqrt(p * q), 2) + ".";
}
]
