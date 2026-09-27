[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; string info = "";
func f(x) = x * x * x - 3 * a * x;
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "Emax"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = a > 0.02 }
new Point { name = "Emin"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = a > 0.02 }
new Point { name = "Infl"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e }
new UI { type = slider; label = "a"; variable = a; min = -2; max = 2; step = 0.05; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  string ext = "";
  if (a > 0.02) { float xc = sqrt(a); Emax.pos.x = -xc; Emax.pos.y = f(-xc); Emin.pos.x = xc; Emin.pos.y = f(xc);
    ext = "Максимум в x = −" + num(xc, 2) + ", минимум в x = " + num(xc, 2) + "."; }
  if (a <= 0.02) { ext = "Экстремумов нет — функция монотонно возрастает."; }
  info = "**Полное исследование функции** y = x³ − 3ax (a = " + num(a, 1) + "): область определения — все x, функция нечётная (график симметричен относительно начала координат). " + ext + " Точка перегиба (зелёная) в x = 0. При x → ±∞ функция стремится к ±∞.";
}
]
