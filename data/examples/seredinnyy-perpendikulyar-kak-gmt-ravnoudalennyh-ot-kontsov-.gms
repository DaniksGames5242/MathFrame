[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "A"; pos = (-4, -1); dynamic = false; collision = false; text = true("A") }
new Point { name = "B"; pos = (4, 1); dynamic = false; collision = false; text = true("B") }
new Line { name = "ab"; pos = (A, B) }
new Point { name = "M0"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "N0"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "mid"; pos = (M0, N0); color = #f59e0b }
new Point { name = "P"; pos = (2, 3); text = true("P"); collideWithPoints = false }
Update {
  float mx = (A.pos.x + B.pos.x) / 2; float my = (A.pos.y + B.pos.y) / 2;
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float len = sqrt(dx * dx + dy * dy);
  M0.pos.x = mx - 5 * dy / len; M0.pos.y = my + 5 * dx / len; N0.pos.x = mx + 5 * dy / len; N0.pos.y = my - 5 * dx / len;
  float pa = sqrt((P.pos.x - A.pos.x) * (P.pos.x - A.pos.x) + (P.pos.y - A.pos.y) * (P.pos.y - A.pos.y));
  float pb = sqrt((P.pos.x - B.pos.x) * (P.pos.x - B.pos.x) + (P.pos.y - B.pos.y) * (P.pos.y - B.pos.y));
  string rel = "P не равноудалена от A и B — не лежит на серединном перпендикуляре"; if (abs(pa - pb) < 0.1) { rel = "PA = PB — P лежит на серединном перпендикуляре"; }
  info = "**Серединный перпендикуляр** (оранжевый) к отрезку AB — множество точек, равноудалённых от A и B.\n\nPA = " + format(pa, 2) + ", PB = " + format(pb, 2) + ": " + rel + ".";
}
]
