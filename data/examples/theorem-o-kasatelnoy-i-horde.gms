[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 3 }
new Point { name = "T"; circle = "w"; t = 0.02; text = true("T"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "A"; circle = "w"; t = 0.4; text = true("A"); pauseOnDrag = false }
float tx = 0; float ty = 0; string info = "";
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "ta"; pos = (T, A); color = #f59e0b; thickness = 3 }
new Line { name = "tang"; pos = (T, L2); color = #3b82f6; thickness = 3 }
new Angle { name = "ang"; lines = (tang, ta) }
draw Angle { name = "arc"; angle = "ang"; measure = false }
Update {
  tx = T.pos.x / 3; ty = T.pos.y / 3;
  L1.pos.x = T.pos.x + 7 * (-ty); L1.pos.y = T.pos.y + 7 * tx; L2.pos.x = T.pos.x - 7 * (-ty); L2.pos.y = T.pos.y - 7 * tx;
  float u = ang.measure; float duga = 2 * u;
  info = "**Теорема о касательной и хорде:** угол между касательной в точке T и хордой TA равен половине угловой меры дуги TA, заключённой между ними.\n\nУгол между касательной и хордой = " + format(u, 1) + "°, соответствующая дуга TA = " + format(duga, 1) + "° — ровно вдвое больше. Этот угол равен любому вписанному углу, опирающемуся на ту же дугу.";
}
]
