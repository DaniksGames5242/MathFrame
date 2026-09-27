[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float k = 1.2; string info = "";
Function f(x) { if (x < 0) { return x - k; } return x + k; }
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (0, -1.2); dynamic = false; collision = false; color = #f59e0b; active = true }
new Point { name = "R2"; pos = (0, 1.2); dynamic = false; collision = false; color = #22c55e; active = true }
new UI { type = slider; label = "величина скачка k"; variable = k; min = 0; max = 3; step = 0.1; default = 1.2 }
Update {
  R1.pos.x = 0; R1.pos.y = -k; R2.pos.x = 0; R2.pos.y = k;
  if (k > 0.05) { info = "**Разрыв первого рода**: в точке x = 0 существуют оба односторонних предела — левый равен −" + format(k, 2) + " (оранжевая точка), правый равен " + format(k, 2) + " (зелёная), но они не равны — это скачок."; }
  if (k <= 0.05) { info = "При k = 0 оба предела совпадают: скачка нет, функция непрерывна."; }
}
]
