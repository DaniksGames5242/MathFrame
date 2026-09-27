[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = 1; float b = 1; float idx = 0; string info = "";
Function f(x) { if (idx < 0.5) { return a * sin(b * x); } if (idx < 1.5) { return a * cos(b * x); } if (idx < 2.5) { return a * tan(b * x); } return a * cos(b * x) / sin(b * x); }
draw Function { name = "gr"; f = "f"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "функция: 0-sin 1-cos 2-tg 3-ctg"; variable = idx; min = 0; max = 3; step = 1; default = 0 }
new UI { type = slider; label = "a"; variable = a; min = 0.5; max = 3; step = 0.1; default = 1 }
new UI { type = slider; label = "b"; variable = b; min = 0.5; max = 3; step = 0.1; default = 1 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  string name = "sin"; float per = 6.28318 / b;
  if (idx >= 0.5 && idx < 1.5) { name = "cos"; }
  if (idx >= 1.5 && idx < 2.5) { name = "tg"; per = 3.14159 / b; }
  if (idx >= 2.5) { name = "ctg"; per = 3.14159 / b; }
  info = "**y = a·" + name + "(bx)** — амплитуда " + format(a, 1) + " (для sin/cos), период ≈ " + num(per, 2) + ". Все тригонометрические функции периодичны.";
}
]
