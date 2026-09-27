[
description = "{info}"
field width = 14; field height = 5;
camera type = fixed;
float n = 3; float d = 4; string info = "";
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; active = true }
show axes = true;
new UI { type = slider; label = "числитель n"; variable = n; min = 0; max = 9; step = 1; default = 3 }
new UI { type = slider; label = "знаменатель d"; variable = d; min = 2; max = 9; step = 1; default = 4 }
Update {
  P.pos.x = n / d; P.pos.y = 0;
  info = "**Точное число** n/d = " + format(n, 0) + "/" + format(d, 0) + " = " + format(n / d, 4) + " (и далее сколько угодно верных цифр) — известно совершенно точно, без всякой погрешности измерения или округления.";
}
]
