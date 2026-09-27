[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 3 }
new Point { name = "T"; circle = "w"; t = 0.15; text = true("T"); pauseOnDrag = false; color = #f59e0b }
float tx = 0; float ty = 0; string info = ""; float ang = 0;
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "ot"; pos = (O, T) }
new Line { name = "t1"; pos = (T, L1); color = #3b82f6; thickness = 3 }
new Line { name = "t2"; pos = (T, L2); color = #3b82f6; thickness = 3 }
new Angle { name = "rt"; lines = (ot, t2) }
draw Angle { name = "arc"; angle = "rt" }
Update {
  tx = T.pos.x / 3; ty = T.pos.y / 3;
  L1.pos.x = T.pos.x + 7 * (-ty); L1.pos.y = T.pos.y + 7 * tx; L2.pos.x = T.pos.x - 7 * (-ty); L2.pos.y = T.pos.y - 7 * tx;
  info = "**Свойство касательной:** прямая, проведённая через точку T окружности перпендикулярно радиусу OT, имеет с окружностью только эту общую точку — она касательная.\n\nЛюбая другая точка такой прямой дальше от центра O, чем T, значит лежит вне окружности; ближе к O на прямой точек нет. Поэтому радиус в точке касания всегда перпендикулярен касательной: ∠OTP = 90°.";
}
]
