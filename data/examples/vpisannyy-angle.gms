[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "c"; center = O; radius = 3.5 }
new Point { name = "A"; circle = "c"; t = 0.05; text = true("A"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B"; circle = "c"; t = 0.45; text = true("B"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P"; circle = "c"; t = 0.75; text = true("P"); pauseOnDrag = false; collideWithPoints = false }
new Line { name = "pa"; pos = (P, A) }
new Line { name = "pb"; pos = (P, B) }
new Line { name = "oa"; pos = (O, A); color = #f59e0b }
new Line { name = "ob"; pos = (O, B); color = #f59e0b }
new Angle { name = "insA"; lines = (pa, pb) }
new Angle { name = "cenA"; lines = (oa, ob) }
draw Angle { name = "d1"; angle = "insA"; color = #3b82f6 }
draw Angle { name = "d2"; angle = "cenA"; color = #f59e0b }
draw Arc { name = "arc1"; type = CenterRadius; center = O; radius = 3.5; from = B; to = A; color = #3b82f6; thickness = 3 }
Update {
  info = "**Вписанный угол** ∠APB (синий) опирается на дугу AB и равен " + format(insA.measure, 1) + "°.\n\nЦентральный угол ∠AOB (оранжевый), опирающийся на ту же дугу AB, равен " + format(cenA.measure, 1) + "° — вдвое больше вписанного: " + format(cenA.measure, 1) + "° ≈ 2 × " + format(insA.measure, 1) + "°.";
}
]
