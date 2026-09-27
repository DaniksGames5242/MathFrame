[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "c"; center = O; radius = 3.5 }
new Point { name = "A"; pos = (-3.5, 0); dynamic = false; collision = false; text = true("A") }
new Point { name = "B"; pos = (3.5, 0); dynamic = false; collision = false; text = true("B") }
new Line { name = "ab"; pos = (A, B); color = #f59e0b }
new Point { name = "P"; circle = "c"; t = 0.2; text = true("P"); pauseOnDrag = false; collideWithPoints = false }
new Line { name = "pa"; pos = (P, A) }
new Line { name = "pb"; pos = (P, B) }
new Angle { name = "ang"; lines = (pa, pb) }
draw Angle { name = "da"; angle = "ang"; color = #3b82f6 }
Update {
  info = "AB (оранжевая) — диаметр окружности, P — любая точка окружности. Вписанный угол ∠APB, опирающийся на диаметр, равен " + format(ang.measure, 1) + "° — прямой угол, при любом положении P.\n\nЭто следует из того, что дуга AB между концами диаметра равна 180°, а вписанный угол равен половине дуги, на которую опирается: 180° / 2 = 90°.";
}
]
