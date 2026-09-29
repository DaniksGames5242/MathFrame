[
description = "{info}"

field width = 15; field height = 7; field depth = 7;
show grid = false; show axes = false;
camera start rot = (0, 78);
camera start zoom = 2.0;

// ---- Конус: боковая поверхность (синяя) и основание (жёлтое); основание конуса на y = −2 ----
draw Surface { name = "lat"; type = parametric; x = "-4.6 + r * (1 - u) * cos(6.283185 * v)"; y = "-1.5 + h * u"; z = "r * (1 - u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #3b82f6; opacity = 0.6 }
draw Surface { name = "bas"; type = parametric; x = "-4.6 + r * u * cos(6.283185 * v)"; y = "-1.5"; z = "r * u * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #f59e0b; opacity = 0.6 }
new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S") }
new Point3D { name = "O"; pos = (-4.6, -1.5, 0); dynamic = false; collision = false; text = true("O") }
new Point3D { name = "B"; pos = (0, -1.5, 0); dynamic = false; collision = false; text = true("B") }
new Line3D { name = "hh"; pos = (S, O); interact = false; thickness = 2 }
new Line3D { name = "ll"; pos = (S, B); interact = false; thickness = 3; color = #22c55e }
new Line3D { name = "rr"; pos = (O, B); interact = false; thickness = 2 }

// ---- Развёртка: круговой сектор радиуса l (боковая поверхность) и круг радиуса r (основание) ----
draw Surface { name = "sec"; type = parametric; x = "0.3 + l * u * sin(phi * (v - 0.5))"; y = "-l * u * cos(phi * (v - 0.5))"; z = "0"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #3b82f6; opacity = 0.6 }
draw Surface { name = "disk"; type = parametric; x = "5.4 + r * u * cos(6.283185 * v)"; y = "r * u * sin(6.283185 * v)"; z = "0"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #f59e0b; opacity = 0.6 }

new UI { name = "sR"; type = slider; label = "радиус r"; variable = r; min = 0.8; max = 1.6; step = 0.05; default = 1.3 }
new UI { name = "sH"; type = slider; label = "высота h"; variable = h; min = 1; max = 2.5; step = 0.05; default = 2 }

// ---- Логика ----
float r = 1.3; float h = 2; float l = 2.9; float phi = 3.2;
string info = "";

Update {
  l = sqrt(r * r + h * h);
  phi = 2 * pi * r / l;
  S.pos.x = -4.6; S.pos.y = -1.5 + h; S.pos.z = 0;
  B.pos.x = -4.6 + r; B.pos.y = -1.5; B.pos.z = 0;
  float sb = pi * r * l; float so = pi * r * r;
  info = "**Площадь полной поверхности конуса** — сумма площади боковой поверхности и площади основания: S = S_бок + S_осн = πrl + πr².\n\n";
  info = info + "r = " + format(r, 2) + ", h = " + format(h, 2) + ", образующая l = √(r² + h²) = " + format(l, 2) + ":   S_бок = " + format(sb, 2) + ",  S_осн = " + format(so, 2) + ",  S = " + format(sb + so, 2) + " = πr(l + r).\n\n";
  info = info + "Развёртка: боковая поверхность — круговой сектор радиуса l (синий) с дугой длиной 2πr = " + format(2 * pi * r, 2) + ", то есть с углом " + format(phi * 180 / pi, 1) + "°; его площадь ½ · l · 2πr = πrl. Основание — круг радиуса r (жёлтый).";
}
]
