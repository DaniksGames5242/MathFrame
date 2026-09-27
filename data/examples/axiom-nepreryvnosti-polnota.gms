[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Числовая прямая и четыре увеличения окрестности √2 (каждое в 10 раз). Зелёный — множество
// A = {x > 0 : x² < 2} (и все x ≤ 0); серые линии показывают, какой кусок увеличен. Точка U —
// кандидат в верхние грани A; оранжевая точка U′ = (U + 2/U)/2 — верхняя грань ещё меньше. ----
new Point { name = "L0"; pos = (-7, 3.6); dynamic = false; collision = false; active = false }
new Point { name = "R0"; pos = (7, 3.6); dynamic = false; collision = false; active = false }
new Line { name = "ln0"; pos = (L0, R0); thickness = 1.5; interact = false }
new Point { name = "A0"; pos = (0, 3.6); dynamic = false; collision = false; active = false }
new Line { name = "la0"; pos = (L0, A0); color = #22c55e; thickness = 5; interact = false; layer = 5 }
draw Text { name = "tl0"; pos = (-7, 3.15); text = edge(0, -1); size = 0.85; color = #6b7280; align = left }
draw Text { name = "tr0"; pos = (7, 3.15); text = edge(0, 1); size = 0.85; color = #6b7280; align = right }
new Point { name = "H0"; pos = (0, 3.6); dynamic = false; collision = false; size = 0.7; color = #ef4444; active = mode == "q" }
new Point { name = "K0"; pos = (0, 3.6); dynamic = false; collision = false; size = 0.7; color = #22c55e; active = mode == "r" }
new Point { name = "UP0"; pos = (99, 3.6); dynamic = false; collision = false; size = 0.6; color = #3b82f6 }
new Point { name = "NP0"; pos = (99, 3.6); dynamic = false; collision = false; size = 0.6; color = #f59e0b }
new Point { name = "Z0a"; pos = (0, 3.6); dynamic = false; collision = false; active = false }
new Point { name = "Z0b"; pos = (0, 3.6); dynamic = false; collision = false; active = false }
new Line { name = "za0"; pos = (Z0a, L1); color = #4b5563; thickness = 1; interact = false; layer = 1 }
new Line { name = "zb0"; pos = (Z0b, R1); color = #4b5563; thickness = 1; interact = false; layer = 1 }
new Point { name = "L1"; pos = (-7, 1.8); dynamic = false; collision = false; active = false }
new Point { name = "R1"; pos = (7, 1.8); dynamic = false; collision = false; active = false }
new Line { name = "ln1"; pos = (L1, R1); thickness = 1.5; interact = false }
new Point { name = "A1"; pos = (0, 1.8); dynamic = false; collision = false; active = false }
new Line { name = "la1"; pos = (L1, A1); color = #22c55e; thickness = 5; interact = false; layer = 5 }
draw Text { name = "tl1"; pos = (-7, 1.35); text = edge(1, -1); size = 0.85; color = #6b7280; align = left }
draw Text { name = "tr1"; pos = (7, 1.35); text = edge(1, 1); size = 0.85; color = #6b7280; align = right }
new Point { name = "H1"; pos = (0, 1.8); dynamic = false; collision = false; size = 0.7; color = #ef4444; active = mode == "q" }
new Point { name = "K1"; pos = (0, 1.8); dynamic = false; collision = false; size = 0.7; color = #22c55e; active = mode == "r" }
new Point { name = "UP1"; pos = (99, 1.8); dynamic = false; collision = false; size = 0.6; color = #3b82f6 }
new Point { name = "NP1"; pos = (99, 1.8); dynamic = false; collision = false; size = 0.6; color = #f59e0b }
new Point { name = "Z1a"; pos = (0, 1.8); dynamic = false; collision = false; active = false }
new Point { name = "Z1b"; pos = (0, 1.8); dynamic = false; collision = false; active = false }
new Line { name = "za1"; pos = (Z1a, L2); color = #4b5563; thickness = 1; interact = false; layer = 1 }
new Line { name = "zb1"; pos = (Z1b, R2); color = #4b5563; thickness = 1; interact = false; layer = 1 }
new Point { name = "L2"; pos = (-7, 0); dynamic = false; collision = false; active = false }
new Point { name = "R2"; pos = (7, 0); dynamic = false; collision = false; active = false }
new Line { name = "ln2"; pos = (L2, R2); thickness = 1.5; interact = false }
new Point { name = "A2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "la2"; pos = (L2, A2); color = #22c55e; thickness = 5; interact = false; layer = 5 }
draw Text { name = "tl2"; pos = (-7, -0.45); text = edge(2, -1); size = 0.85; color = #6b7280; align = left }
draw Text { name = "tr2"; pos = (7, -0.45); text = edge(2, 1); size = 0.85; color = #6b7280; align = right }
new Point { name = "H2"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #ef4444; active = mode == "q" }
new Point { name = "K2"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #22c55e; active = mode == "r" }
new Point { name = "UP2"; pos = (99, 0); dynamic = false; collision = false; size = 0.6; color = #3b82f6 }
new Point { name = "NP2"; pos = (99, 0); dynamic = false; collision = false; size = 0.6; color = #f59e0b }
new Point { name = "Z2a"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "Z2b"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "za2"; pos = (Z2a, L3); color = #4b5563; thickness = 1; interact = false; layer = 1 }
new Line { name = "zb2"; pos = (Z2b, R3); color = #4b5563; thickness = 1; interact = false; layer = 1 }
new Point { name = "L3"; pos = (-7, -1.8); dynamic = false; collision = false; active = false }
new Point { name = "R3"; pos = (7, -1.8); dynamic = false; collision = false; active = false }
new Line { name = "ln3"; pos = (L3, R3); thickness = 1.5; interact = false }
new Point { name = "A3"; pos = (0, -1.8); dynamic = false; collision = false; active = false }
new Line { name = "la3"; pos = (L3, A3); color = #22c55e; thickness = 5; interact = false; layer = 5 }
draw Text { name = "tl3"; pos = (-7, -2.25); text = edge(3, -1); size = 0.85; color = #6b7280; align = left }
draw Text { name = "tr3"; pos = (7, -2.25); text = edge(3, 1); size = 0.85; color = #6b7280; align = right }
new Point { name = "H3"; pos = (0, -1.8); dynamic = false; collision = false; size = 0.7; color = #ef4444; active = mode == "q" }
new Point { name = "K3"; pos = (0, -1.8); dynamic = false; collision = false; size = 0.7; color = #22c55e; active = mode == "r" }
new Point { name = "UP3"; pos = (99, -1.8); dynamic = false; collision = false; size = 0.6; color = #3b82f6 }
new Point { name = "NP3"; pos = (99, -1.8); dynamic = false; collision = false; size = 0.6; color = #f59e0b }
new Point { name = "Z3a"; pos = (0, -1.8); dynamic = false; collision = false; active = false }
new Point { name = "Z3b"; pos = (0, -1.8); dynamic = false; collision = false; active = false }
new Line { name = "za3"; pos = (Z3a, L4); color = #4b5563; thickness = 1; interact = false; layer = 1 }
new Line { name = "zb3"; pos = (Z3b, R4); color = #4b5563; thickness = 1; interact = false; layer = 1 }
new Point { name = "L4"; pos = (-7, -3.6); dynamic = false; collision = false; active = false }
new Point { name = "R4"; pos = (7, -3.6); dynamic = false; collision = false; active = false }
new Line { name = "ln4"; pos = (L4, R4); thickness = 1.5; interact = false }
new Point { name = "A4"; pos = (0, -3.6); dynamic = false; collision = false; active = false }
new Line { name = "la4"; pos = (L4, A4); color = #22c55e; thickness = 5; interact = false; layer = 5 }
draw Text { name = "tl4"; pos = (-7, -4.05); text = edge(4, -1); size = 0.85; color = #6b7280; align = left }
draw Text { name = "tr4"; pos = (7, -4.05); text = edge(4, 1); size = 0.85; color = #6b7280; align = right }
new Point { name = "H4"; pos = (0, -3.6); dynamic = false; collision = false; size = 0.7; color = #ef4444; active = mode == "q" }
new Point { name = "K4"; pos = (0, -3.6); dynamic = false; collision = false; size = 0.7; color = #22c55e; active = mode == "r" }
new Point { name = "UP4"; pos = (99, -3.6); dynamic = false; collision = false; size = 0.6; color = #3b82f6 }
new Point { name = "NP4"; pos = (99, -3.6); dynamic = false; collision = false; size = 0.6; color = #f59e0b }
draw Text { name = "tsq"; pos = (sx(0, sq), 4.15); text = "√2"; size = 1.1 }
new Point { name = "U"; line = "ln0"; t = 0.62; text = true("U"); pauseOnDrag = false; color = #3b82f6; layer = 60 }

new UI { name = "sM"; type = select; label = "числа"; variable = mode; options = ("q", "r"); labels = ("рациональные ℚ", "действительные ℝ"); default = "q" }

// ---- Логика ----
string mode = "q";
float sq = sqrt(2);
float u = 1.86; float un = 1.47;
string info = "";

Function w(j) { if (j == 0) { return 3; } return 3 / 10 ^ j; }
Function cen(j) { if (j == 0) { return 1.5; } return sq; }
// координата на экране для числа v в строке j
Function sx(j, v) { return -7 + 14 * (v - cen(j) + w(j) / 2) / w(j); }
Function edge(j, s) { return format(cen(j) + s * w(j) / 2, j + 1); }
Function put(P, j, v) { float x = sx(j, v); if (x < -7 || x > 7) { x = 99; } P.pos.x = x; return 0; }

Update {
  u = 3 * U.t; if (u < 0.05) { u = 0.05; }

  A0.pos.x = max(-7, min(7, sx(0, sq)));
  A1.pos.x = max(-7, min(7, sx(1, sq)));
  A2.pos.x = max(-7, min(7, sx(2, sq)));
  A3.pos.x = max(-7, min(7, sx(3, sq)));
  A4.pos.x = max(-7, min(7, sx(4, sq)));
  H0.pos.x = sx(0, sq); K0.pos.x = sx(0, sq);
  Z0a.pos.x = sx(0, sq - w(1) / 2); Z0b.pos.x = sx(0, sq + w(1) / 2);
  H1.pos.x = sx(1, sq); K1.pos.x = sx(1, sq);
  Z1a.pos.x = sx(1, sq - w(2) / 2); Z1b.pos.x = sx(1, sq + w(2) / 2);
  H2.pos.x = sx(2, sq); K2.pos.x = sx(2, sq);
  Z2a.pos.x = sx(2, sq - w(3) / 2); Z2b.pos.x = sx(2, sq + w(3) / 2);
  H3.pos.x = sx(3, sq); K3.pos.x = sx(3, sq);
  Z3a.pos.x = sx(3, sq - w(4) / 2); Z3b.pos.x = sx(3, sq + w(4) / 2);
  H4.pos.x = sx(4, sq); K4.pos.x = sx(4, sq);
  // U′ = (U + 2/U)/2 — ньютоновское приближение к √2: если U > √2, то √2 < U′ < U
  un = (u + 2 / u) / 2;
  put(UP0, 0, u); put(NP0, 0, un);
  put(UP1, 1, u); put(NP1, 1, un);
  put(UP2, 2, u); put(NP2, 2, un);
  put(UP3, 3, u); put(NP3, 3, un);
  put(UP4, 4, u); put(NP4, 4, un);

  info = "**Аксиома непрерывности (полноты):** всякое непустое ограниченное сверху множество действительных чисел имеет точную верхнюю грань sup — наименьшую из верхних граней. Именно она отличает ℝ от ℚ: на рациональной прямой есть «дыры».\n\nПример: A = {x : x ≤ 0 или x² < 2} ограничено сверху (например, числом 2). ";
  if (mode == "q") { info = info + "**В ℚ** у него нет наименьшей верхней грани: для любой рациональной верхней грани U число U′ = (U + 2/U)/2 тоже рационально, тоже верхняя грань и меньше U. Граница проходит через √2 — а его в ℚ нет (красная «дыра» на каждом увеличении)."; }
  else { info = info + "**В ℝ** sup A = √2 существует: верхние грани — ровно числа ≥ √2, и наименьшая из них — √2 (зелёная точка)."; }
  info = info + "\n\nU = " + format(u, 4) + ": U² = " + format(u * u, 4);
  if (u * u > 2) { info = info + " > 2 — верхняя грань A; U′ = " + format(un, 6) + " — меньшая верхняя грань (U′² = " + format(un * un, 6) + ")."; }
  else { info = info + " < 2 — не верхняя грань: в A есть числа больше U."; }
}
]
