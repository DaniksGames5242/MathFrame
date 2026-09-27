[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
string mode = "formula"; float N = 8; float key = -1; string info = "";
draw Graph { name = "gd"; graph = "g"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; edgeWidth = 0 }
draw Graph { name = "gAx"; graph = "gx"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new UI { type = select; label = "способ задания"; variable = mode; options = ("formula", "recur"); labels = ("формулой: aₙ = 2n − 1", "рекуррентно: a₁ = 1, aₙ = aₙ₋₁ + 2"); default = "formula" }
new UI { type = slider; label = "число членов n"; variable = N; min = 3; max = 10; step = 1; default = 8 }
Update {
  if (key != N * 10 + (mode == "formula")) {
    gx = newGraph(); addNode(gx, "a1", [-7.5, -4]); addNode(gx, "a2", [7.5, -4]); addEdge(gx, "a1", "a2");
    g = newGraph(); float a = 1;
    repeat (N) { float n = i + 1; float v = a; if (mode == "formula") { v = 2 * n - 1; } addNode(g, "p" + format(n, 0), [-7.5 + 15 * (n - 1) / (N - 1), -4 + 0.5 * v]); a = a + 2; }
    key = N * 10 + (mode == "formula");
  }
  info = "**Способы задания последовательности** aₙ = 2n − 1 (нечётные числа): формулой общего члена — прямо по номеру n, или рекуррентно — через предыдущий член. Оба способа дают одну и ту же последовательность 1, 3, 5, 7, …\n\nСейчас: " + mode + "."; if (mode == "formula") { info = "**Формула общего члена:** aₙ = 2n − 1 вычисляет любой член сразу по его номеру, без предыдущих членов."; } if (mode == "recur") { info = "**Рекуррентное задание:** a₁ = 1, каждый следующий член aₙ = aₙ₋₁ + 2 — вычисляется только через предыдущий."; }
}
]
