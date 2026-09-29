[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Две руки: на каждой загнуто (число − 5) пальцев (янтарные), остальные выпрямлены (синие). ----
draw Graph { name = "gP"; graph = "gp"; edgeColor = #6b728055; edgeWidth = 46; edgeCap = round; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gF"; graph = "gf"; edgeWidth = 20; edgeCap = round; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "tL"; pos = (-3.3, -3.6); text = format(x, 0) + " = 5 + " + format(x - 5, 0); size = 1.3 }
draw Text { name = "tR"; pos = (3.3, -3.6); text = format(y, 0) + " = 5 + " + format(y - 5, 0); size = 1.3 }
draw Text { name = "tL2"; pos = (-3.3, 4.3); text = "загнуто " + format(x - 5, 0) + ", прямо " + format(10 - x, 0); size = 1 }
draw Text { name = "tR2"; pos = (3.3, 4.3); text = "загнуто " + format(y - 5, 0) + ", прямо " + format(10 - y, 0); size = 1 }

new UI { name = "sX"; type = slider; label = "первый множитель"; variable = x; min = 6; max = 9; step = 1; default = 7 }
new UI { name = "sY"; type = slider; label = "второй множитель"; variable = y; min = 6; max = 9; step = 1; default = 8 }

float x = 7; float y = 8; float key = -1; string info = "";

Update {
  if (key != x * 10 + y) {
    key = x * 10 + y;
    gp = newGraph(); gf = newGraph();
    addNode(gp, "l1", [-5.6, -1.6]); addNode(gp, "l2", [-1.0, -1.6]); addEdge(gp, "l1", "l2");
    addNode(gp, "r1", [1.0, -1.6]); addNode(gp, "r2", [5.6, -1.6]); addEdge(gp, "r1", "r2");
    repeat (5) {
      float xl = -5.5 + 1.15 * i; float xr = 1.1 + 1.15 * i;
      string cl = "#3b82f6"; float hl = 3.6; if (i < x - 5) { cl = "#f59e0b"; hl = 0.2; }
      string cr = "#3b82f6"; float hr = 3.6; if (i < y - 5) { cr = "#f59e0b"; hr = 0.2; }
      addNode(gf, "a" + format(i, 0), [xl, -1.2]); addNode(gf, "b" + format(i, 0), [xl, hl]); addEdge(gf, "a" + format(i, 0), "b" + format(i, 0), 1, cl);
      addNode(gf, "c" + format(i, 0), [xr, -1.2]); addNode(gf, "d" + format(i, 0), [xr, hr]); addEdge(gf, "c" + format(i, 0), "d" + format(i, 0), 1, cr);
    }
  }
  float a = x - 5; float b = y - 5; float tens = a + b; float ones = (5 - a) * (5 - b);
  info = "**Умножение на пальцах** для чисел от 6 до 9. Множители " + format(x, 0) + " = 5 + " + format(a, 0) + " и " + format(y, 0) + " = 5 + " + format(b, 0) + ": на руках загнуто " + format(a, 0) + " и " + format(b, 0) + " пальцев.\n\n**Десятки:** загнутые пальцы, " + format(a, 0) + " + " + format(b, 0) + " = " + format(tens, 0) + ". **Единицы:** произведение выпрямленных, " + format(5 - a, 0) + " · " + format(5 - b, 0) + " = " + format(ones, 0) + ".\n\n";
  info = info + "Итого " + format(tens, 0) + " · 10 + " + format(ones, 0) + " = **" + format(x * y, 0) + "**. Верно, потому что (5 + a)(5 + b) = 10(a + b) + (5 − a)(5 − b).";
  if (ones > 9) { info = info + " Единиц получилось больше девяти, поэтому лишний десяток переносится в десятки."; }
}
]
