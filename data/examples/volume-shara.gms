[
description = "{info}"

field width = 14; field height = 6; field depth = 6;
show grid = false; show axes = false;
camera start rot = (20, 74);
camera start zoom = 1.9;

// ---- Слева — полушар радиуса R, справа — цилиндр (радиус R, высота R) с выточенным конусом (вершина в центре нижнего основания) ----
draw Surface { name = "hemi"; type = parametric; x = "-3.3 + R * sin(1.570796 * u) * cos(6.283185 * v)"; y = "-1.5 + R * cos(1.570796 * u)"; z = "R * sin(1.570796 * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #3b82f6; opacity = 0.4 }
draw Surface { name = "hbase"; type = parametric; x = "-3.3 + R * u * cos(6.283185 * v)"; y = "-1.5"; z = "R * u * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 16; color = #3b82f6; opacity = 0.2 }
draw Surface { name = "cyl"; type = parametric; x = "3.3 + R * cos(6.283185 * v)"; y = "-1.5 + R * u"; z = "R * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; opacity = 0.1 }
draw Surface { name = "cone"; type = parametric; x = "3.3 + R * u * cos(6.283185 * v)"; y = "-1.5 + R * u"; z = "R * u * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; color = #22c55e; opacity = 0.25 }

// ---- Сечения на высоте t от основания: круг полушара и кольцо «цилиндр минус конус» ----
draw Surface { name = "sdisk"; type = parametric; x = "-3.3 + sqrt(R * R - t * t) * u * cos(6.283185 * v)"; y = "-1.5 + t"; z = "sqrt(R * R - t * t) * u * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 16; color = #f59e0b; opacity = 0.7 }
draw Surface { name = "ring"; type = parametric; x = "3.3 + (t + (R - t) * u) * cos(6.283185 * v)"; y = "-1.5 + t"; z = "(t + (R - t) * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 16; color = #f59e0b; opacity = 0.7 }

new UI { name = "sR"; type = slider; label = "радиус R"; variable = R; min = 1.5; max = 2.6; step = 0.1; default = 2.2 }
new UI { name = "sQ"; type = slider; label = "высота сечения t / R"; variable = q; min = 0; max = 0.99; step = 0.01; default = 0.5 }

// ---- Логика ----
float R = 2.2; float q = 0.5; float t = 1.1;
string info = "";

Update {
  t = q * R;
  float a1 = pi * (R * R - t * t);
  float a2 = pi * R * R - pi * t * t;
  info = "**Объём шара** радиуса R: V = ⅔πR³ · 2 = ⁴⁄₃πR³ = " + format(4 * pi * R * R * R / 3, 2) + " при R = " + format(R, 1) + ". Он же равен ⅓ S · R, где S = 4πR² — площадь сферы (шар — сумма «пирамид» с вершиной в центре).\n\n";
  info = info + "Метод сечений: на высоте t = " + format(t, 2) + " от плоскости большого круга сечение полушара — круг радиуса √(R² − t²) и площади π(R² − t²) = " + format(a1, 2) + " (жёлтый круг слева).\n\n";
  info = info + "Цилиндр с радиусом R и высотой R, из которого удалён конус (зелёный), на той же высоте даёт кольцо между радиусами t и R площади πR² − πt² = " + format(a2, 2) + " (справа) — такое же. По принципу Кавальери объёмы равны: ⅔πR³ = πR³ − ⅓πR³ = " + format(2 * pi * R * R * R / 3, 2) + ".";
}
]
