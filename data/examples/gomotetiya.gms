[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float k = 2; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "A"; pos = (2, 1); pauseOnDrag = false }
new Point { name = "A1"; pos = (4, 2); dynamic = false; collision = false; color = #22c55e }
new Line { name = "l"; pos = (A, A1); color = "transparent" }
new UI { type = slider; label = "коэффициент гомотетии k"; variable = k; min = -3; max = 3; step = 0.1; default = 2 }
Update {
  if (abs(k) < 0.1) { k = 0.1; }
  A1.pos.x = k * A.pos.x; A1.pos.y = k * A.pos.y;
  string ray = "том же луче от O"; if (k < 0) { ray = "противоположном луче от O"; }
  info = "**Гомотетия** с центром O и коэффициентом k = " + format(k,1) + ": A′ лежит на " + ray + ", |OA′| = " + format(abs(k),1) + "·|OA| = " + format(abs(k)*sqrt(A.pos.x*A.pos.x+A.pos.y*A.pos.y),2) + ".";
}
]
