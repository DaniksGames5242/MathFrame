[
description = "{info}"
field width = 18; field height = 12;
camera type = fixed;
float price = 370; float paid = 500; string info = ""; list denoms = [500, 100, 50, 10, 5, 1];
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 20; labels = true; interactive = false }
new UI { type = slider; label = "цена товара, ₽"; variable = price; min = 10; max = 950; step = 5; default = 370 }
new UI { type = slider; label = "уплачено, ₽"; variable = paid; min = price; max = 1000; step = 5; default = 500 }
Update {
  if (paid < price) { paid = price; }
  float change = paid - price; float rem = change; float VMAX = 10;
  g = newGraph();
  repeat (6) { float d = denoms[i]; float cnt = floor(rem / d + 0.0001); rem = rem - cnt * d; float x = -7.5 + i * 3; float y = 5.5 * cnt / VMAX; if (y > 5.5) { y = 5.5; } addNode(g, "b" + i + "0", [x, -5], ""); addNode(g, "b" + i + "1", [x, -5 + y], ""); addEdge(g, "b" + i + "0", "b" + i + "1", 1); addNode(g, "lb" + i, [x, -5.8], format(d, 0) + " ₽ × " + format(cnt, 0)); }
  info = "**Сдача = уплачено − цена товара.** " + format(paid, 0) + " − " + format(price, 0) + " = **" + format(change, 0) + " ₽**.\n\nСтолбики — сколько купюр и монет каждого номинала (500, 100, 50, 10, 5, 1 ₽) нужно выдать, чтобы набрать эту сумму наименьшим числом купюр и монет.";
}
]
