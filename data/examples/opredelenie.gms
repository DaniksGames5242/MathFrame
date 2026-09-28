[
description = "{info}"

field width = 18;
field height = 10;
camera type = fixed;

// ---- Определение «n — простое число: целое n > 1, у которого нет делителей, кроме
// 1 и самого n». Проверяем описание для n = 2…20: числа окрашены по тому, подходят ли
// они под понятие — определение проводит чёткую границу между двумя классами. ----
draw Graph { name = "gP"; graph = "gp"; nodeColor = #22c55e; nodeRadius = 13; labels = true; interactive = false; showWeights = false }
draw Graph { name = "gC"; graph = "gc"; nodeColor = #3b82f6; nodeRadius = 13; labels = true; interactive = false; showWeights = false }
draw Text { name = "pointer"; pos = (px(N - 2), 0.4); text = "▲"; size = 0.9; color = #f59e0b }

new UI { name = "sN"; type = slider; label = "n"; variable = N; min = 2; max = 20; step = 1; default = 12 }

// ---- Логика ----
float N = 12;
string info = "";

Function px(i) { return -8.4 + i * 0.94; }
Function isPrime(n) {
  float d = 2; float ok = 1;
  repeat (18) { float k = d; if (k < n && ok == 1) { if (n - floor(n / k) * k == 0) { ok = 0; } } d = d + 1; }
  return ok;
}
Function divisor(n) {
  float d = 2; float found = 0;
  repeat (18) { float k = d; if (found == 0 && k < n && n - floor(n / k) * k == 0) { found = k; } d = d + 1; }
  return found;
}

Update {
  gp = newGraph(); gc = newGraph();
  repeat (19) { float num = i + 2; if (isPrime(num) > 0.5) { addNode(gp, "a" + format(num, 0), [px(i), 1.5], format(num, 0)); } else { addNode(gc, "a" + format(num, 0), [px(i), 1.5], format(num, 0)); } }

  string desc = "целое число n > 1, у которого нет делителей, кроме 1 и самого n";
  info = "**Определение** вводит термин через равенство с описанием из уже известных понятий: [простое число] есть [" + desc + "]. Описание — граница: любое n, ему удовлетворяющее, попадает в понятие, а любое n, ему не удовлетворяющее, — нет, третьего не дано.\n\n";
  float p = isPrime(N);
  if (p > 0.5) { info = info + "n = " + format(N, 0) + " делителей, кроме 1 и " + format(N, 0) + ", не имеет — оно **подпадает** под определение, это простое число."; }
  else { info = info + "n = " + format(N, 0) + " делится на " + format(divisor(N), 0) + " — под определение простого числа оно **не подпадает** (составное)."; }
  info = info + "\n\nЗелёным отмечены числа, удовлетворяющие описанию (2…20); серым — все остальные: определение разбивает ряд чисел на два непересекающихся класса без исключений и без пересечения.";
}
]
