[
description = "{info}"
field width = 14; field height = 8;
camera type = fixed;
float n = 4; string info = "";
new Point { name = "A"; pos = (-6, -2) }
new Point { name = "B"; pos = (6, 3) }
new Line { name = "ab"; pos = (A, B); color = #3b82f6; thickness = 3 }
new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "P2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "P3"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "P4"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "P5"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new UI { type = slider; label = "число частей n"; variable = n; min = 2; max = 6; step = 1; default = 4 }
Update {
  P1.active = 1 < n; if (P1.active) { P1.pos.x = A.pos.x + 1 * (B.pos.x - A.pos.x) / n; P1.pos.y = A.pos.y + 1 * (B.pos.y - A.pos.y) / n; }
  P2.active = 2 < n; if (P2.active) { P2.pos.x = A.pos.x + 2 * (B.pos.x - A.pos.x) / n; P2.pos.y = A.pos.y + 2 * (B.pos.y - A.pos.y) / n; }
  P3.active = 3 < n; if (P3.active) { P3.pos.x = A.pos.x + 3 * (B.pos.x - A.pos.x) / n; P3.pos.y = A.pos.y + 3 * (B.pos.y - A.pos.y) / n; }
  P4.active = 4 < n; if (P4.active) { P4.pos.x = A.pos.x + 4 * (B.pos.x - A.pos.x) / n; P4.pos.y = A.pos.y + 4 * (B.pos.y - A.pos.y) / n; }
  P5.active = 5 < n; if (P5.active) { P5.pos.x = A.pos.x + 5 * (B.pos.x - A.pos.x) / n; P5.pos.y = A.pos.y + 5 * (B.pos.y - A.pos.y) / n; }
  info = "Отрезок AB разделён на n = " + format(n, 0) + " равных частей. Каждая часть имеет длину " + format(ab.length / n, 2) + ".";
}
]
