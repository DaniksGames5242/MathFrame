[
description = "{info}"

field width = 16;
field height = 6;
camera type = fixed;

// ---- Задача из папируса Ахмеса: «Куча и её k-я часть вместе дают S». Куча — k одинаковых ящичков (синие),
// её k-я часть — ещё один такой же (оранжевый): всего k + 1 ящичков, в каждом по u. ----
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 46; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "tp"; pos = (x0 + 0.8 * k - 0.1, -0.9); text = "куча"; size = 1 }
draw Text { name = "tq"; pos = (x0 + 1.6 * k + 0.7, -0.9); text = "часть"; size = 1 }
draw Text { name = "tu"; pos = (x0 + 0.8 * k - 0.1, 1.9); text = "по " + format(u, 0) + " в каждом ящичке"; size = 0.95; color = #3b82f6 }

new UI { type = slider; label = "часть 1/k"; variable = k; min = 2; max = 8; step = 1; default = 7 }
new UI { type = slider; label = "в ящичке u"; variable = u; min = 1; max = 6; step = 1; default = 1 }

// ---- Логика ----
float k = 7; float u = 1; float x0 = -6; string info = "";
Function fs(v) { return format(v, 0); }

Update {
  x0 = -0.8 * (k + 1);
  gb = newGraph();
  repeat (k + 1) {
    string c = "#3b82f6"; if (i == k) { c = "#f59e0b"; }
    addNode(gb, "a" + fs(i), [x0 + 1.6 * i + 0.1, 0.3]); addNode(gb, "b" + fs(i), [x0 + 1.6 * i + 1.5, 0.3]); addEdge(gb, "a" + fs(i), "b" + fs(i), 1, c);
  }
  float S = (k + 1) * u;
  info = "**Задача (папирус Ахмеса, ок. 1650 г. до н. э.).** Куча и её " + fs(k) + "-я часть вместе составляют " + fs(S) + ". Найти кучу.\n\n";
  info = info + "**Способ ложного положения.** Возьмём удобное число — " + fs(k) + " (оно делится на " + fs(k) + "): куча " + fs(k) + ", её часть 1, вместе " + fs(k + 1) + ". Нужно " + fs(S) + " — это в " + fs(S) + " : " + fs(k + 1) + " = " + fs(u) + " раз больше, поэтому и куча в " + fs(u) + " раз больше: " + fs(k) + " · " + fs(u) + " = **" + fs(k * u) + "**.\n\n";
  info = info + "Проверка: " + fs(k * u) + " + " + fs(k * u) + " : " + fs(k) + " = " + fs(k * u) + " + " + fs(u) + " = " + fs(S) + ".";
}
]
