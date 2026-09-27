[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float k = 1.5; float ang = 30; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "A"; pos = (2, 1); pauseOnDrag = false }
new Point { name = "B"; pos = (1, -2); pauseOnDrag = false }
new Point { name = "A1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Point { name = "B1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Line { name = "ab"; pos = (A, B); color = #3b82f6 }
new Line { name = "a1b1"; pos = (A1, B1); color = #22c55e }
new UI { type = slider; label = "коэффициент подобия k"; variable = k; min = 0.3; max = 2.5; step = 0.1; default = 1.5 }
new UI { type = slider; label = "угол движения"; variable = ang; min = -180; max = 180; step = 5; default = 30 }
Function img(px, py, r) { return (px * cos(r) - py * sin(r)) * k; }
Function imgy(px, py, r) { return (px * sin(r) + py * cos(r)) * k; }
Update {
  float r = ang * 3.14159265 / 180;
  A1.pos.x = img(A.pos.x, A.pos.y, r); A1.pos.y = imgy(A.pos.x, A.pos.y, r);
  B1.pos.x = img(B.pos.x, B.pos.y, r); B1.pos.y = imgy(B.pos.x, B.pos.y, r);
  float ab = sqrt((A.pos.x-B.pos.x)*(A.pos.x-B.pos.x)+(A.pos.y-B.pos.y)*(A.pos.y-B.pos.y));
  float a1b1 = sqrt((A1.pos.x-B1.pos.x)*(A1.pos.x-B1.pos.x)+(A1.pos.y-B1.pos.y)*(A1.pos.y-B1.pos.y));
  info = "**Подобие** с коэффициентом k = " + format(k,2) + " переводит отрезок AB в A′B′: |AB| = " + format(ab,2) + ", |A′B′| = " + format(a1b1,2) + ", отношение " + format(a1b1/ab,2) + " = k.\n\nУгол между AB и A′B′ равен углу движения — " + format(abs(ang),0) + "°.";
}
]
