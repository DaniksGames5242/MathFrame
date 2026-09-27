[
description = "{info}"
field width = 16; field height = 6;
camera type = fixed;
float k = 1; string info = "";
new Point { name = "A"; pos = (-3, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "B"; pos = (1, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "C"; pos = (4, 0); dynamic = false; collision = false; color = #22c55e }
new UI { type = slider; label = "k"; variable = k; min = -2; max = 2; step = 0.1; default = 1 }
show axes = true;
Update {
  A.pos.x = -3 * k; B.pos.x = 1 * k; C.pos.x = 4 * k;
  string r = "порядок сохраняется: ka < kb < kc"; if (k < -0.05) { r = "порядок меняется на противоположный: kc < kb < ka"; } if (abs(k) <= 0.05) { r = "все три точки сливаются в 0"; }
  info = "**−3 < 1 < 4.** Умножаем все три части двойного неравенства на k = " + format(k, 1) + ": " + r + " (точки A, B, C — их новые положения).";
}
]
