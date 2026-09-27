[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float qty = 20; float price = 50; string info = ""; float total = 0; float discount = 0; float final = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "цена × 10"; size = 0.9 }
draw Text { name = "l2"; pos = (0, -3.5); text = "кол-во"; size = 0.9 }
draw Text { name = "l3"; pos = (3, -3.5); text = "итого÷100"; size = 0.9 }
new UI { type = slider; label = "количество товара"; variable = qty; min = 1; max = 50; step = 1; default = 20 }
new UI { type = slider; label = "цена за единицу (₽)"; variable = price; min = 10; max = 200; step = 10; default = 50 }
Function bar(n, x, v, c) { addNode(g, n + "0", [x, -3]); addNode(g, n + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, n + "0", n + "1", 1, c); }
float VMAX = 500;
Update {
  total = qty * price;
  discount = qty > 20 ? total * 0.1 : 0;
  final = total - discount;
  g = newGraph(); bar("p", -3, price / 10, "#3b82f6"); bar("q", 0, qty, "#f59e0b"); bar("t", 3, final / 100, "#22c55e");
  info = "Покупка " + format(qty, 0) + " товаров по " + format(price, 0) + "₽. Стоимость: " + format(qty, 0) + " × " + format(price, 0) + " = " + format(total, 0) + "₽. " + (discount > 0 ? "Скидка (10% при кол-во > 20): " + format(discount, 0) + "₽. " : "") + "Итого: **" + format(final, 0) + "₽**.";
}
]
