[
description = "{info}"

field width = 8; field height = 8; field depth = 8;
show grid = false; show axes = false;
camera start rot = (20, 70);
camera start zoom = 1.0;

// ---- Усечённый конус: нижнее основание радиуса R (y = −3), верхнее радиуса r, высота h ----
draw Surface { name = "side"; type = parametric; x = "(R + (r - R) * u) * cos(6.283185 * v)"; y = "-3 + h * u"; z = "(R + (r - R) * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 30; color = #3b82f6; opacity = 0.55 }
draw Surface { name = "bot"; type = parametric; x = "R * u * cos(6.283185 * v)"; y = "-3"; z = "R * u * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #3b82f6; opacity = 0.35 }
draw Surface { name = "top"; type = parametric; x = "r * u * cos(6.283185 * v)"; y = "-3 + h"; z = "r * u * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 20; color = #3b82f6; opacity = 0.35 }
// Отсечённая верхняя часть — малый конус с общей вершиной (тонкий), пока вершина внутри поля
draw Surface { name = "small"; type = parametric; x = "r * (1 - u) * cos(6.283185 * v)"; y = "-3 + h + (hh - h) * u"; z = "r * (1 - u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 24; opacity = 0.12; active = showApex > 0.5 }
new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("S"); active = showApex > 0.5 }
new Point3D { name = "E1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "E2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "g1"; pos = (E1, S); interact = false; thickness = 2; active = showApex > 0.5 }
new Line3D { name = "g2"; pos = (E2, S); interact = false; thickness = 2; active = showApex > 0.5 }
new Curve3D { name = "sec"; type = parametric; x = "rq * cos(6.283185 * t)"; y = "-3 + q * h"; z = "rq * sin(6.283185 * t)"; segments = 90; color = #f59e0b; thickness = 4 }

new UI { name = "sR"; type = slider; label = "радиус R"; variable = R; min = 1.5; max = 3; step = 0.1; default = 2.4 }
new UI { name = "sK"; type = slider; label = "r / R"; variable = k; min = 0; max = 1; step = 0.05; default = 0.5 }
new UI { name = "sH"; type = slider; label = "высота h"; variable = h; min = 1.5; max = 4; step = 0.1; default = 3 }
new UI { name = "sQ"; type = slider; label = "сечение на высоте x / h"; variable = q; min = 0; max = 1; step = 0.01; default = 0.4 }

// ---- Логика ----
float R = 2.4; float k = 0.5; float h = 3; float q = 0.4;
float r = 1.2; float hh = 6; float rq = 1.9; float showApex = 1;
string info = "";

Update {
  r = k * R;
  rq = R + (r - R) * q;
  showApex = 0; hh = 6;
  if (k < 0.99) {
    hh = R * h / (R - r);
    if (hh < 6.3) { showApex = 1; }
    S.pos.x = 0; S.pos.y = -3 + hh; S.pos.z = 0;
    E1.pos.x = R; E1.pos.y = -3; E1.pos.z = 0;
    E2.pos.x = -R; E2.pos.y = -3; E2.pos.z = 0;
  }
  float v = pi * h * (R * R + R * r + r * r) / 3;
  info = "**Объём усечённого конуса** с радиусами оснований R = " + format(R, 1) + ", r = " + format(r, 2) + " и высотой h = " + format(h, 1) + ":  V = ⅓πh(R² + Rr + r²) = " + format(v, 2) + ".\n\n";
  if (k < 0.99) {
    float hf = R * h / (R - r);
    float v1 = pi * R * R * hf / 3;
    float v2 = pi * r * r * (hf - h) / 3;
    info = info + "Как разность объёмов двух конусов с общей вершиной S: исходный (высота H = Rh/(R − r) = " + format(hf, 2) + ") даёт " + format(v1, 2) + ", отсечённый верхний даёт " + format(v2, 2) + ", разность " + format(v1 - v2, 2) + ".";
    if (showApex < 0.5) { info = info + " Вершина S лежит выше поля и не показана."; }
    info = info + "\n\n";
  } else {
    info = info + "При r = R тело — цилиндр: V = πR²h.\n\n";
  }
  if (k < 0.01) { info = info + "При r = 0 верхнее основание стягивается в точку — получается полный конус ⅓πR²h.\n\n"; }
  info = info + "Сечение на расстоянии x = " + format(q * h, 2) + " от нижнего основания (жёлтое) — круг радиуса R − (R − r)x/h = " + format(rq, 2) + " и площади " + format(pi * rq * rq, 2) + ": радиус меняется линейно, а площадь — по квадратичному закону.";
}
]
