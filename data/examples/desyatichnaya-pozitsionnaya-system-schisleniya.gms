[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float D = 3; float k = 1; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
draw Text { name = "l1"; pos = (0, -3.6); text = "разряд k = " + format(k, 0); size = 0.9 }
new UI { type = slider; label = "цифра D"; variable = D; min = 1; max = 9; step = 1; default = 3 }
new UI { type = slider; label = "разряд k (степень 10)"; variable = k; min = 0; max = 3; step = 1; default = 1 }
Update {
  g = newGraph(); addNode(g, "a", [0, -3]); addNode(g, "b", [0, -3 + 0.9 * (k + 1)]); addEdge(g, "a", "b", 1, "#3b82f6");
  float v = D * pow(10, k);
  info = "**Позиционная система:** значение цифры равно произведению цифры на степень основания, соответствующую разряду: D · 10ᵏ. Каждый следующий разряд в 10 раз больше предыдущего.\n\nЦифра " + format(D, 0) + " в разряде k = " + format(k, 0) + " (высота столбика ∝ k + 1) означает величину " + format(D, 0) + " · 10" + (k == 0? "⁰" : (k == 1? "¹" : (k == 2? "²" : "³"))) + " = " + format(v, 0) + ".";
}
]
