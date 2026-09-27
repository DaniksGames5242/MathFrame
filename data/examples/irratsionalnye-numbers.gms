[
description = "{info}"
field width = 20; field height = 4;
camera type = fixed;
show axes = true;
float n = 2; string info = "";
new Point { name = "P"; pos = (1.414, 0); dynamic = false; collision = false; color = #3b82f6 }
new UI { type = slider; label = "n под корнем"; variable = n; min = 2; max = 20; step = 1; default = 2 }
Update {
  float v = sqrt(n); P.pos.x = v;
  float r = round(v);
  string kind = "иррациональное (десятичная запись бесконечна и непериодична)";
  if (abs(r * r - n) < 0.0001) { kind = "рациональное — целое, так как n оказалось точным квадратом"; }
  info = "**Иррациональные числа** нельзя записать в виде дроби целых чисел. Точка — число √" + format(n, 0) + " ≈ " + format(v, 4) + ": " + kind + ".";
}
]
