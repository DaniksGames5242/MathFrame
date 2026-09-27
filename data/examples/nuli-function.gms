[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = 2; string info = "";
func f(x) = (x - a) * (x + b);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "z1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = true }
new Point { name = "z2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "a"; variable = a; min = -5; max = 5; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 5; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  z1.pos.x = a; z1.pos.y = 0;
  z2.pos.x = -b; z2.pos.y = 0;
  info = "Функция y = (x − " + format(a, 1) + ")(x + " + format(b, 1) + ") обращается в нуль при x = " + num(a, 1) + " и x = " + num(-b, 1) + ".";
}
]
