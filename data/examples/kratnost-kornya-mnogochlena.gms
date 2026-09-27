[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float k = 3; string info = "";
func f(x) = pow(x - a, k);
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "корень a"; variable = a; min = -3; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "кратность k"; variable = k; min = 1; max = 4; step = 1; default = 3 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function mi(x, d) { if (x < 0) { return "+ " + format(-x, d); } return "− " + format(x, d); }
Function sup(n) { if (n < 1.5) { return "¹"; } if (n < 2.5) { return "²"; } if (n < 3.5) { return "³"; } return "⁴"; }
Update {
  string beh = "пересекает ось Ox, меняя знак"; if (k - 2 * floor(k / 2) == 0) { beh = "касается оси Ox, не меняя знак"; }
  info = "**y = (x " + mi(a, 1) + ")" + sup(k) + "**: корень x = " + num(a, 1) + " имеет кратность " + format(k, 0) + ". В этой точке график " + beh + ".";
}
]
