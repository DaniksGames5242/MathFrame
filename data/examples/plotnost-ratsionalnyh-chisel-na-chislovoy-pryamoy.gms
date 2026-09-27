[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
show axes = true;
new Point { name = "A"; pos = (-1, 0); color = #3b82f6 }
new Point { name = "B"; pos = (1.4, 0); color = #f59e0b }
new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = act > 0.5 }
new UI { type = slider; label = "знаменатель n"; variable = n; min = 1; max = 30; step = 1; default = 1 }
float n = 1; float act = 1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(A.pos.y) > 0.001) { A.pos.y = 0; } if (abs(B.pos.y) > 0.001) { B.pos.y = 0; }
  float lo = A.pos.x; float hi = B.pos.x; if (lo > hi) { lo = B.pos.x; hi = A.pos.x; }
  float k = round(lo * n) + 1; float v = k / n; act = 1;
  string res = "k/n = " + format(k, 0) + "/" + format(n, 0) + " = " + num(v, 3) + " — лежит между a и b";
  if (v <= lo) { k = k + 1; v = k / n; res = "k/n = " + format(k, 0) + "/" + format(n, 0) + " = " + num(v, 3) + " — лежит между a и b"; }
  if (v >= hi) { res = "при таком n подходящей дроби k/n между a и b не нашлось — увеличьте n"; act = 0; }
  K.pos.x = v;
  info = "**Плотность рациональных чисел:** между любыми a = " + num(lo, 2) + " и b = " + num(hi, 2) + " найдётся рациональное число k/n, если n достаточно велико (n > 1/(b − a)).\n\nПри n = " + format(n, 0) + ": " + res + ".";
}
]
