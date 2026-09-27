[
description = "{info}"
field width = 14; field height = 10;
camera type = fixed;
float t = 80; string info = "";
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "A"; pos = (4.5, 0); dynamic = false; collision = false; text = true("A") }
new Point { name = "B"; pos = (4.5, 0); dynamic = false; collision = false; text = true("B") }
new Point { name = "C"; pos = (4.5, 0); dynamic = false; collision = false; active = false }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Line { name = "oc"; pos = (O, C); color = #f59e0b }
new Point { name = "P"; pos = (3, 1); text = true("P"); collideWithPoints = false }
new UI { type = slider; label = "угол AOB"; variable = t; min = 10; max = 350; step = 1; default = 80 }
Update {
  float rad = t * pi / 180; B.pos.x = 4.5 * cos(rad); B.pos.y = 4.5 * sin(rad);
  C.pos.x = 4.5 * cos(rad / 2); C.pos.y = 4.5 * sin(rad / 2);
  float da = abs(P.pos.y);
  float db = abs((B.pos.x * P.pos.y - B.pos.y * P.pos.x) / 4.5);
  string rel = "P не равноудалена от сторон — не лежит на биссектрисе"; if (abs(da - db) < 0.15) { rel = "P равноудалена от OA и OB — лежит на биссектрисе (оранжевый луч)"; }
  info = "**Биссектриса угла AOB** (оранжевый луч) — множество точек, равноудалённых от его сторон.\n\nРасстояние до OA = " + format(da, 2) + ", до OB = " + format(db, 2) + ": " + rel + ".";
}
]
