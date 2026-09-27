[
description = "{info}"
field width = 12.6; field height = 8;
camera type = fixed;
float b = 2; string info = "";
func f(x) = sin(x) * sin(x) + b * sin(x) * cos(x) + cos(x) * cos(x);
draw Function { name = "gf"; f = "f"; xmin = -6.28; xmax = 6.28; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "b"; variable = b; min = -4; max = 4; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float D = b * b - 4;
  string r = "нет действительных корней (D < 0)";
  if (D >= 0) { float t1 = (-b - sqrt(D)) / 2; float t2 = (-b + sqrt(D)) / 2; r = "tan x = " + num(t1, 2) + " или tan x = " + num(t2, 2); }
  info = "**sin²x + " + format(b, 1) + "·sinx·cosx + cos²x = 0** — однородное уравнение степени 2. Делим на cos²x (cos x ≠ 0), t = tan x: t² + " + format(b, 1) + "t + 1 = 0. " + r + ".";
}
]
