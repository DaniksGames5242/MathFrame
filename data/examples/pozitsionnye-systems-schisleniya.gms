[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Четыре позиции: цифра dₖ, вес позиции bᵏ и вклад dₖ·bᵏ. Внизу — доли вкладов в числе. ----
draw Graph { name = "gS"; graph = "gs"; edgeWidth = 26; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "hd"; pos = (-7.8, 2.6); text = "цифра"; size = 0.9; align = left }
draw Text { name = "hw"; pos = (-7.8, 0.7); text = "вес"; size = 0.9; align = left }
draw Text { name = "hp"; pos = (-7.8, -1.1); text = "вклад"; size = 0.9; align = left }
draw Text { name = "hs"; pos = (-7.8, -3.4); text = "доли"; size = 0.9; align = left }
draw Text { name = "k0"; pos = (6.6, 4.2); text = "позиция 0"; size = 0.95; layer = 6 }
draw Text { name = "d0"; pos = (6.6, 2.6); text = dg(d0); size = 2.2; layer = 6 }
draw Text { name = "w0"; pos = (6.6, 0.7); text = format(b, 0) + sup(0) + " = " + format(pow(b, 0), 0); size = 1.1; layer = 6 }
draw Text { name = "p0"; pos = (6.6, -1.1); text = format(d0, 0) + " · " + format(pow(b, 0), 0) + " = " + format(d0 * pow(b, 0), 0); size = 1.1; layer = 6 }
draw Text { name = "k1"; pos = (3.0, 4.2); text = "позиция 1"; size = 0.95; layer = 6 }
draw Text { name = "d1"; pos = (3.0, 2.6); text = dg(d1); size = 2.2; layer = 6 }
draw Text { name = "w1"; pos = (3.0, 0.7); text = format(b, 0) + sup(1) + " = " + format(pow(b, 1), 0); size = 1.1; layer = 6 }
draw Text { name = "p1"; pos = (3.0, -1.1); text = format(d1, 0) + " · " + format(pow(b, 1), 0) + " = " + format(d1 * pow(b, 1), 0); size = 1.1; layer = 6 }
draw Text { name = "k2"; pos = (-0.6, 4.2); text = "позиция 2"; size = 0.95; layer = 6 }
draw Text { name = "d2"; pos = (-0.6, 2.6); text = dg(d2); size = 2.2; layer = 6 }
draw Text { name = "w2"; pos = (-0.6, 0.7); text = format(b, 0) + sup(2) + " = " + format(pow(b, 2), 0); size = 1.1; layer = 6 }
draw Text { name = "p2"; pos = (-0.6, -1.1); text = format(d2, 0) + " · " + format(pow(b, 2), 0) + " = " + format(d2 * pow(b, 2), 0); size = 1.1; layer = 6 }
draw Text { name = "k3"; pos = (-4.2, 4.2); text = "позиция 3"; size = 0.95; layer = 6 }
draw Text { name = "d3"; pos = (-4.2, 2.6); text = dg(d3); size = 2.2; layer = 6 }
draw Text { name = "w3"; pos = (-4.2, 0.7); text = format(b, 0) + sup(3) + " = " + format(pow(b, 3), 0); size = 1.1; layer = 6 }
draw Text { name = "p3"; pos = (-4.2, -1.1); text = format(d3, 0) + " · " + format(pow(b, 3), 0) + " = " + format(d3 * pow(b, 3), 0); size = 1.1; layer = 6 }

new UI { name = "sb"; type = slider; label = "основание"; variable = b; min = 2; max = 16; step = 1; default = 10 }
new UI { name = "s3"; type = slider; label = "цифра 3"; variable = d3; min = 0; max = b - 1; step = 1; default = 1 }
new UI { name = "s2"; type = slider; label = "цифра 2"; variable = d2; min = 0; max = b - 1; step = 1; default = 2 }
new UI { name = "s1"; type = slider; label = "цифра 1"; variable = d1; min = 0; max = b - 1; step = 1; default = 0 }
new UI { name = "s0"; type = slider; label = "цифра 0"; variable = d0; min = 0; max = b - 1; step = 1; default = 7 }

float b = 10; float d3 = 1; float d2 = 2; float d1 = 0; float d0 = 7; float key = -1; string info = "";

Function dg(d) {
  if (d < 10) { return format(d, 0); }
  if (d == 10) { return "A"; } if (d == 11) { return "B"; } if (d == 12) { return "C"; }
  if (d == 13) { return "D"; } if (d == 14) { return "E"; } return "F";
}
Function sup(e) { if (e == 0) { return "⁰"; } if (e == 1) { return "¹"; } if (e == 2) { return "²"; } return "³"; }
Function dk(k) { if (k == 3) { return d3; } if (k == 2) { return d2; } if (k == 1) { return d1; } return d0; }

Update {
  float N = d3 * b * b * b + d2 * b * b + d1 * b + d0;
  float kk = N * 100 + b;
  if (key != kk) {
    key = kk;
    gs = newGraph();
    float acc = 0;
    repeat (4) {
      float k = 3 - i; float v = dk(k) * pow(b, k);
      if (v > 0) {
        string c = "#3b82f6"; if (k == 2) { c = "#f59e0b"; } if (k == 1) { c = "#22c55e"; }
        addNode(gs, "a" + format(k, 0), [-6.2 + 13.6 * acc / N, -3.4]); acc = acc + v; addNode(gs, "b" + format(k, 0), [-6.2 + 13.6 * acc / N, -3.4]); addEdge(gs, "a" + format(k, 0), "b" + format(k, 0), 1, c);
      }
    }
  }
  string rec = dg(d3) + dg(d2) + dg(d1) + dg(d0);
  info = "**Позиционная система с основанием " + format(b, 0) + ".** Значение цифры зависит от позиции: dₖ стоит в позиции k, считая справа от нуля, и вносит dₖ · " + format(b, 0) + "ᵏ. Запись " + rec + " означает\n\n**N = " + dg(d3) + "·" + format(b, 0) + "³ + " + dg(d2) + "·" + format(b, 0) + "² + " + dg(d1) + "·" + format(b, 0) + " + " + dg(d0) + " = " + format(N, 0) + "** (в десятичной записи).\n\n";
  info = info + "Цифр в системе ровно " + format(b, 0) + ": от 0 до " + dg(b - 1) + ". Числа сравниваются по старшим позициям: у левой позиции наибольший вес";
  if (N > 0) { info = info + " (здесь " + format(100 * d3 * b * b * b / N, 0) + " % числа приходится на позицию 3)"; }
  info = info + ".";
}
]
