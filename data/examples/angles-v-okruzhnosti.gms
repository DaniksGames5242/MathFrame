[
description = "{info}"
field width = 12; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4; text = true("O") }
new Circle { name = "w"; center = O; radius = 4 }
new Point { name = "A"; circle = "w"; t = 0.02; text = true("A"); pauseOnDrag = false }
new Point { name = "B"; circle = "w"; t = 0.42; text = true("B"); pauseOnDrag = false }
new Point { name = "P"; circle = "w"; t = 0.75; text = true("P"); pauseOnDrag = false }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Line { name = "pa"; pos = (P, A); color = #3b82f6; thickness = 3 }
new Line { name = "pb"; pos = (P, B); color = #3b82f6; thickness = 3 }
new Angle { name = "central"; lines = (oa, ob) }
new Angle { name = "inscr"; lines = (pa, pb) }
draw Angle { name = "a1"; angle = "central"; measurecolor = #f59e0b }
draw Angle { name = "a2"; angle = "inscr" }
string info = "";
Update {
  info = "**Углы в окружности.** Центральный угол ∠AOB = " + format(central.measure, 1) + "° равен дуге AB, на которую опирается.\n\nВписанный угол ∠APB = " + format(inscr.measure, 1) + "° опирается на ту же дугу AB и составляет ровно половину центрального: " + format(central.measure, 1) + "° / 2 = " + format(central.measure / 2, 1) + "°.\n\nЛюбая другая точка окружности на той же дуге даёт такой же вписанный угол.";
}
]
