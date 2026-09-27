[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
float t1 = 0.4; float t2 = 0.55; string info = "";
new Point { name = "A"; pos = (-1, 4) }
new Point { name = "B"; pos = (-6, -4) }
new Point { name = "C"; pos = (6, -4) }
new Point { name = "A1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "B1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "C1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Line { name = "aa1"; pos = (A, A1); color = #3b82f6 }
new Line { name = "bb1"; pos = (B, B1); color = #3b82f6 }
new Line { name = "cc1"; pos = (C, C1); color = #3b82f6 }
new Figure { name = "t"; elements = (ab, bc, ca) }
new UI { type = slider; label = "точка A′ на BC"; variable = t1; min = 0.1; max = 0.9; step = 0.02; default = 0.4 }
new UI { type = slider; label = "точка B′ на CA"; variable = t2; min = 0.1; max = 0.9; step = 0.02; default = 0.55 }
Update {
  A1.pos.x = B.pos.x + t1 * (C.pos.x - B.pos.x); A1.pos.y = B.pos.y + t1 * (C.pos.y - B.pos.y);
  B1.pos.x = C.pos.x + t2 * (A.pos.x - C.pos.x); B1.pos.y = C.pos.y + t2 * (A.pos.y - C.pos.y);
  float k = (t1 * t2) / ((1 - t1) * (1 - t2));
  float t3 = k / (1 + k);
  C1.pos.x = B.pos.x + t3 * (A.pos.x - B.pos.x); C1.pos.y = B.pos.y + t3 * (A.pos.y - B.pos.y);
  info = "Точка C′ на AB подобрана так, чтобы (AB′/B′C)·(CA′/A′B)·(BC′/C′A) = 1 — при любых A′ и B′. По теореме Чевы это равносильно тому, что чевианы AA′, BB′ и CC′ пересекаются в одной точке, что видно на чертеже при любом положении вершин и точек A′, B′.";
}
]
