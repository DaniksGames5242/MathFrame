[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "c"; center = O; radius = 3.5 }
new Point { name = "A"; circle = "c"; t = 0.08; text = true("A"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B"; circle = "c"; t = 0.36; text = true("B"); pauseOnDrag = false; collideWithPoints = false }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Angle { name = "ang"; lines = (oa, ob) }
draw Angle { name = "da"; angle = "ang" }
draw Arc { name = "arc1"; type = CenterRadius; center = O; radius = 3.5; from = B; to = A; color = #3b82f6; thickness = 3 }
Update {
  info = "**Центральный угол** ∠AOB с вершиной в центре O образован радиусами OA и OB. Он равен " + format(ang.measure, 1) + "° и определяет дугу AB (синяя) той же меры: " + format(ang.measure, 1) + "°.\n\nВеличина центрального угла всегда равна градусной мере дуги, на которую он опирается.";
}
]
