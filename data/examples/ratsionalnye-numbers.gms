[
description = "{info}"
field width = 20; field height = 4;
camera type = fixed;
show axes = true;
float m = 3; float n = 4; string info = "";
new Point { name = "P"; pos = (0.75, 0); dynamic = false; collision = false; color = #3b82f6 }
new UI { type = slider; label = "числитель m"; variable = m; min = -9; max = 9; step = 1; default = 3 }
new UI { type = slider; label = "знаменатель n"; variable = n; min = 1; max = 9; step = 1; default = 4 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float v = m / n; P.pos.x = v;
  string cel = "не целое"; if (abs(v - round(v)) < 0.0001) { cel = "также целое"; }
  info = "**Рациональное число** m/n = " + num(m, 0) + "/" + num(n, 0) + " = " + num(v, 3) + " (" + cel + "). Любая дробь с целым числителем и ненулевым целым знаменателем — рациональное число; её десятичная запись конечна или периодична.";
}
]
