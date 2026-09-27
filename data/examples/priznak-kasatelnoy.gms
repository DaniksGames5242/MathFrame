[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 3 }
new Point { name = "P"; pos = (5, 2); dynamic = true; text = true("P") }
float theta = 30; float dist = 0; string info = ""; float dx = 0; float dy = 0;
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "full"; pos = (L1, L2) }
new UI { type = slider; label = "наклон прямой θ"; variable = theta; min = 0; max = 179; step = 1; default = 30 }
Update {
  float rad = theta * pi / 180; dx = cos(rad); dy = sin(rad);
  float t = -(P.pos.x * dx + P.pos.y * dy);
  float fx = P.pos.x + t * dx; float fy = P.pos.y + t * dy; dist = sqrt(fx * fx + fy * fy);
  L1.pos.x = fx - 9 * dx; L1.pos.y = fy - 9 * dy; L2.pos.x = fx + 9 * dx; L2.pos.y = fy + 9 * dy;
  if (dist > 2.98 && dist < 3.02) {
    info = "**Признак касательной:** прямая касается окружности тогда и только тогда, когда расстояние от центра O до неё равно радиусу. Сейчас d = " + format(dist, 2) + " ≈ r = 3 — прямая касательная.";
  } else if (dist <= 2.98) {
    info = "d = " + format(dist, 2) + " < r = 3 — расстояние меньше радиуса, прямая пересекает окружность в двух точках (секущая), это не касательная.";
  } else {
    info = "d = " + format(dist, 2) + " > r = 3 — расстояние больше радиуса, общих точек с окружностью нет.";
  }
  info = info + "\n\nПодберите P и угол θ так, чтобы d стало равно 3, — прямая коснётся окружности.";
}
]
