[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float k = 0; float x0 = 0; string info = "";
func f(x) = abs(x - k);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "точка излома k"; variable = k; min = -5; max = 5; step = 0.1; default = 0 }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -8; max = 8; step = 0.1; default = 0 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float hh = 0.001;
  float dl = (f(x0) - f(x0 - hh)) / hh;
  float dr = (f(x0 + hh) - f(x0)) / hh;
  string res = "функция **дифференцируема** в x₀: левая и правая производные равны (" + num(dl, 2) + ") — касательная единственна.";
  if (abs(dl - dr) > 0.05) { res = "функция **не дифференцируема** в x₀: левая производная " + num(dl, 2) + ", правая " + num(dr, 2) + " — не совпадают, касательной нет."; }
  info = "y = |x − " + num(k, 1) + "| — модуль, сдвинутый на k = " + num(k, 1) + ". В точке x₀ = " + num(x0, 1) + " " + res;
}
]
