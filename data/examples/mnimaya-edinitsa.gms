[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
float n = 1; float rr = 1; float px = 99; float py = 99;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "one"; pos = (1, 0); text = true("1"); dynamic = false; collision = false }
new Point { name = "ii"; pos = (0, 1); text = true("i"); dynamic = false; collision = false; color = #f59e0b; active = rr != 1 }
new Point { name = "z"; pos = (3, 2); text = true("z"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "iz"; pos = (-2, 3); text = true("i·z"); dynamic = false; collision = false; color = #22c55e }
new Point { name = "pw"; pos = (0, 1); text = true("iⁿ"); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "oz"; pos = (O, z); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "oiz"; pos = (O, iz); interact = false; color = #22c55e; thickness = 3 }
draw Vector { name = "vz"; edge = "oz"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "viz"; edge = "oiz"; pos = 1; color = #22c55e; thickness = 3 }
new Circle { name = "uc"; center = O; radius = 1; interact = false; color = #f59e0b }
new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 0; max = 12; step = 1; default = 1 }

Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Function ipow(k) { float r = k - 4 * floor(k / 4); if (r == 0) { return "1"; } if (r == 1) { return "i"; } if (r == 2) { return "−1"; } return "−i"; }

Update {
  float L = min(fieldMaxX, fieldMaxY);
  if (abs(z.pos.x) > L) { if (z.pos.x > 0) { z.pos.x = L; } else { z.pos.x = -L; } }
  if (abs(z.pos.y) > L) { if (z.pos.y > 0) { z.pos.y = L; } else { z.pos.y = -L; } }
  if (abs(z.pos.x - px) > 0.00001 || abs(z.pos.y - py) > 0.00001) {
    px = z.pos.x; py = z.pos.y;
    iz.pos.x = -py; iz.pos.y = px;
  }
  float r = n - 4 * floor(n / 4);
  rr = r;
  pw.pos.x = cos(1.5707963 * r); pw.pos.y = sin(1.5707963 * r);
  float a = z.pos.x; float b = z.pos.y;
  info = "**Мнимая единица** i — число, для которого i² = −1; на плоскости это точка (0; 1), не лежащая на действительной оси. Умножение на i — поворот против часовой стрелки на прямой угол вокруг начала координат: i·(a + bi) = −b + ai.\n\n";
  info = info + "Для z = " + num(a) + " + " + num(b) + "i получается i·z = " + num(-b) + " + " + num(a) + "i: действительная ось переходит в мнимую, а мнимая — в отрицательную часть действительной.\n\n";
  info = info + "**Степени i** периодичны: iⁿ зависит только от остатка n mod 4. Для n = " + format(n, 0) + " остаток равен " + format(r, 0) + ", поэтому iⁿ = " + ipow(n) + " (при n = 0, 1, 2, 3: 1, i, −1, −i).";
}
]
