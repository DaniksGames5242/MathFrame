[
description = "{info}"

field width = 8; field height = 8; field depth = 8;
show grid = false; show axes = false;
camera start rot = (30, 72);
camera start zoom = 1.15;

// ---- Сфера радиуса R (тонкая), описанный цилиндр (тонкий), сферический пояс между плоскостями y = w1 и y = w2 (синий)
// и полоса цилиндра между теми же плоскостями (жёлтая) ----
draw Surface { name = "sph"; type = parametric; x = "R * sin(pi * u) * cos(6.283185 * v)"; y = "R * cos(pi * u)"; z = "R * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; opacity = 0.08 }
draw Surface { name = "cyl"; type = parametric; x = "R * cos(6.283185 * v)"; y = "-R + 2 * R * u"; z = "R * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; opacity = 0.06 }
draw Surface { name = "zone"; type = parametric; x = "sqrt(R * R - (w1 + (w2 - w1) * u) ^ 2) * cos(6.283185 * v)"; y = "w1 + (w2 - w1) * u"; z = "sqrt(R * R - (w1 + (w2 - w1) * u) ^ 2) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #3b82f6; opacity = 0.6 }
draw Surface { name = "band"; type = parametric; x = "R * cos(6.283185 * v)"; y = "w1 + (w2 - w1) * u"; z = "R * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #f59e0b; opacity = 0.35 }
new Curve3D { name = "c1"; type = parametric; x = "sqrt(R * R - w1 * w1) * cos(6.283185 * t)"; y = "w1"; z = "sqrt(R * R - w1 * w1) * sin(6.283185 * t)"; segments = 90; color = #3b82f6; thickness = 3 }
new Curve3D { name = "c2"; type = parametric; x = "sqrt(R * R - w2 * w2) * cos(6.283185 * t)"; y = "w2"; z = "sqrt(R * R - w2 * w2) * sin(6.283185 * t)"; segments = 90; color = #3b82f6; thickness = 3 }

new UI { name = "sR"; type = slider; label = "радиус R"; variable = R; min = 1.5; max = 3; step = 0.1; default = 2.5 }
new UI { name = "sT"; type = slider; label = "высота пояса h / R"; variable = th; min = 0.1; max = 2; step = 0.05; default = 0.6 }
new UI { name = "sS"; type = slider; label = "положение пояса"; variable = sp; min = 0; max = 1; step = 0.01; default = 0.6 }

// ---- Логика ----
float R = 2.5; float th = 0.6; float sp = 0.6; float w1 = 0; float w2 = 1.5;
string info = "";

Update {
  float h = th * R;
  w1 = -R + sp * (2 * R - h); w2 = w1 + h;
  if (w1 < -R + 0.0001) { w1 = -R + 0.0001; }
  if (w2 > R - 0.0001) { w2 = R - 0.0001; }
  float sz = 2 * pi * R * h;
  float ss = 4 * pi * R * R;
  info = "**Площадь сферы** радиуса R: S = 4πR² = " + format(ss, 2) + " при R = " + format(R, 1) + ". Это в четыре раза больше площади большого круга πR² = " + format(pi * R * R, 2) + " и равно площади боковой поверхности описанного цилиндра (высота 2R, радиус основания R): 2πR · 2R.\n\n";
  info = info + "Сферический пояс между двумя параллельными плоскостями на расстоянии h = " + format(h, 2) + " друг от друга (синий): S = 2πRh = " + format(sz, 2) + ". Столько же занимает полоса цилиндра между теми же плоскостями (жёлтая) — её развёртка есть прямоугольник 2πR × h. Пояс составляет " + format(100 * h / (2 * R), 0) + "% всей сферы.\n\n";
  info = info + "Сдвигая пояс вдоль оси, площадь не меняется: она зависит только от высоты h и радиуса R.";
}
]
