[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "c"; center = O; radius = 3.2 }
new Point { name = "A"; circle = "c"; t = 0.5; text = true("A"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B"; circle = "c"; t = 0.1; text = true("B"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "T"; pos = (0, 0); dynamic = false; collision = false; text = true("T") }
new Line { name = "ab"; pos = (A, B); color = #f59e0b }
new Line { name = "at"; pos = (A, T); color = #3b82f6 }
new Angle { name = "ang"; lines = (at, ab) }
draw Angle { name = "da"; angle = "ang" }
draw Arc { name = "arcAB"; type = CenterRadius; center = O; radius = 3.2; from = A; to = B; color = #22c55e; thickness = 3 }
Update {
  float nx = A.pos.x - O.pos.x; float ny = A.pos.y - O.pos.y;
  T.pos.x = A.pos.x + ny; T.pos.y = A.pos.y - nx;
  info = "Прямая AT (синяя) касается окружности в точке A, хорда AB (оранжевая) делит окружность на две дуги. Угол TAB между касательной и хордой равен " + format(ang.measure, 1) + "° и равен половине меньшей дуги AB (зелёная), заключённой внутри этого угла.";
}
]
