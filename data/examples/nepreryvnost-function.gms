[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 1.5; string info = "";
func f1(x) = x;
func f2(x) = x + a;
draw Function { name = "g1"; f = "f1"; xmin = -6; xmax = 0; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "g2"; f = "f2"; xmin = 0; xmax = 6; color = #3b82f6; thickness = 3 }
new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "P2"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = abs(a) > 0.05 }
new UI { type = slider; label = "скачок a"; variable = a; min = -3; max = 3; step = 0.1; default = 1.5 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  P1.pos.x = 0; P1.pos.y = 0;
  P2.pos.x = 0; P2.pos.y = a;
  string s = "функция непрерывна в точке x = 0: пределы слева и справа равны f(0)."; if (abs(a) > 0.05) { s = "в точке x = 0 разрыв (скачок): предел слева 0, предел справа " + num(a, 1) + " — они не равны."; }
  info = "**Непрерывность функции:** f(x) = x при x < 0 и f(x) = x + a при x ≥ 0. Непрерывность в точке требует, чтобы предел слева, предел справа и значение функции совпадали.\n\nПри a = " + num(a, 1) + ": " + s;
}
]
