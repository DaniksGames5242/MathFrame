[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Многоугольник с перетаскиваемыми вершинами и пунктирная окружность того же периметра
// (с центром в центре тяжести вершин). Справа — «коэффициент округлости» Q = 4πS/L² ≤ 1. ----
new Point { name = "P0"; pos = (-2.00, 2.60); pauseOnDrag = false; size = 0.8; layer = 60 }
new Point { name = "P1"; pos = (-3.84, 1.84); pauseOnDrag = false; size = 0.8; layer = 60 }
new Point { name = "P2"; pos = (-4.60, 0.00); pauseOnDrag = false; size = 0.8; layer = 60 }
new Point { name = "P3"; pos = (-3.84, -1.84); pauseOnDrag = false; size = 0.8; layer = 60 }
new Point { name = "P4"; pos = (-2.00, -2.60); pauseOnDrag = false; size = 0.8; layer = 60 }
new Point { name = "P5"; pos = (-0.16, -1.84); pauseOnDrag = false; size = 0.8; layer = 60 }
new Point { name = "P6"; pos = (0.60, -0.00); pauseOnDrag = false; size = 0.8; layer = 60 }
new Point { name = "P7"; pos = (-0.16, 1.84); pauseOnDrag = false; size = 0.8; layer = 60 }
new Line { name = "e0"; pos = (P0, P1); color = #3b82f6; thickness = 3 }
new Line { name = "e1"; pos = (P1, P2); color = #3b82f6; thickness = 3 }
new Line { name = "e2"; pos = (P2, P3); color = #3b82f6; thickness = 3 }
new Line { name = "e3"; pos = (P3, P4); color = #3b82f6; thickness = 3 }
new Line { name = "e4"; pos = (P4, P5); color = #3b82f6; thickness = 3 }
new Line { name = "e5"; pos = (P5, P6); color = #3b82f6; thickness = 3 }
new Line { name = "e6"; pos = (P6, P7); color = #3b82f6; thickness = 3 }
new Line { name = "e7"; pos = (P7, P0); color = #3b82f6; thickness = 3 }
new Figure { name = "poly"; elements = (e0, e1, e2, e3, e4, e5, e6, e7) }
draw Filling { name = "pf"; figure = "poly"; color = #3b82f6; opacity = 0.25 }
new Point { name = "G"; pos = (-2, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "GR"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "cc"; center = G; radius = GR; color = #f59e0b; thickness = 2 }
draw Graph { name = "gBar"; graph = "gb"; edgeWidth = 22; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
new Point { name = "M1"; pos = (5.6, 3.3); dynamic = false; collision = false; active = false }
new Point { name = "M2"; pos = (6.8, 3.3); dynamic = false; collision = false; active = false }
new Line { name = "mk"; pos = (M1, M2); color = #f59e0b; thickness = 3; interact = false; layer = 12 }
draw Text { name = "tq"; pos = (6.2, 3.9); text = "Q = " + format(Q, 3); size = 1.2 }
draw Text { name = "t1"; pos = (6.9, 3.3); text = "1"; size = 0.9; color = #6b7280; align = left }

new UI { name = "sS"; type = select; label = "форма"; variable = shape; options = ("reg", "sq", "tri", "star", "thin"); labels = ("правильный 8-угольник", "квадрат", "треугольник", "звезда", "вытянутый"); default = "reg" }

// ---- Логика ----
string shape = "reg"; string lastShape = "";
float Q = 1; float A = 0; float Lp = 0;
string info = "";

Function setP(P, x, y) { P.pos.x = x; P.pos.y = y; return 0; }

Update {
  if (shape != lastShape) {
    if (shape == "reg") { setP(P0, -2.00, 2.60); setP(P1, -3.84, 1.84); setP(P2, -4.60, 0.00); setP(P3, -3.84, -1.84); setP(P4, -2.00, -2.60); setP(P5, -0.16, -1.84); setP(P6, 0.60, -0.00); setP(P7, -0.16, 1.84); }
    if (shape == "sq") { setP(P0, -4.30, 2.30); setP(P1, -2.00, 2.30); setP(P2, 0.30, 2.30); setP(P3, 0.30, 0.00); setP(P4, 0.30, -2.30); setP(P5, -2.00, -2.30); setP(P6, -4.30, -2.30); setP(P7, -4.30, 0.00); }
    if (shape == "tri") { setP(P0, -2.00, 3.20); setP(P1, -0.93, 1.33); setP(P2, 0.13, -0.53); setP(P3, 1.20, -2.40); setP(P4, -2.00, -2.40); setP(P5, -5.20, -2.40); setP(P6, -4.13, -0.53); setP(P7, -3.07, 1.33); }
    if (shape == "star") { setP(P0, -2.00, 3.40); setP(P1, -2.85, 0.85); setP(P2, -5.40, 0.00); setP(P3, -2.85, -0.85); setP(P4, -2.00, -3.40); setP(P5, -1.15, -0.85); setP(P6, 1.40, -0.00); setP(P7, -1.15, 0.85); }
    if (shape == "thin") { setP(P0, -6.50, 0.60); setP(P1, -4.00, 0.90); setP(P2, -1.50, 0.90); setP(P3, 1.00, 0.90); setP(P4, 2.50, -0.20); setP(P5, 1.00, -0.90); setP(P6, -1.50, -0.90); setP(P7, -4.00, -0.90); }
    lastShape = shape;
  }
  // Площадь (формула шнурования) и периметр
  A = 0; Lp = 0; float gx = 0; float gy = 0;
  A = A + P0.pos.x * P1.pos.y - P1.pos.x * P0.pos.y; Lp = Lp + sqrt((P1.pos.x - P0.pos.x) ^ 2 + (P1.pos.y - P0.pos.y) ^ 2); gx = gx + P0.pos.x; gy = gy + P0.pos.y;
  A = A + P1.pos.x * P2.pos.y - P2.pos.x * P1.pos.y; Lp = Lp + sqrt((P2.pos.x - P1.pos.x) ^ 2 + (P2.pos.y - P1.pos.y) ^ 2); gx = gx + P1.pos.x; gy = gy + P1.pos.y;
  A = A + P2.pos.x * P3.pos.y - P3.pos.x * P2.pos.y; Lp = Lp + sqrt((P3.pos.x - P2.pos.x) ^ 2 + (P3.pos.y - P2.pos.y) ^ 2); gx = gx + P2.pos.x; gy = gy + P2.pos.y;
  A = A + P3.pos.x * P4.pos.y - P4.pos.x * P3.pos.y; Lp = Lp + sqrt((P4.pos.x - P3.pos.x) ^ 2 + (P4.pos.y - P3.pos.y) ^ 2); gx = gx + P3.pos.x; gy = gy + P3.pos.y;
  A = A + P4.pos.x * P5.pos.y - P5.pos.x * P4.pos.y; Lp = Lp + sqrt((P5.pos.x - P4.pos.x) ^ 2 + (P5.pos.y - P4.pos.y) ^ 2); gx = gx + P4.pos.x; gy = gy + P4.pos.y;
  A = A + P5.pos.x * P6.pos.y - P6.pos.x * P5.pos.y; Lp = Lp + sqrt((P6.pos.x - P5.pos.x) ^ 2 + (P6.pos.y - P5.pos.y) ^ 2); gx = gx + P5.pos.x; gy = gy + P5.pos.y;
  A = A + P6.pos.x * P7.pos.y - P7.pos.x * P6.pos.y; Lp = Lp + sqrt((P7.pos.x - P6.pos.x) ^ 2 + (P7.pos.y - P6.pos.y) ^ 2); gx = gx + P6.pos.x; gy = gy + P6.pos.y;
  A = A + P7.pos.x * P0.pos.y - P0.pos.x * P7.pos.y; Lp = Lp + sqrt((P0.pos.x - P7.pos.x) ^ 2 + (P0.pos.y - P7.pos.y) ^ 2); gx = gx + P7.pos.x; gy = gy + P7.pos.y;
  A = abs(A) / 2;
  Q = 4 * pi * A / (Lp * Lp);
  G.pos.x = gx / 8; G.pos.y = gy / 8; GR.pos.x = G.pos.x + Lp / (2 * pi); GR.pos.y = G.pos.y;
  gb = newGraph();
  addNode(gb, "a", [6.2, -3.8]); addNode(gb, "b", [6.2, -3.8 + 7.1 * Q]); addEdge(gb, "a", "b", 1, "#3b82f6");
  float Ac = Lp * Lp / (4 * pi);
  info = "**Изопериметрическое неравенство:** для любой плоской фигуры с периметром L и площадью S выполняется 4πS ≤ L², причём равенство — только для круга. Иначе: из всех фигур данного периметра наибольшую площадь ограничивает круг. Отношение Q = 4πS/L² показывает, насколько фигура «кругла»: Q = 1 у круга, у остальных меньше.\n\nL = " + format(Lp, 2) + ", S = " + format(A, 2) + ";  у круга того же периметра (оранжевый) S = L²/4π = " + format(Ac, 2) + ".  Q = " + format(Q, 3) + ".";
  if (shape == "reg") { info = info + " У правильного n-угольника Q = π/(n·tg(π/n)) — для n = 8 это 0.948; с ростом n он приближается к кругу."; }
  info = info + "\n\nВершины и стороны многоугольника перетаскиваются, фигура целиком — за внутренность: как ни старайтесь, Q не превысит 1.";
}
]
