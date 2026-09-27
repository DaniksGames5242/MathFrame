[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Circle { name = "w"; center = O; radius = 3 }
new Point { name = "P"; pos = (5, 2); dynamic = true; text = true("P") }
float theta = 20; float dist = 0; float half = 0; float dx = 0; float dy = 0; string info = "";
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "full"; pos = (L1, L2) }
new Point { name = "S1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = dist <= 2.98 }
new Point { name = "S2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = dist < 2.98 }
new Line { name = "lp"; pos = (S1, S2); active = dist <= 3.02; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "наклон прямой θ"; variable = theta; min = 0; max = 179; step = 1; default = 20 }
Update {
  float rad = theta * pi / 180; dx = cos(rad); dy = sin(rad);
  float t = -(P.pos.x * dx + P.pos.y * dy); float fx = P.pos.x + t * dx; float fy = P.pos.y + t * dy; dist = sqrt(fx * fx + fy * fy);
  L1.pos.x = fx - 9 * dx; L1.pos.y = fy - 9 * dy; L2.pos.x = fx + 9 * dx; L2.pos.y = fy + 9 * dy;
  if (dist <= 2.98) { half = sqrt(9 - dist * dist + 0.0001); S1.pos.x = fx - half * dx; S1.pos.y = fy - half * dy; S2.pos.x = fx + half * dx; S2.pos.y = fy + half * dy; }
  if (dist > 2.98 && dist < 3.02) {
    info = "**Касательная:** расстояние от центра O до прямой равно радиусу (d = " + format(dist, 2) + " ≈ r = 3) — прямая имеет с окружностью ровно одну общую точку касания.";
  } else if (dist <= 2.98) {
    info = "**Секущая:** расстояние от центра O до прямой меньше радиуса (d = " + format(dist, 2) + " < r = 3) — прямая пересекает окружность в двух точках S1, S2; отрезок S1S2 — хорда.";
  } else {
    info = "**Внешняя прямая:** расстояние от центра O до прямой больше радиуса (d = " + format(dist, 2) + " > r = 3) — общих точек с окружностью нет. Двигайте P и меняйте угол θ, чтобы прямая коснулась или пересекла окружность.";
  }
}
]
