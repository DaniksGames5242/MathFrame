[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float d = 1.5; float x0 = 2; string info = "";
Function f(x) { if (x < 0) { return x * x; } return x * x + d; }
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8; grid = true; color = #3b82f6; thickness = 3 }
new Point { name = "R1"; pos = (2, 4); dynamic = false; collision = false; color = #f59e0b; active = true }
new UI { type = slider; label = "точка x₀"; variable = x0; min = -8; max = 8; step = 0.1; default = 2 }
new UI { type = slider; label = "величина скачка d"; variable = d; min = 0; max = 3; step = 0.1; default = 1.5 }
Function num(x, d2) { if (x < 0) { return "−" + format(-x, d2); } return format(x, d2); }
Update {
  R1.pos.x = x0; R1.pos.y = f(x0);
  if (abs(x0) > 0.05) { info = "**Непрерывность в точке**: предел функции при x → x₀ = " + num(x0, 1) + " равен значению f(x₀) = " + num(f(x0), 2) + " — предел совпадает со значением, поэтому f непрерывна в этой точке."; }
  if (abs(x0) <= 0.05 && d > 0.05) { info = "В точке x₀ = 0 левый предел равен 0, а правый равен " + num(d, 2) + " — они не совпадают, поэтому f **разрывна** в этой точке (при d = 0 разрыва не было бы)."; }
  if (abs(x0) <= 0.05 && d <= 0.05) { info = "При x₀ = 0 и d = " + num(d, 2) + " левый и правый пределы совпадают: f непрерывна и в этой точке."; }
}
]
