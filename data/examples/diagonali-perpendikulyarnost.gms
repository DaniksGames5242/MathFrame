[
description = "{info}"
field width = 16; field height = 12;
camera type = fixed;
float p = 5; float q = 3; string info = "";
new Point { name = "A"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "B"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "D"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "rh"; elements = (ab, bc, cd, da) }
new Line { name = "ac"; pos = (A, C); color = #3b82f6 }
new Line { name = "bd"; pos = (B, D); color = #f59e0b }
new UI { type = slider; label = "полудиагональ p"; variable = p; min = 1; max = 7; step = 0.2; default = 5 }
new UI { type = slider; label = "полудиагональ q"; variable = q; min = 1; max = 5; step = 0.2; default = 3 }
Update {
  A.pos.x = 0; A.pos.y = -q; B.pos.x = p; B.pos.y = 0;
  C.pos.x = 0; C.pos.y = q; D.pos.x = -p; D.pos.y = 0;
  float vax = C.pos.x - A.pos.x; float vay = C.pos.y - A.pos.y;
  float vbx = D.pos.x - B.pos.x; float vby = D.pos.y - B.pos.y;
  float ang = acos((vax * vbx + vay * vby) / (ac.length * bd.length)) * 57.2958;
  info = "**Диагонали ромба ABCD** AC (синяя) и BD (оранжевая) пересекаются под прямым углом: " + format(ang, 0) + "°.\n\nЭто следует из симметрии ромба: каждая диагональ — ось симметрии, делящая противоположные углы пополам.";
}
]
