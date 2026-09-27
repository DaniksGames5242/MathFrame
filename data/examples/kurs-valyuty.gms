[
description = "{info}"
field width = 14; field height = 12;
camera type = fixed;
float amount = 3; float rate = 90; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = true; interactive = false }
new UI { type = slider; label = "сумма, $"; variable = amount; min = 0.5; max = 10; step = 0.5; default = 3 }
new UI { type = slider; label = "курс, ₽ за 1$"; variable = rate; min = 50; max = 120; step = 1; default = 90 }
Update {
  float rub = amount * rate;
  g = newGraph();
  float h1 = 5 * amount / 10; addNode(g, "u0", [-3, -5], ""); addNode(g, "u1", [-3, -5 + h1], ""); addEdge(g, "u0", "u1", 1, "#3b82f6"); addNode(g, "lu", [-3, -5.8], format(amount, 1) + " $");
  float h2 = 5 * rub / 1200; if (h2 > 5.5) { h2 = 5.5; } addNode(g, "r0", [3, -5], ""); addNode(g, "r1", [3, -5 + h2], ""); addEdge(g, "r0", "r1", 1, "#22c55e"); addNode(g, "lr", [3, -5.8], format(rub, 0) + " ₽");
  info = "**Курс валюты** — цена одной единицы иностранной валюты в национальной. При курсе " + format(rate, 0) + " ₽ за 1$ сумма в " + format(amount, 1) + " $ (синий столбик) стоит " + format(amount, 1) + " × " + format(rate, 0) + " = **" + format(rub, 0) + " ₽** (зелёный столбик).";
}
]
