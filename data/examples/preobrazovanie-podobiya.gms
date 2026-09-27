[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float k = 1.5; float ang = 40; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "A"; pos = (2, 1); pauseOnDrag = false }
new Point { name = "B"; pos = (1, -1.5); pauseOnDrag = false }
new Point { name = "A2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "B2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "A1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Point { name = "B1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Line { name = "ab"; pos = (A, B); color = #3b82f6 }
new Line { name = "a2b2"; pos = (A2, B2); color = #f59e0b }
new Line { name = "a1b1"; pos = (A1, B1); color = #22c55e }
new UI { type = slider; label = "коэффициент k"; variable = k; min = 0.3; max = 2.5; step = 0.1; default = 1.5 }
new UI { type = slider; label = "угол движения"; variable = ang; min = -180; max = 180; step = 5; default = 40 }
Update {
  float r = ang * 3.14159265 / 180;
  A2.pos.x = k * A.pos.x; A2.pos.y = k * A.pos.y; B2.pos.x = k * B.pos.x; B2.pos.y = k * B.pos.y;
  A1.pos.x = A2.pos.x * cos(r) - A2.pos.y * sin(r); A1.pos.y = A2.pos.x * sin(r) + A2.pos.y * cos(r);
  B1.pos.x = B2.pos.x * cos(r) - B2.pos.y * sin(r); B1.pos.y = B2.pos.x * sin(r) + B2.pos.y * cos(r);
  info = "**Преобразование подобия** = гомотетия + движение: синий AB — исходная фигура, оранжевый A₂B₂ — после гомотетии с центром O и k = " + format(k,2) + ", зелёный A′B′ — после поворота на " + format(ang,0) + "°.\n\nВсе три отрезка подобны с коэффициентом k, центр O — неподвижная точка всего преобразования.";
}
]
