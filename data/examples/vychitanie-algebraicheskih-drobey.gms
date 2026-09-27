[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float a = -2; float b = 2; string info = "";
func f1(x) = 1 / (x - a);
func f2(x) = 1 / (x - b);
func fs(x) = 1 / (x - a) - 1 / (x - b);
draw Function { name = "g1"; f = "f1"; xmin = -10; xmax = 10; color = #f59e0b; thickness = 2 }
draw Function { name = "g2"; f = "f2"; xmin = -10; xmax = 10; color = #22c55e; thickness = 2 }
draw Function { name = "gs"; f = "fs"; xmin = -10; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "a"; variable = a; min = -4; max = 4; step = 0.1; default = -2 }
new UI { type = slider; label = "b"; variable = b; min = -4; max = 4; step = 0.1; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function mi(x, d) { if (x < 0) { return "+ " + format(-x, d); } return "− " + format(x, d); }
Update {
  if (abs(a - b) < 0.3) { b = a + 0.3; }
  info = "**Вычитание дробей:** 1/(x " + mi(a, 1) + ") − 1/(x " + mi(b, 1) + ") = [(x " + mi(b, 1) + ") − (x " + mi(a, 1) + ")] / [(x " + mi(a, 1) + ")(x " + mi(b, 1) + ")].\n\nСиний график — разность, оранжевый и зелёный — уменьшаемое и вычитаемое, приведённые к общему знаменателю.";
}
]
