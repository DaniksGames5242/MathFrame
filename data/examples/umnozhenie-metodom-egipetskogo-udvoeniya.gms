[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Таблица удвоения: слева степени двойки, справа множимое, удвоенное k раз.
// Янтарным отмечены строки, степени двойки в которых дают множитель. ----
draw Graph { name = "gH"; graph = "gh"; edgeWidth = 40; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "h1"; pos = (-4, 4.3); text = "степень двойки"; size = 1 }
draw Text { name = "h2"; pos = (1.5, 4.3); text = "множимое × степень"; size = 1 }
draw Text { name = "p0"; pos = (-4, 3.30); text = format(pow(2, 0), 0); size = 1.3; layer = 5; active = pow(2, 0) <= b }
draw Text { name = "d0"; pos = (1.5, 3.30); text = format(a * pow(2, 0), 0); size = 1.3; layer = 5; active = pow(2, 0) <= b }
draw Text { name = "m0"; pos = (5.8, 3.30); text = "✓"; size = 1.4; color = #22c55e; layer = 5; active = pow(2, 0) <= b && bit(0) > 0.5 }
draw Text { name = "p1"; pos = (-4, 1.85); text = format(pow(2, 1), 0); size = 1.3; layer = 5; active = pow(2, 1) <= b }
draw Text { name = "d1"; pos = (1.5, 1.85); text = format(a * pow(2, 1), 0); size = 1.3; layer = 5; active = pow(2, 1) <= b }
draw Text { name = "m1"; pos = (5.8, 1.85); text = "✓"; size = 1.4; color = #22c55e; layer = 5; active = pow(2, 1) <= b && bit(1) > 0.5 }
draw Text { name = "p2"; pos = (-4, 0.40); text = format(pow(2, 2), 0); size = 1.3; layer = 5; active = pow(2, 2) <= b }
draw Text { name = "d2"; pos = (1.5, 0.40); text = format(a * pow(2, 2), 0); size = 1.3; layer = 5; active = pow(2, 2) <= b }
draw Text { name = "m2"; pos = (5.8, 0.40); text = "✓"; size = 1.4; color = #22c55e; layer = 5; active = pow(2, 2) <= b && bit(2) > 0.5 }
draw Text { name = "p3"; pos = (-4, -1.05); text = format(pow(2, 3), 0); size = 1.3; layer = 5; active = pow(2, 3) <= b }
draw Text { name = "d3"; pos = (1.5, -1.05); text = format(a * pow(2, 3), 0); size = 1.3; layer = 5; active = pow(2, 3) <= b }
draw Text { name = "m3"; pos = (5.8, -1.05); text = "✓"; size = 1.4; color = #22c55e; layer = 5; active = pow(2, 3) <= b && bit(3) > 0.5 }
draw Text { name = "p4"; pos = (-4, -2.50); text = format(pow(2, 4), 0); size = 1.3; layer = 5; active = pow(2, 4) <= b }
draw Text { name = "d4"; pos = (1.5, -2.50); text = format(a * pow(2, 4), 0); size = 1.3; layer = 5; active = pow(2, 4) <= b }
draw Text { name = "m4"; pos = (5.8, -2.50); text = "✓"; size = 1.4; color = #22c55e; layer = 5; active = pow(2, 4) <= b && bit(4) > 0.5 }
draw Text { name = "p5"; pos = (-4, -3.95); text = format(pow(2, 5), 0); size = 1.3; layer = 5; active = pow(2, 5) <= b }
draw Text { name = "d5"; pos = (1.5, -3.95); text = format(a * pow(2, 5), 0); size = 1.3; layer = 5; active = pow(2, 5) <= b }
draw Text { name = "m5"; pos = (5.8, -3.95); text = "✓"; size = 1.4; color = #22c55e; layer = 5; active = pow(2, 5) <= b && bit(5) > 0.5 }

new UI { name = "sA"; type = slider; label = "множимое"; variable = a; min = 1; max = 99; step = 1; default = 13 }
new UI { name = "sB"; type = slider; label = "множитель"; variable = b; min = 1; max = 63; step = 1; default = 11 }

float a = 13; float b = 11; float key = -1; string info = "";

Function bit(k) { return floor(b / pow(2, k)) - 2 * floor(b / pow(2, k + 1)); }

Update {
  if (key != a * 100 + b) {
    key = a * 100 + b;
    gh = newGraph();
    repeat (6) { if (pow(2, i) <= b && bit(i) > 0.5) { float y = 3.3 - 1.45 * i; addNode(gh, "l" + format(i, 0), [-6.6, y]); addNode(gh, "r" + format(i, 0), [6.6, y]); addEdge(gh, "l" + format(i, 0), "r" + format(i, 0), 1, "#f59e0b44"); } }
  }
  string sum = ""; string pw = ""; float rows = 0; float tot = 0; float first = 1;
  repeat (6) { float k = 5 - i; if (pow(2, k) <= b) { rows = rows + 1; } if (pow(2, k) <= b && bit(k) > 0.5) { if (first < 0.5) { sum = sum + " + "; pw = pw + " + "; } sum = sum + format(a * pow(2, k), 0); pw = pw + format(pow(2, k), 0); tot = tot + a * pow(2, k); first = 0; } }
  info = "**Египетское удвоение.** Множимое " + format(a, 0) + " удваивается строка за строкой, рядом записываются степени двойки, пока они не превысят множитель — здесь строк: " + format(rows, 0) + ". Множитель " + format(b, 0) + " = " + pw + " — единственное разложение на степени двойки (двоичная запись). Складываем строки с отмеченными степенями:\n\n**" + sum + " = " + format(tot, 0) + "**, и правда " + format(a, 0) + " · " + format(b, 0) + " = " + format(a * b, 0) + ". Нужны только удвоение и сложение.";
}
]
