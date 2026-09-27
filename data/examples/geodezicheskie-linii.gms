[
description = "{info}"

field width = 6;
field height = 6;
field depth = 6;
show grid = false;
show axes = false;

// ---- Сфера радиуса R = 2.5; точки A и B перетаскиваются и остаются на сфере ----
// Синяя — геодезическая (дуга большого круга), оранжевая — путь, «прямой на карте»
// (широта и долгота меняются равномерно).
new Primitive { name = "ball"; type = sphere; pos = (0, 0, 0); radius = 2.47; opacity = 0.35; color = #6b7280 }
new Curve3D { name = "eq"; type = parametric; x = "2.5 * cos(2 * pi * t)"; y = "0"; z = "2.5 * sin(2 * pi * t)"; segments = 120; color = #6b7280; thickness = 1 }
new Curve3D { name = "geo"; type = parametric; x = "gx(t)"; y = "gy(t)"; z = "gz(t)"; segments = 120; color = #3b82f6; thickness = 5 }
new Curve3D { name = "big"; type = parametric; x = "fx(t)"; y = "fy(t)"; z = "fz(t)"; segments = 160; color = #3b82f6; thickness = 1 }
new Curve3D { name = "lox"; type = parametric; x = "lx(t)"; y = "ly(t)"; z = "lz(t)"; segments = 120; color = #f59e0b; thickness = 4 }
new Point3D { name = "A"; pos = (1.9, 1.4, 0.9); text = true("A"); color = #ef4444 }
new Point3D { name = "B"; pos = (-1.6, 1.4, 1.3); text = true("B"); color = #ef4444 }

// ---- Логика ----
float R = 2.5;
float ax = 0; float ay = 0; float az = 1; float bx = 1; float by = 0; float bz = 0;
float om = 1;
float la = 0; float lb = 0; float oa = 0; float ob = 0;
float Lg = 0; float Ll = 0;
string info = "";

// Дуга большого круга: сферическая интерполяция единичных векторов a и b
Function sl(t, p1, p2) { return R * (sin((1 - t) * om) * p1 + sin(t * om) * p2) / sin(om); }
Function gx(t) { return sl(t, ax, bx); }
Function gy(t) { return sl(t, ay, by); }
Function gz(t) { return sl(t, az, bz); }
// Весь большой круг через A и B (тонкая линия): a·cos φ + e·sin φ, e ⟂ a в плоскости (a, b)
float ex = 0; float ey = 0; float ez = 0;
Function fx(t) { return R * (ax * cos(2 * pi * t) + ex * sin(2 * pi * t)); }
Function fy(t) { return R * (ay * cos(2 * pi * t) + ey * sin(2 * pi * t)); }
Function fz(t) { return R * (az * cos(2 * pi * t) + ez * sin(2 * pi * t)); }
// Путь с равномерно меняющимися широтой и долготой
Function lat(t) { return la + (lb - la) * t; }
Function lon(t) { return oa + (ob - oa) * t; }
Function lx(t) { return R * cos(lat(t)) * cos(lon(t)); }
Function ly(t) { return R * sin(lat(t)); }
Function lz(t) { return R * cos(lat(t)) * sin(lon(t)); }

Update {
  // Проекция на сферу
  float d = sqrt(A.pos.x * A.pos.x + A.pos.y * A.pos.y + A.pos.z * A.pos.z) + 0.000001;
  ax = A.pos.x / d; ay = A.pos.y / d; az = A.pos.z / d;
  d = sqrt(B.pos.x * B.pos.x + B.pos.y * B.pos.y + B.pos.z * B.pos.z) + 0.000001;
  bx = B.pos.x / d; by = B.pos.y / d; bz = B.pos.z / d;
  // Не даём точкам совпасть или стать диаметрально противоположными
  float c = ax * bx + ay * by + az * bz;
  if (c > 0.995 || c < -0.995) { bx = bx + 0.1 * ay; by = by - 0.1 * ax; d = sqrt(bx * bx + by * by + bz * bz); bx = bx / d; by = by / d; bz = bz / d; c = ax * bx + ay * by + az * bz; }
  A.pos.x = R * ax; A.pos.y = R * ay; A.pos.z = R * az;
  B.pos.x = R * bx; B.pos.y = R * by; B.pos.z = R * bz;
  om = acos(c);
  ex = (bx - c * ax) / sin(om); ey = (by - c * ay) / sin(om); ez = (bz - c * az) / sin(om);
  la = asin(ay); lb = asin(by); oa = atan2(az, ax); ob = atan2(bz, bx);
  if (ob - oa > pi) { ob = ob - 2 * pi; } if (oa - ob > pi) { ob = ob + 2 * pi; }
  Lg = R * om;
  // Длина второго пути — численно
  Ll = 0; float px = lx(0); float py = ly(0); float pz = lz(0);
  repeat (200) { float t = (i + 1) / 200; float qx = lx(t); float qy = ly(t); float qz = lz(t); Ll = Ll + sqrt((qx - px) ^ 2 + (qy - py) ^ 2 + (qz - pz) ^ 2); px = qx; py = qy; pz = qz; }

  info = "**Геодезическая линия** — кривая на поверхности, которая локально является кратчайшим путём между своими точками: «прямая» с точки зрения самой поверхности. Её главная нормаль в каждой точке совпадает с нормалью к поверхности — кривая не поворачивает «вбок». На сфере геодезические — большие окружности (их центр — центр сферы).\n\nR = 2.5:   по дуге большого круга (синяя) |AB| = R·∠AOB = " + format(Lg, 3) + ";  путь с равномерно меняющимися широтой и долготой (оранжевый) — " + format(Ll, 3) + ", длиннее на " + format(100 * (Ll / Lg - 1), 1) + "%.";
  info = info + " Поэтому самолёты летят не «прямо по карте», а по дуге большого круга, заметно отклоняясь к полюсу.\n\nСцену можно вращать мышью, точки A и B — перетаскивать.";
}
]
