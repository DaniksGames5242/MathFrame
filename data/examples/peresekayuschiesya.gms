[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); text = true("O") } new Point { name = "P"; pos = (5, 3); text = true("P") } new Point { name = "Q"; pos = (-4, 4); text = true("Q") }
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false } new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "M1"; pos = (0, 0); dynamic = false; collision = false } new Point { name = "M2"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "l"; pos = (L1, L2) } new Line { name = "m"; pos = (M1, M2); color = #f59e0b }
string info = "";
Function tHit(p, d, half) { if (d > 0) { return (half - p) / d; } if (d < 0) { return (-half - p) / d; } return 1e9; }
Update {
  float dx = P.pos.x - O.pos.x; float dy = P.pos.y - O.pos.y; if (abs(dx) + abs(dy) < 0.05) { P.pos.x = O.pos.x + 1; dx = 1; }
  float t1 = min(tHit(O.pos.x, dx, 8), tHit(O.pos.y, dy, 5)); float s1 = min(tHit(O.pos.x, -dx, 8), tHit(O.pos.y, -dy, 5));
  L1.pos.x = O.pos.x - s1 * dx; L1.pos.y = O.pos.y - s1 * dy; L2.pos.x = O.pos.x + t1 * dx; L2.pos.y = O.pos.y + t1 * dy;
  float ex = Q.pos.x - O.pos.x; float ey = Q.pos.y - O.pos.y; if (abs(ex) + abs(ey) < 0.05) { Q.pos.x = O.pos.x - 1; ex = -1; }
  float t2 = min(tHit(O.pos.x, ex, 8), tHit(O.pos.y, ey, 5)); float s2 = min(tHit(O.pos.x, -ex, 8), tHit(O.pos.y, -ey, 5));
  M1.pos.x = O.pos.x - s2 * ex; M1.pos.y = O.pos.y - s2 * ey; M2.pos.x = O.pos.x + t2 * ex; M2.pos.y = O.pos.y + t2 * ey;
  float cosv = (dx * ex + dy * ey) / (sqrt(dx * dx + dy * dy) * sqrt(ex * ex + ey * ey)); if (cosv > 1) { cosv = 1; } if (cosv < -1) { cosv = -1; }
  float ang = acos(cosv) * 57.29578; if (ang > 90) { ang = 180 - ang; }
  string k = "непрямой"; if (abs(ang - 90) < 0.5) { k = "прямой"; }
  info = "Прямые пересекаются в точке O и образуют четыре угла: вертикальные (напротив друг друга) равны, а сумма смежных равна 180°. Угол между прямыми — наименьший из четырёх — равен " + format(ang, 1) + "°, это угол " + k + ".";
}
]
