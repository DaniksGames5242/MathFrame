[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

draw Text { name = "row0"; pos = (-7, 3.4); text = rowText(0); size = 0.95; align = left }
draw Text { name = "row1"; pos = (-7, 2.6); text = rowText(1); size = 0.95; align = left }
draw Text { name = "row2"; pos = (-7, 1.8); text = rowText(2); size = 0.95; align = left }
draw Text { name = "row3"; pos = (-7, 1.0); text = rowText(3); size = 0.95; align = left }
draw Text { name = "row4"; pos = (-7, 0.2); text = rowText(4); size = 0.95; align = left }
draw Text { name = "row5"; pos = (-7, -0.6); text = rowText(5); size = 0.95; align = left }
draw Text { name = "row6"; pos = (-7, -1.4); text = rowText(6); size = 0.95; align = left }
draw Text { name = "cur"; pos = (-7, -2.6); text = curText; size = 1; align = left; color = #3b82f6 }

new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 2; max = 60; step = 1; default = 48 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 60; step = 1; default = 18 }
new UI { name = "sStep"; type = slider; label = "шаг"; variable = step; min = 0; max = maxStep; step = 1; default = 0 }

// ---- Логика: трасса алгоритма Евклида для gcd(a, b) — на каждом шаге видны только
// текущие два числа и правило "next = остаток от деления", шаги идут по очереди
// (дискретность), правило одно и то же для всех a, b (массовость), процесс всегда
// завершается за конечное число шагов (результативность). ----
float a = 48; float b = 18;
float step = 0;
float maxStep = 0;
list xs = (0);
list ys = (0);
string info = "";
string curText = "";

Function rowText(k) {
  if (k > maxStep) { return ""; }
  string mark = iif(k == step, "→ ", "   ");
  if (k == maxStep) { return mark + format(xs[k], 0) + " и " + format(ys[k], 0) + " — конец, второе число 0"; }
  float q = floor(xs[k] / ys[k]);
  float r = xs[k] - q * ys[k];
  return mark + format(xs[k], 0) + " = " + format(q, 0) + " · " + format(ys[k], 0) + " + " + format(r, 0);
}

Function iif(c, s1, s2) { if (c) { return s1; } return s2; }

Update {
  // Трасса пересчитывается только при смене a или b — тяжёлых вычислений тут нет,
  // но список нельзя расширять бесконечно, поэтому пересобираем целиком.
  xs = [max(a, b)];
  ys = [min(a, b)];
  float k = 0;
  repeat (30) {
    if (ys[k] > 0) {
      float q = floor(xs[k] / ys[k]);
      push(xs, ys[k]);
      push(ys, xs[k] - q * ys[k]);
      k = k + 1;
    }
  }
  maxStep = k;

  curText = "Шаг " + format(step, 0) + " из " + format(maxStep, 0) + ".";
  if (step >= maxStep) {
    curText = curText + " НОД(" + format(a, 0) + ", " + format(b, 0) + ") = " + format(xs[maxStep], 0) + ".";
  }

  info = "**Алгоритм Евклида** для чисел " + format(a, 0) + " и " + format(b, 0) + ": пока второе число не 0, заменяем пару (x, y) на (y, x mod y). Каждый шаг — одно и то же элементарное действие (**дискретность**), однозначно определённое текущей парой (**детерминированность**), применимое к любым a и b (**массовость**), и процесс всегда доходит до второго числа 0 за конечное число шагов (**результативность**): здесь — за " + format(maxStep, 0) + ".";
}
]
