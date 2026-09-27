[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float a = 3; float b = 2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
new UI { type = slider; label = "a"; variable = a; min = -5; max = 5; step = 1; default = 3 }
new UI { type = slider; label = "b"; variable = b; min = -5; max = 5; step = 1; default = 2 }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Update {
  if (abs(a) < 0.5) { a = 1; } if (abs(b) < 0.5) { b = 1; }
  float k = a * b; float x = 2; float y = 3; float v = k * x * y;
  float h = v / 150 * 3; if (h > 3) { h = 3; } if (h < -3) { h = -3; }
  g = newGraph(); addNode(g, "p0", [0, 0]); addNode(g, "p1", [0, h]); addEdge(g, "p0", "p1", 1, "#3b82f6");
  info = "Запись y·" + num(b,0) + "·x·" + num(a,0) + " не в стандартном виде: числа и буквы перемешаны. **Стандартный вид** — коэффициент впереди, переменные по алфавиту: " + num(k,0) + "xy. При x = 2, y = 3 значение равно " + num(v,0) + " в обоих случаях.";
}
]
