[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Три числовые прямые: сверху a, b, c (точки перетаскиваются), в середине — те же числа после
// прибавления m, внизу — после умножения на k. Порядок точек на прямой и есть знак неравенства. ----
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
new Point { name = "P1"; pos = (-3.5, 3.4); dynamic = false; collision = false; active = false }
new Point { name = "P2"; pos = (3.5, 3.4); dynamic = false; collision = false; active = false }
new Line { name = "L1"; pos = (P1, P2); color = "transparent"; interact = false }
new Point { name = "A"; line = "L1"; t = 0.3; text = true("a"); color = #3b82f6; collideWithPoints = false }
new Point { name = "B"; line = "L1"; t = 0.6; text = true("b"); color = #f59e0b; collideWithPoints = false }
new Point { name = "C"; line = "L1"; t = 0.85; text = true("c"); color = #22c55e; collideWithPoints = false }
new Point { name = "A2"; pos = (0, 0.4); dynamic = false; collision = false; text = true("a + m"); color = #3b82f6 }
new Point { name = "B2"; pos = (0, 0.4); dynamic = false; collision = false; text = true("b + m"); color = #f59e0b }
new Point { name = "C2"; pos = (0, 0.4); dynamic = false; collision = false; text = true("c + m"); color = #22c55e }
new Point { name = "A3"; pos = (0, -2.6); dynamic = false; collision = false; text = true("ka"); color = #3b82f6 }
new Point { name = "B3"; pos = (0, -2.6); dynamic = false; collision = false; text = true("kb"); color = #f59e0b }
new Point { name = "C3"; pos = (0, -2.6); dynamic = false; collision = false; text = true("kc"); color = #22c55e }
draw Text { name = "q1"; pos = (-7.8, 4.6); text = rel(a, b, "a", "b") + ",  " + rel(b, cc, "b", "c"); size = 1.1; align = left }
draw Text { name = "q2"; pos = (-7.8, 1.6); text = rel(a + m, b + m, "a + m", "b + m") + ",  " + rel(b + m, cc + m, "b + m", "c + m"); size = 1.1; align = left }
draw Text { name = "q3"; pos = (-7.8, -1.4); text = rel(k * a, k * b, "ka", "kb") + ",  " + rel(k * b, k * cc, "kb", "kc"); size = 1.1; align = left }

new UI { name = "sM"; type = slider; label = "m"; variable = m; min = -4; max = 4; step = 0.5; default = 1.5 }
new UI { name = "sK"; type = slider; label = "k"; variable = k; min = -2; max = 2; step = 0.5; default = -1 }

// ---- Логика ----
float m = 1.5; float k = -1; float init = 0;
float a = 0; float b = 0; float cc = 0;
string info = "";

Function num(q) { if (q < -0.04) { return "−" + format(-q, 1); } if (q < 0.04) { return "0"; } return format(q, 1); }
Function sg(x, y) { if (x < y - 0.001) { return "<"; } if (x > y + 0.001) { return ">"; } return "="; }
Function rel(x, y, sx, sy) { return sx + " " + sg(x, y) + " " + sy; }
Function nz(q) { return round(10 * q) / 10; }

Update {
  if (init == 0) {
    init = 1; gx = newGraph();
    addNode(gx, "a1", [-7.8, 3.4]); addNode(gx, "a2", [7.8, 3.4]); addEdge(gx, "a1", "a2");
    addNode(gx, "b1", [-7.8, 0.4]); addNode(gx, "b2", [7.8, 0.4]); addEdge(gx, "b1", "b2");
    addNode(gx, "c1", [-7.8, -2.6]); addNode(gx, "c2", [7.8, -2.6]); addEdge(gx, "c1", "c2");
    addNode(gx, "z1", [0, 3.15]); addNode(gx, "z2", [0, 3.65]); addEdge(gx, "z1", "z2");
    addNode(gx, "y1", [0, 0.15]); addNode(gx, "y2", [0, 0.65]); addEdge(gx, "y1", "y2");
    addNode(gx, "x1", [0, -2.85]); addNode(gx, "x2", [0, -2.35]); addEdge(gx, "x1", "x2");
  }
  a = nz(A.pos.x); b = nz(B.pos.x); cc = nz(C.pos.x);
  A2.pos.x = a + m; B2.pos.x = b + m; C2.pos.x = cc + m; A2.pos.y = 0.4; B2.pos.y = 0.4; C2.pos.y = 0.4;
  A3.pos.x = k * a; B3.pos.x = k * b; C3.pos.x = k * cc; A3.pos.y = -2.6; B3.pos.y = -2.6; C3.pos.y = -2.6;
  string ms = num(m); if (m < 0) { ms = "(" + ms + ")"; }
  string ks = num(k); if (k < 0) { ks = "(" + ks + ")"; }
  info = "**Неравенство** сравнивает числа: «<» и «>» — строгие знаки, «≤» и «≥» допускают равенство. Здесь a = " + num(a) + ", b = " + num(b) + ", c = " + num(cc) + ": " + rel(a, b, "a", "b") + ", " + rel(b, cc, "b", "c") + ".";
  if ((a <= b && b <= cc) || (a >= b && b >= cc)) { info = info + " **Транзитивность:** из " + rel(a, b, "a", "b") + " и " + rel(b, cc, "b", "c") + " следует " + rel(a, cc, "a", "c") + "."; }
  info = info + "\n\n**Сложение.** Прибавим к обеим частям m = " + num(m) + ": " + rel(a + m, b + m, "a + " + ms, "b + " + ms) + " — знак сохраняется, потому что все точки сдвигаются вместе.";
  if (k > 0) { info = info + "\n\n**Умножение на k = " + num(k) + " > 0:** растяжение прямой, знак сохраняется: " + rel(k * a, k * b, "a·" + ks, "b·" + ks) + "."; }
  if (k < 0) { info = info + "\n\n**Умножение на k = " + num(k) + " < 0:** прямая отражается, порядок меняется на противоположный: " + rel(k * a, k * b, "a·" + ks, "b·" + ks) + "."; }
  if (k == 0) { info = info + "\n\n**Умножение на k = 0:** все точки уходят в 0, и любое неравенство превращается в равенство 0 = 0."; }
}
]
