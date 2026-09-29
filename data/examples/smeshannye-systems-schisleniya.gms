[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Четыре разряда с разными основаниями: цифры, веса (произведения предыдущих оснований) и вклады. ----
draw Text { name = "c0"; pos = (-7.8, 3.7); text = "основание"; size = 0.85; align = left }
draw Text { name = "c1"; pos = (-7.8, 2.1); text = "цифра"; size = 0.85; align = left }
draw Text { name = "c2"; pos = (-7.8, 0.3); text = "вес разряда"; size = 0.85; align = left }
draw Text { name = "c3"; pos = (-7.8, -1.3); text = "вклад"; size = 0.85; align = left }
draw Text { name = "bs3"; pos = (-4.5, 3.7); text = "любое"; size = 1.1 }
draw Text { name = "bs2"; pos = (-1.5, 3.7); text = "b₂ = " + format(b2, 0); size = 1.1; color = #f59e0b }
draw Text { name = "bs1"; pos = (1.5, 3.7); text = "b₁ = " + format(b1, 0); size = 1.1; color = #f59e0b }
draw Text { name = "bs0"; pos = (4.5, 3.7); text = "b₀ = " + format(b0, 0); size = 1.1; color = #f59e0b }
draw Text { name = "dg3"; pos = (-4.5, 2.1); text = format(d3, 0); size = 2.4; color = #3b82f6 }
draw Text { name = "dg2"; pos = (-1.5, 2.1); text = format(d2, 0); size = 2.4; color = #3b82f6 }
draw Text { name = "dg1"; pos = (1.5, 2.1); text = format(d1, 0); size = 2.4; color = #3b82f6 }
draw Text { name = "dg0"; pos = (4.5, 2.1); text = format(d0, 0); size = 2.4; color = #3b82f6 }
draw Text { name = "w3"; pos = (-4.5, 0.3); text = format(w3, 0) + " = b₀·b₁·b₂"; size = 1 }
draw Text { name = "w2"; pos = (-1.5, 0.3); text = format(w2, 0) + " = b₀·b₁"; size = 1 }
draw Text { name = "w1"; pos = (1.5, 0.3); text = format(w1, 0) + " = b₀"; size = 1 }
draw Text { name = "w0"; pos = (4.5, 0.3); text = "1"; size = 1 }
draw Text { name = "v3"; pos = (-4.5, -1.3); text = format(d3, 0) + " · " + format(w3, 0) + " = " + format(d3 * w3, 0); size = 0.95 }
draw Text { name = "v2"; pos = (-1.5, -1.3); text = format(d2, 0) + " · " + format(w2, 0) + " = " + format(d2 * w2, 0); size = 0.95 }
draw Text { name = "v1"; pos = (1.5, -1.3); text = format(d1, 0) + " · " + format(w1, 0) + " = " + format(d1 * w1, 0); size = 0.95 }
draw Text { name = "v0"; pos = (4.5, -1.3); text = format(d0, 0) + " · 1 = " + format(d0, 0); size = 0.95 }
draw Text { name = "tot"; pos = (0, -3.3); text = "N = " + format(N, 0); size = 2; color = #f59e0b }

new UI { name = "sN"; type = slider; label = "число N"; variable = N; min = 0; max = 100000; step = 1; default = 3725 }
new UI { name = "s0"; type = slider; label = "b₀"; variable = b0; min = 2; max = 60; step = 1; default = 60 }
new UI { name = "s1"; type = slider; label = "b₁"; variable = b1; min = 2; max = 60; step = 1; default = 60 }
new UI { name = "s2"; type = slider; label = "b₂"; variable = b2; min = 2; max = 60; step = 1; default = 24 }

// ---- Логика ----
float N = 3725; float b0 = 60; float b1 = 60; float b2 = 24;
float d0 = 0; float d1 = 0; float d2 = 0; float d3 = 0; float w1 = 60; float w2 = 3600; float w3 = 86400;
string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
Function str(a, b, c, d) { return format(d, 0) + " : " + format(c, 0) + " : " + format(b, 0) + " : " + format(a, 0); }

Update {
  w1 = b0; w2 = b0 * b1; w3 = b0 * b1 * b2;
  d0 = md(N, b0); d1 = md(floor(N / w1), b1); d2 = md(floor(N / w2), b2); d3 = floor(N / w3);
  info = "**Смешанная система счисления:** основание меняется от разряда к разряду — b₀ = " + format(b0, 0) + ", b₁ = " + format(b1, 0) + ", b₂ = " + format(b2, 0) + ". Вес разряда — произведение всех предыдущих оснований: 1, b₀ = " + format(w1, 0) + ", b₀·b₁ = " + format(w2, 0) + ", b₀·b₁·b₂ = " + format(w3, 0) + ".\n\n";
  info = info + "**Запись числа:** N = " + format(N, 0) + " = " + format(d3, 0) + "·" + format(w3, 0) + " + " + format(d2, 0) + "·" + format(w2, 0) + " + " + format(d1, 0) + "·" + format(w1, 0) + " + " + format(d0, 0) + " — цифры " + str(d0, d1, d2, d3) + ". Цифра в i-м разряде меньше bᵢ (d₀ < " + format(b0, 0) + ", d₁ < " + format(b1, 0) + ", d₂ < " + format(b2, 0) + "), поэтому запись единственна; старшая цифра не ограничена.\n\n";
  info = info + "**Перенос** происходит по основанию своего разряда: когда d₀ = b₀ − 1 = " + format(b0 - 1, 0) + ", прибавление единицы обнуляет d₀ и переносит 1 в d₁ (и т. д. по цепочке).";
  if (b0 == 60 && b1 == 60 && b2 == 24) { info = info + " Здесь это часы и минуты: " + format(d3, 0) + " сут " + format(d2, 0) + " ч " + format(d1, 0) + " мин " + format(d0, 0) + " с."; }
}
]
