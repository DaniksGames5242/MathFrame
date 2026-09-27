[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float a = 8; float b = 15; float g = 1; string info = "";
new UI { type = slider; label = "a"; variable = a; min = 2; max = 40; step = 1; default = 8 }
new UI { type = slider; label = "b"; variable = b; min = 2; max = 40; step = 1; default = 15 }
draw Graph { name = "gb"; graph = "g2"; nodeRadius = 0; edgeWidth = 22; labels = false; interactive = false; showWeights = false }
Function gcdf(x, y) { float p = x; float q = y; repeat (30) { if (q > 0.5) { float r = p - q * floor(p / q); p = q; q = r; } } return p; }
Update {
  g = gcdf(a, b);
  float sc = 14 / max(a, b);
  g2 = newGraph();
  float n1 = a / g; float i2 = 0;
  repeat (40) {
    if (i2 < n1) { string c1 = "#3b82f6"; if (i2 - 2 * floor(i2 / 2) == 1) { c1 = "#22c55e"; }
      addNode(g2, "a" + format(i2, 0), [-7 + sc * g * i2, 2]); addNode(g2, "a" + format(i2 + 1, 0), [-7 + sc * g * (i2 + 1), 2]); addEdge(g2, "a" + format(i2, 0), "a" + format(i2 + 1, 0), 1, c1); }
    i2 = i2 + 1;
  }
  float n2 = b / g; i2 = 0;
  repeat (40) {
    if (i2 < n2) { string c2 = "#3b82f6"; if (i2 - 2 * floor(i2 / 2) == 1) { c2 = "#22c55e"; }
      addNode(g2, "b" + format(i2, 0), [-7 + sc * g * i2, -2]); addNode(g2, "b" + format(i2 + 1, 0), [-7 + sc * g * (i2 + 1), -2]); addEdge(g2, "b" + format(i2, 0), "b" + format(i2 + 1, 0), 1, c2); }
    i2 = i2 + 1;
  }
  string vp = "не взаимно просты"; if (g < 1.5) { vp = "взаимно просты"; }
  info = "НОД(a, b) = " + format(g, 0) + " — числа a = " + format(a, 0) + " и b = " + format(b, 0) + " **" + vp + "**: их общий делитель, кроме единицы, " + "равен " + format(g, 0) + ".";
  if (g < 1.5) { info = "НОД(a, b) = 1 — числа a = " + format(a, 0) + " и b = " + format(b, 0) + " **взаимно просты**: у них нет общих делителей, кроме единицы."; }
}
]
