[
description = "{info}"

field width = 16;
field height = 6;
camera type = fixed;

// ---- Натуральные числа 1, 2, 3, … — цепочка «следующее число»: между соседними других нет.
// Синий — a, оранжевый — b, зелёный — результат действия, если он снова натуральное число. ----
draw Graph { name = "gC"; graph = "gc"; nodeColor = #3b82f633; edgeColor = #3b82f688; nodeRadius = 15; labels = true; interactive = false; showWeights = false; edgeWidth = 2; layer = 5 }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #3b82f6; nodeRadius = 15; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #f59e0b; nodeRadius = 15; labels = true; interactive = false; showWeights = false; layer = 11 }
draw Graph { name = "gR"; graph = "gr"; nodeColor = #22c55e; nodeRadius = 15; labels = true; interactive = false; showWeights = false; layer = 12 }
draw Text { name = "far"; pos = (7.7, 1.3); text = far; size = 1; align = right }
draw Text { name = "dots"; pos = (7.9, 0); text = "…"; size = 1.3; align = right }

new UI { name = "sO"; type = select; label = "действие"; variable = op; options = ("add", "mul", "sub", "div"); labels = ("a + b", "a · b", "a − b", "a : b"); default = "add" }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 9; step = 1; default = 4 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 9; step = 1; default = 7 }

// ---- Логика ----
string op = "add"; float a = 4; float b = 7;
float key = -1; float r = 0; string far = ""; string info = "";

Function px(n) { return -7.4 + 0.75 * (n - 1); }
Function num(q) { if (q < 0) { return "−" + format(-q, 0); } return format(q, 0); }

Update {
  if (op == "add") { r = a + b; }
  if (op == "mul") { r = a * b; }
  if (op == "sub") { r = a - b; }
  if (op == "div") { r = a / b; }
  string sym = " + "; if (op == "mul") { sym = " · "; } if (op == "sub") { sym = " − "; } if (op == "div") { sym = " : "; }
  float nat = 0; if (r >= 1 && r == floor(r)) { nat = 1; }
  float nk = a * 1000 + b * 10; if (op == "mul") { nk = nk + 1; } if (op == "sub") { nk = nk + 2; } if (op == "div") { nk = nk + 3; }
  if (nk != key) {
    key = nk;
    gc = newGraph(); ga = newGraph(); gb = newGraph(); gr = newGraph();
    repeat (20) { addNode(gc, "n" + format(i + 1, 0), [px(i + 1), 0], format(i + 1, 0)); if (i > 0) { addEdge(gc, "n" + format(i, 0), "n" + format(i + 1, 0)); } }
    addNode(ga, "a", [px(a), 0], format(a, 0));
    addNode(gb, "b", [px(b), 0], format(b, 0));
    if (nat == 1 && r <= 20) { addNode(gr, "r", [px(r), 0], format(r, 0)); }
  }
  far = ""; if (nat == 1 && r > 20) { far = "результат " + format(r, 0) + " →"; }
  info = "**Натуральные числа** 1, 2, 3, … возникают при счёте. За каждым числом n идёт единственное следующее n + 1, и между ними других натуральных чисел нет — множество дискретно и вполне упорядочено: в любом наборе есть наименьшее число.";
  string res = num(r); if (nat == 0 && r != floor(r)) { res = format(r, 2); }
  info = info + "\n\n**a" + sym + "b = " + format(a, 0) + sym + format(b, 0) + " = " + res + ".** ";
  if (nat == 1) { info = info + "Результат — снова натуральное число: сложение и умножение натуральных чисел всегда дают натуральное."; }
  if (nat == 0 && op == "sub") { info = info + "Результат не натуральное число (не больше нуля): вычитание из натуральных чисел не всегда возможно в натуральных."; }
  if (nat == 0 && op == "div") { info = info + "Результат не натуральное число (дробь между соседними натуральными): деление тоже не замкнуто."; }
  if (nat == 1 && op == "sub") { info = info + " Здесь a > b, поэтому разность натуральна; при a ≤ b уже нет."; }
  if (nat == 1 && op == "div") { info = info + " Здесь a кратно b; в общем случае деление выводит за натуральные числа."; }
}
]
