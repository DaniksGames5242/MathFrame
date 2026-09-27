[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
float w = 3; float t1 = 4; float t2 = 5; string info = "";
show axes = true; show grid = true;
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; color = #f59e0b }
new UI { type = slider; label = "целая часть"; variable = w; min = 0; max = 9; step = 1; default = 3 }
new UI { type = slider; label = "десятые"; variable = t1; min = 0; max = 9; step = 1; default = 4 }
new UI { type = slider; label = "сотые"; variable = t2; min = 0; max = 9; step = 1; default = 5 }
Update {
  float v = w + t1 / 10 + t2 / 100;
  P.pos.x = v; P.pos.y = 0;
  info = "**Десятичная дробь** " + format(w, 0) + "," + format(t1, 0) + format(t2, 0) + " = " + format(w, 0) + " + " + format(t1, 0) + "/10 + " + format(t2, 0) + "/100 = " + format(v, 2) + ".\n\nКаждая цифра после запятой — доля единицы: первая — десятые, вторая — сотые.";
}
]
