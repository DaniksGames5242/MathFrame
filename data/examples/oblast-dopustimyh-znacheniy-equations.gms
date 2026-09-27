[
description = "{info}"
field width = 14; field height = 6;
camera type = fixed;
float x = 3; string info = ""; float ok1 = 0;
draw Graph { name = "ax"; graph = "gax"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; active = ok1 > 0.5 }
new Point { name = "P2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = ok1 < 0.5 }
new UI { type = slider; label = "x"; variable = x; min = -3; max = 7; step = 0.1; default = 3 }
Update {
  gax = newGraph(); addNode(gax, "a1", [-6.5, 0]); addNode(gax, "a2", [6.5, 0]); addEdge(gax, "a1", "a2");
  ok1 = 0; if (x != 1 && 2 * x - 4 >= 0) { ok1 = 1; }
  P1.pos.x = x; P2.pos.x = x;
  if (ok1 > 0.5) { info = "Для уравнения x/(x − 1) + √(2x − 4) = 3 при x = " + format(x, 1) + " обе части определены (x ≠ 1 и 2x − 4 ≥ 0) — значение входит в ОДЗ: x ≥ 2."; }
  if (ok1 < 0.5) { info = "При x = " + format(x, 1) + " нарушено условие определённости (знаменатель обращается в 0 или подкоренное выражение отрицательно) — значение не входит в ОДЗ уравнения (x ≥ 2)."; }
}
]
