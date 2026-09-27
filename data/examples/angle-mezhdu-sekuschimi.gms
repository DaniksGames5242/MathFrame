[
description = "{info}"
field width = 14; field height = 14;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 1.5); dynamic = false; collision = false; active = false }
new Circle { name = "c"; center = O; radius = 2.6 }
new Point { name = "A"; circle = "c"; t = 0.05; text = true("A"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Cc"; circle = "c"; t = 0.42; text = true("C"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B"; pos = (2.6, 1.5); dynamic = false; collision = false; text = true("B") }
new Point { name = "D"; pos = (-2.6, 1.5); dynamic = false; collision = false; text = true("D") }
new Point { name = "X"; pos = (0, -5); dynamic = false; collision = false; text = true("X") }
new Line { name = "xb"; pos = (X, B); color = #3b82f6 }
new Line { name = "xd"; pos = (X, D); color = #f59e0b }
new Angle { name = "ang"; lines = (xb, xd) }
draw Angle { name = "da"; angle = "ang" }
draw Arc { name = "arcAC"; type = CenterRadius; center = O; radius = 2.6; from = Cc; to = A; color = #22c55e; thickness = 3 }
draw Arc { name = "arcBD"; type = CenterRadius; center = O; radius = 2.6; from = B; to = D; color = #22c55e; thickness = 3 }
Update {
  float dx1 = A.pos.x - X.pos.x; float dy1 = A.pos.y - X.pos.y;
  float t1 = ((X.pos.x - O.pos.x) * (X.pos.x - O.pos.x) + (X.pos.y - O.pos.y) * (X.pos.y - O.pos.y) - 2.6 * 2.6) / (dx1 * dx1 + dy1 * dy1);
  B.pos.x = X.pos.x + t1 * dx1; B.pos.y = X.pos.y + t1 * dy1;
  float dx2 = Cc.pos.x - X.pos.x; float dy2 = Cc.pos.y - X.pos.y;
  float t2 = ((X.pos.x - O.pos.x) * (X.pos.x - O.pos.x) + (X.pos.y - O.pos.y) * (X.pos.y - O.pos.y) - 2.6 * 2.6) / (dx2 * dx2 + dy2 * dy2);
  D.pos.x = X.pos.x + t2 * dx2; D.pos.y = X.pos.y + t2 * dy2;
  info = "Секущие XAB (синяя) и XCD (оранжевая) выходят из точки X вне окружности, пересекая её в A, B и C, D. Угол между секущими равен " + format(ang.measure, 1) + "° и равен полуразности мер дальней дуги BD и ближней дуги AC (зелёные).";
}
]
