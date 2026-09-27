[
description = "{info}"
field width = 14; field height = 12;
camera type = fixed;
string dir = "toUsd"; float amount = 900; float rate = 90; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = true; interactive = false }
new UI { type = select; label = "направление обмена"; variable = dir; options = ("toUsd", "toRub"); labels = ("₽ → $", "$ → ₽"); default = "toUsd" }
new UI { type = slider; label = "сумма"; variable = amount; min = 1; max = 1000; step = 1; default = 900 }
new UI { type = slider; label = "курс, ₽ за 1$"; variable = rate; min = 50; max = 120; step = 1; default = 90 }
Update {
  float m1 = amount; float m2 = 0; string u1 = "₽"; string u2 = "$"; string op = "÷";
  if (dir == "toUsd") { m2 = amount / rate; } else { m2 = amount * rate; u1 = "$"; u2 = "₽"; op = "×"; }
  float VMAX1 = 1000; float VMAX2 = 10; if (dir == "toRub") { VMAX1 = 10; VMAX2 = 1200; }
  g = newGraph();
  float h1 = 5 * m1 / VMAX1; if (h1 > 5.5) { h1 = 5.5; } addNode(g, "a0", [-3, -5], ""); addNode(g, "a1", [-3, -5 + h1], ""); addEdge(g, "a0", "a1", 1, "#3b82f6"); addNode(g, "la", [-3, -5.8], format(m1, 1) + " " + u1);
  float h2 = 5 * m2 / VMAX2; if (h2 > 5.5) { h2 = 5.5; } addNode(g, "b0", [3, -5], ""); addNode(g, "b1", [3, -5 + h2], ""); addEdge(g, "b0", "b1", 1, "#22c55e"); addNode(g, "lb", [3, -5.8], format(m2, 2) + " " + u2);
  info = "**Обмен валюты** — пересчёт суммы из одной валюты в другую по курсу. При курсе " + format(rate, 0) + " ₽ за 1$: " + format(m1, 1) + " " + u1 + " " + op + " " + format(rate, 0) + " = **" + format(m2, 2) + " " + u2 + "**.";
}
]
