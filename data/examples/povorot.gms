[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float ang = 60; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "A"; pos = (3, 1); pauseOnDrag = false }
new Point { name = "A1"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new Line { name = "oa"; pos = (O, A); color = #3b82f6 }
new Line { name = "oa1"; pos = (O, A1); color = #22c55e }
new UI { type = slider; label = "угол поворота"; variable = ang; min = -180; max = 180; step = 5; default = 60 }
Update {
  float r = ang * 3.14159265 / 180;
  float rx = A.pos.x * cos(r) - A.pos.y * sin(r); float ry = A.pos.x * sin(r) + A.pos.y * cos(r);
  A1.pos.x = rx; A1.pos.y = ry;
  string dir = "против часовой стрелки"; if (ang < 0) { dir = "по часовой стрелке"; }
  info = "**Поворот вокруг O** на угол " + format(abs(ang),0) + "° " + dir + " переводит A(" + format(A.pos.x,1) + "; " + format(A.pos.y,1) + ") в A′(" + format(rx,1) + "; " + format(ry,1) + ").\n\n|OA| = |OA′| = " + format(sqrt(A.pos.x*A.pos.x+A.pos.y*A.pos.y),2) + " — расстояние до центра сохраняется.";
}
]
