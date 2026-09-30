[
description = "{info}"
field width = 56; field height = 8.75;
camera type = fixed;
string info = ""; float a = 22; float b = 4; float pa = 99; float pb = 0;

draw Graph { name = "gbase"; graph = "gl"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f688; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gint"; graph = "gi"; nodeRadius = 3; nodeColor = #3b82f6; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gmul"; graph = "gm"; nodeRadius = 8; nodeColor = #22c55e; edgeWidth = 4; edgeColor = #22c55e; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "grem"; graph = "gr"; nodeRadius = 0; edgeWidth = 8; edgeColor = #f59e0b; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gpt"; graph = "gp"; nodeRadius = 11; nodeColor = #f59e0b; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { pos = (0, 1.6); text = "0"; align = center }
new UI { name = "sa"; type = slider; label = "a"; variable = a; min = -24; max = 24; step = 1; default = 22 }
new UI { name = "sb"; type = slider; label = "b"; variable = b; min = 1; max = 12; step = 1; default = 4 }

Function num(v) { if (v < 0) { return "−" + format(v * -1, 0); } return format(v, 0); }
Function md(x, y) { return x - y * floor(x / y); }

Update {
  if (a != pa || b != pb) {
    pa = a; pb = b;
    gl = newGraph(); gi = newGraph(); gm = newGraph(); gr = newGraph(); gp = newGraph();
    addNode(gl, "l0", [-27, 0]); addNode(gl, "l1", [27, 0]); addEdge(gl, "l0", "l1");
    float j = -24;
    float prev = 0; float first = 1;
    repeat (49) {
      if (md(j, b) < 0.5) {
        addNode(gm, "m" + format(j + 24, 0), [j, 0]);
        if (first < 0.5) { addEdge(gm, "m" + format(prev + 24, 0), "m" + format(j + 24, 0), 1); }
        prev = j; first = 0;
      } else { addNode(gi, "i" + format(j + 24, 0), [j, 0]); }
      j = j + 1;
    }
    float qb = b * floor(a / b);
    addNode(gp, "a", [a, 0]);
    if (a - qb > 0.5) { addNode(gr, "r0", [qb, 0]); addNode(gr, "r1", [a, 0]); addEdge(gr, "r0", "r1", 1); }
  }
  float q = floor(a / b); float rr = md(a, b);
  info = "**Делимость**: a делится на b, если a = b·q при некотором целом q. Любое целое a однозначно записывается как a = b·q + r, 0 ≤ r < b; a делится на b ровно тогда, когда r = 0.\n\n";
  info = info + "a = " + num(a) + ", b = " + num(b) + ": " + num(a) + " = " + num(b) + "·(" + num(q) + ") + " + num(rr) + ".\n\n";
  if (rr < 0.5) {
    info = info + "Остаток 0: **" + num(a) + " делится на " + num(b) + "**, частное q = " + num(q) + ". Зелёные точки — числа, кратные b.";
  } else {
    info = info + "Остаток " + num(rr) + " ≠ 0: **" + num(a) + " не делится на " + num(b) + "**. Зелёные точки — числа, кратные b; оранжевый отрезок — остаток от последнего кратного до a.";
  }
  info = info + "\n\nДелители |a|: ";
  float d = 1; float cnt = 0;
  repeat (24) {
    if (abs(a) > 0.5 && md(abs(a), d) < 0.5) { info = info + num(d) + " "; cnt = cnt + 1; }
    d = d + 1;
  }
  if (abs(a) > 24.5) { info = info + "и др. (показаны не больше 24)."; }
  if (abs(a) < 0.5) { info = info + "любое ненулевое число (0 = b·0)."; }
}
]
