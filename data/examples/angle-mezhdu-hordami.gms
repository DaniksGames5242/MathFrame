[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "c"; center = O; radius = 3.5 }
new Point { name = "A"; circle = "c"; t = 0.05; text = true("A"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B"; circle = "c"; t = 0.55; text = true("B"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Cc"; circle = "c"; t = 0.3; text = true("C"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "D"; circle = "c"; t = 0.85; text = true("D"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "X"; pos = (0, 0); dynamic = false; collision = false; text = true("X") }
new Line { name = "xa"; pos = (X, A); color = #3b82f6 }
new Line { name = "xb"; pos = (X, B); color = #3b82f6 }
new Line { name = "xc"; pos = (X, Cc); color = #f59e0b }
new Line { name = "xd"; pos = (X, D); color = #f59e0b }
new Angle { name = "ang"; lines = (xa, xc) }
draw Angle { name = "da"; angle = "ang" }
draw Arc { name = "arcAD"; type = CenterRadius; center = O; radius = 3.5; from = A; to = D; color = #22c55e; thickness = 3 }
draw Arc { name = "arcBC"; type = CenterRadius; center = O; radius = 3.5; from = B; to = Cc; color = #22c55e; thickness = 3 }
Update {
  float den = (A.pos.x - B.pos.x) * (Cc.pos.y - D.pos.y) - (A.pos.y - B.pos.y) * (Cc.pos.x - D.pos.x);
  if (abs(den) > 0.001) {
    float t = ((A.pos.x - Cc.pos.x) * (Cc.pos.y - D.pos.y) - (A.pos.y - Cc.pos.y) * (Cc.pos.x - D.pos.x)) / den;
    X.pos.x = A.pos.x + t * (B.pos.x - A.pos.x); X.pos.y = A.pos.y + t * (B.pos.y - A.pos.y);
  }
  info = "Хорды AB (синяя) и CD (оранжевая) пересекаются в точке X внутри окружности. Угол AXC между ними равен " + format(ang.measure, 1) + "° и равен полусумме мер дуг AD и BC (зелёные), заключённых между хордами.";
}
]
