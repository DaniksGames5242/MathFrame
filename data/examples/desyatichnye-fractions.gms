[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
float n = 34; float k = 1; string info = "";
show axes = true; show grid = true;
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #f59e0b }
new UI { type = slider; label = "число n"; variable = n; min = 1; max = 99; step = 1; default = 34 }
new UI { type = slider; label = "разрядов k"; variable = k; min = 1; max = 2; step = 1; default = 1 }
Function pow10(k2) { if (k2 < 1.5) { return 10; } return 100; }
Update {
  float den = pow10(k);
  float v = n / den;
  if (v > 9) { v = 9; }
  P.pos.x = v; P.pos.y = 0;
  info = "**Десятичная дробь** — число n/10ᵏ, записанное через запятую: " + format(n, 0) + "/" + format(den, 0) + " = " + format(v, 2) + ".\n\nОбыкновенная дробь со знаменателем — степенью десяти превращается в десятичную дробь простой перестановкой запятой.";
}
]
