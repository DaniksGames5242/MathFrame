[
description = "{info}"
field width = 16; field height = 6;
camera type = fixed;
float n = 5; float key = -1; string info = "";
draw Graph { name = "gd"; graph = "g"; nodeColor = #3b82f6; nodeRadius = 8; labels = true; interactive = false; edgeWidth = 0 }
new UI { type = slider; label = "число объектов n"; variable = n; min = 1; max = 15; step = 1; default = 5 }
Update {
  if (key != n) {
    g = newGraph();
    repeat (n) { float k = i + 1; addNode(g, format(k, 0), [-7 + 14 * (k - 1) / max(1, n - 1), 0], format(k, 0)); }
    key = n;
  }
  info = "**Счёт:** каждому объекту по порядку сопоставляется натуральное число — один, два, три, … Так устанавливается взаимно однозначное соответствие между объектами и числами от 1 до n.\n\nСейчас n = " + format(n, 0) + " объектов — последнему сопоставлено число " + format(n, 0) + ", это и есть их количество.";
}
]
