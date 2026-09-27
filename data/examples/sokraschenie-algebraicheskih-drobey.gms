[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 2; string info = "";
func f(x) = x + a;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "a"; variable = a; min = -4; max = 4; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function pl(x, d) { if (x < 0) { return "− " + format(-x, d); } return "+ " + format(x, d); }
Function mi(x, d) { if (x < 0) { return "+ " + format(-x, d); } return "− " + format(x, d); }
Update {
  if (abs(a) < 0.1) { a = 0.1; }
  H.pos.x = a; H.pos.y = a + a;
  info = "**Сокращение дроби:** (x² − " + format(a * a, 1) + ")/(x " + mi(a, 1) + ") = [(x " + mi(a, 1) + ")(x " + pl(a, 1) + ")]/(x " + mi(a, 1) + ") = x " + pl(a, 1) + " при x ≠ " + num(a, 1) + " — числитель и знаменатель разделили на общий множитель (x " + mi(a, 1) + ").\n\nОтмеченная точка x = " + num(a, 1) + " — здесь исходная дробь не определена (0/0), хотя сокращённое выражение там имеет значение.";
}
]
