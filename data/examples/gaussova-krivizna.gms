[
description = "{info}"

field width = 8;
field height = 8;
field depth = 8;
show grid = false;
show axes = true;

// ---- Поверхность z = (a·x² + b·y²)/2; в начале координат её главные кривизны — a и b ----
// Точка M перетаскивается и остаётся на поверхности; в ней — касательная плоскость и нормаль.
// (в сцене вертикальная ось — y, поэтому поверхность задана параметрически: x = u, высота y = f(u, v), z = v)
draw Surface { name = "surf"; type = parametric; x = "u"; y = "(a * u * u + b * v * v) / 2"; z = "v"; umin = -2.6; umax = 2.6; vmin = -2.6; vmax = 2.6; grid = 40; color = #3b82f6; opacity = 1 }
new Point3D { name = "M"; pos = (0.8, 0, 0.5); text = true("M"); color = #f59e0b }
new Point3D { name = "T1"; pos = (1, 0, 0); dynamic = false; active = false }
new Point3D { name = "T2"; pos = (0, 1, 0); dynamic = false; active = false }
draw InfPlane { name = "tang"; points = (M, T1, T2); size = 2.2; opacity = 0.45; color = #f59e0b }
new Point3D { name = "NN"; pos = (0, 0, 1); dynamic = false; active = false }
new Line3D { name = "nrm"; pos = (M, NN); color = #22c55e; thickness = 3 }
draw Vector3D { name = "vn"; edge = "nrm"; pos = 1; color = #22c55e }

new UI { name = "sA"; type = slider; label = "a"; variable = a; min = -1; max = 1; step = 0.05; default = 0.6 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = -1; max = 1; step = 0.05; default = -0.5 }

// ---- Логика ----
float a = 0.6; float b = -0.5;
string info = "";

Update {
  // P — на поверхности и в пределах куска
  M.pos.x = max(-2.4, min(2.4, M.pos.x)); M.pos.z = max(-2.4, min(2.4, M.pos.z));
  float x = M.pos.x; float y = M.pos.z;
  float h = (a * x * x + b * y * y) / 2;
  M.pos.y = h;
  // Частные производные: fx = a·x, fy = b·y, fxx = a, fyy = b, fxy = 0
  float fx = a * x; float fy = b * y;
  float g = 1 + fx * fx + fy * fy;
  float K = a * b / (g * g);
  float H = (a * (1 + fy * fy) + b * (1 + fx * fx)) / (2 * pow(g, 1.5));
  // Касательная плоскость через векторы (1, 0, fx) и (0, 1, fy); нормаль (−fx, −fy, 1)
  T1.pos.x = x + 1; T1.pos.z = y; T1.pos.y = h + fx;
  T2.pos.x = x; T2.pos.z = y + 1; T2.pos.y = h + fy;
  float nl = sqrt(g);
  NN.pos.x = x - 1.3 * fx / nl; NN.pos.z = y - 1.3 * fy / nl; NN.pos.y = h + 1.3 / nl;

  info = "**Гауссова кривизна** K = k₁·k₂ — произведение главных кривизн поверхности в точке. Для графика z = f(x, y): K = (f_xx·f_yy − f_xy²)/(1 + f_x² + f_y²)². У поверхности z = (a·x² + b·y²)/2 в начале координат k₁ = a, k₂ = b.\n\nВ точке M = (" + format(x, 2) + "; " + format(y, 2) + "; " + format(h, 2) + "):   K = " + format(K, 3) + ",  средняя кривизна H = " + format(H, 3) + ".  ";
  if (K > 0.0005) { info = info + "**K > 0 — эллиптическая точка:** рядом с M поверхность лежит по одну сторону от касательной плоскости, как сфера."; }
  if (K < -0.0005) { info = info + "**K < 0 — гиперболическая точка:** поверхность пересекает касательную плоскость, как седло."; }
  if (abs(K) <= 0.0005) { info = info + "**K = 0 — параболическая точка:** поверхность изгибается только в одном направлении, как цилиндр (или плоская)."; }
  info = info + "\n\nСцену можно вращать мышью, точку M — перетаскивать.";
}
]
