[
description = "{info}"

field width = 14;
field height = 10;
field depth = 14;
show grid = false;
show axes = true;
camera start rot = (35, 65);
camera start zoom = 2;

// ---- Начало координат O и точка A (общая для всех вкладок) ----
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.4; text = true("O") }
new Point3D { name = "A"; pos = (3, 2, 2); text = true("A"); pauseOnDrag = false }

// ---- Вкладка 1: координаты точки и радиус-вектор ----
// Путь из O в A: вдоль оси x на x, затем параллельно оси z на z, затем параллельно оси y на y.
new Point3D { name = "X1"; pos = (3, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "X2"; pos = (3, 0, 2); dynamic = false; collision = false; active = false }
new Line3D { name = "px1"; pos = (O, X1); color = #3b82f6; thickness = 3; interact = false; active = tab == 1 }
new Line3D { name = "px2"; pos = (X1, X2); color = #3b82f6; thickness = 2; interact = false; active = tab == 1 }
new Line3D { name = "px3"; pos = (X2, A); color = #3b82f6; thickness = 2; interact = false; active = tab == 1 }
new Line3D { name = "ra"; pos = (O, A); color = #f59e0b; thickness = 3; interact = false; active = tab == 1 }
draw Vector3D { name = "vra"; edge = "ra"; pos = 1; color = #f59e0b; active = tab == 1 }

// ---- Вкладка 2: вектор AB, его длина и расстояние между точками ----
new Point3D { name = "B"; pos = (-2.5, -1.5, -2); text = true("B"); pauseOnDrag = false; active = tab >= 2 }
new Point3D { name = "H1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "H2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Mid"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M"); color = #22c55e; size = 0.5; active = tab == 2 }
new Point3D { name = "V"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "ab"; pos = (A, B); color = #f59e0b; thickness = 3; interact = false; active = tab == 2 }
draw Vector3D { name = "vab"; edge = "ab"; pos = 1; color = #f59e0b; active = tab == 2 }
new Line3D { name = "d1"; pos = (A, H1); thickness = 1; interact = false; active = tab == 2 }
new Line3D { name = "d2"; pos = (H1, H2); thickness = 1; interact = false; active = tab == 2 }
new Line3D { name = "d3"; pos = (H2, B); thickness = 1; interact = false; active = tab == 2 }
new Line3D { name = "dg"; pos = (A, H2); color = #22c55e; thickness = 2; interact = false; active = tab == 2 }
// тот же вектор, отложенный от начала координат: равные векторы — равные координаты
new Line3D { name = "ov"; pos = (O, V); color = #f59e0b; thickness = 1; interact = false; active = tab == 2 }
draw Vector3D { name = "vov"; edge = "ov"; pos = 1; color = #f59e0b; active = tab == 2 }

// ---- Вкладка 3: скалярное произведение и угол между a = OA и b = OB ----
new Point3D { name = "S"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "ob"; pos = (O, B); color = #3b82f6; thickness = 3; interact = false; active = tab == 3 }
draw Vector3D { name = "vob"; edge = "ob"; pos = 1; color = #3b82f6; active = tab == 3 }
new Line3D { name = "as"; pos = (A, S); thickness = 1; interact = false; active = tab == 3 }
new Line3D { name = "bs"; pos = (B, S); thickness = 1; interact = false; active = tab == 3 }
new Line3D { name = "os"; pos = (O, S); color = #22c55e; thickness = 2; interact = false; active = tab == 3 }
draw Vector3D { name = "vos"; edge = "os"; pos = 1; color = #22c55e; active = tab == 3 }
new Line3D { name = "oa3"; pos = (O, A); color = #f59e0b; thickness = 3; interact = false; active = tab == 3 }
draw Vector3D { name = "voa3"; edge = "oa3"; pos = 1; color = #f59e0b; active = tab == 3 }

new UI { name = "btnPoint"; type = button; label = "Точка и радиус-вектор"; action = "tab = 1" }
new UI { name = "btnVec"; type = button; label = "Вектор AB и расстояние"; action = "tab = 2" }
new UI { name = "btnDot"; type = button; label = "Скалярное произведение"; action = "tab = 3" }

float tab = 1;
string info = "";

Function num(v, d) {
  if (round(v * pow(10, d)) < 0) { return "−" + format(abs(v), d); }
  return format(abs(v), d);
}
Function numP(v, d) {
  if (round(v * pow(10, d)) < 0) { return "(" + num(v, d) + ")"; }
  return num(v, d);
}
Function clamp(v, m) { return min(max(v, -m), m); }

Update {
  // Точки остаются в пределах сцены (плавно: координаты прижимаются по отдельности)
  A.pos.x = clamp(A.pos.x, 3.5); A.pos.y = clamp(A.pos.y, 2.8); A.pos.z = clamp(A.pos.z, 3.5);
  B.pos.x = clamp(B.pos.x, 3.5); B.pos.y = clamp(B.pos.y, 2.8); B.pos.z = clamp(B.pos.z, 3.5);
  float ax = A.pos.x; float ay = A.pos.y; float az = A.pos.z;
  float bx = B.pos.x; float by = B.pos.y; float bz = B.pos.z;

  X1.pos.x = ax; X1.pos.y = 0; X1.pos.z = 0;
  X2.pos.x = ax; X2.pos.y = 0; X2.pos.z = az;

  float dx = bx - ax; float dy = by - ay; float dz = bz - az;
  H1.pos.x = bx; H1.pos.y = ay; H1.pos.z = az;
  H2.pos.x = bx; H2.pos.y = ay; H2.pos.z = bz;
  Mid.pos.x = (ax + bx) / 2; Mid.pos.y = (ay + by) / 2; Mid.pos.z = (az + bz) / 2;
  V.pos.x = dx; V.pos.y = dy; V.pos.z = dz;
  S.pos.x = ax + bx; S.pos.y = ay + by; S.pos.z = az + bz;

  if (tab == 1) {
    float len = sqrt(ax * ax + ay * ay + az * az);
    info = "**Координаты точки** A(" + num(ax, 2) + "; " + num(ay, 2) + "; " + num(az, 2) + ") показывают, сколько единичных отрезков нужно отложить вдоль осей \\(Ox\\), \\(Oz\\), \\(Oy\\), чтобы из начала координат попасть в A (синий путь).\n\n**Радиус-вектор** \\(\\overrightarrow{OA}\\) (оранжевый) имеет те же координаты, что и сама точка. Его длина \\(|\\overrightarrow{OA}| = \\sqrt{x^{2} + y^{2} + z^{2}} = \\sqrt{" + num(ax * ax, 2) + " + " + num(ay * ay, 2) + " + " + num(az * az, 2) + "} = " + num(len, 2) + "\\).\n\nСцену можно вращать мышью.";
  } else if (tab == 2) {
    float d12 = sqrt(dx * dx + dz * dz);
    float len2 = sqrt(dx * dx + dy * dy + dz * dz);
    info = "**Координаты вектора** — разности координат конца и начала: \\(\\overrightarrow{AB} = (x_2 - x_1;\\ y_2 - y_1;\\ z_2 - z_1) = (" + num(dx, 2) + ";\\ " + num(dy, 2) + ";\\ " + num(dz, 2) + ")\\). Тот же вектор, отложенный от начала координат (тонкая стрелка), заканчивается в точке с этими координатами: равные векторы имеют равные координаты.\n\n**Длина вектора и расстояние** \\(AB\\): теорема Пифагора дважды — сначала диагональ основания \\(\\sqrt{" + num(dx * dx, 2) + " + " + num(dz * dz, 2) + "} = " + num(d12, 2) + "\\) (зелёная), затем \\(\\sqrt{" + num(d12 * d12, 2) + " + " + num(dy * dy, 2) + "} = " + num(len2, 2) + "\\).\n\n**Середина** M имеет координаты \\(\\left(" + num((ax + bx) / 2, 2) + ";\\ " + num((ay + by) / 2, 2) + ";\\ " + num((az + bz) / 2, 2) + "\\right)\\).";
  } else {
    float la = sqrt(ax * ax + ay * ay + az * az);
    float lb = sqrt(bx * bx + by * by + bz * bz);
    float dot = ax * bx + ay * by + az * bz;
    string rel = "Угол между векторами острый (скалярное произведение положительно).";
    float cs = 0;
    if (la * lb > 0.0001) { cs = min(max(dot / (la * lb), -1), 1); }
    if (dot < -0.05) { rel = "Угол между векторами тупой (скалярное произведение отрицательно)."; }
    if (abs(dot) <= 0.05) { rel = "**Векторы перпендикулярны:** скалярное произведение равно нулю."; }
    info = "**Скалярное произведение** \\(\\vec{a} \\cdot \\vec{b} = x_1 x_2 + y_1 y_2 + z_1 z_2 = " + num(ax * bx, 2) + " + " + numP(ay * by, 2) + " + " + numP(az * bz, 2) + " = " + num(dot, 2) + "\\), где \\(\\vec{a} = \\overrightarrow{OA}\\), \\(\\vec{b} = \\overrightarrow{OB}\\).\n\nОтсюда \\(\\cos\\varphi = \\dfrac{\\vec{a} \\cdot \\vec{b}}{|\\vec{a}||\\vec{b}|} = " + num(cs, 3) + "\\), \\(\\varphi \\approx " + format(acos(cs) * 180 / 3.14159265, 1) + "^{\\circ}\\). " + rel + "\n\nЗелёный вектор — сумма \\(\\vec{a} + \\vec{b} = (" + num(ax + bx, 2) + ";\\ " + num(ay + by, 2) + ";\\ " + num(az + bz, 2) + ")\\): координаты складываются покоординатно.";
  }
}
]
