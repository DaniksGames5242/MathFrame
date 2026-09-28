[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = true;
camera start rot = (25, 70);
camera start zoom = 1.6;

// ---- Точка M и её ортогональные проекции на три взаимно перпендикулярные оси —
// координаты x, y, z равны длинам этих проекций со знаком. ----
new Point3D { name = "M"; pos = (2.4, 1.6, -1.8); text = true("M"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "Px"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "Py"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "Pz"; pos = (0, 0, 0); dynamic = false; active = false }
new Line3D { name = "mx"; pos = (M, Px); interact = false }
new Line3D { name = "my"; pos = (M, Py); interact = false }
new Line3D { name = "mz"; pos = (M, Pz); interact = false }

// ---- Логика ----
string info = "";
float pmx = 0; float pmy = 0; float pmz = 0;
float hx = 4.3; float hy = 3.3; float hz = 4.3;

Function inField3(x, y, z) { return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Start { pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z; }

Update {
  if (inField3(M.pos.x, M.pos.y, M.pos.z)) { pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z; } else { M.pos.x = pmx; M.pos.y = pmy; M.pos.z = pmz; }

  Px.pos.x = M.pos.x; Px.pos.y = 0; Px.pos.z = 0;
  Py.pos.x = 0; Py.pos.y = M.pos.y; Py.pos.z = 0;
  Pz.pos.x = 0; Pz.pos.y = 0; Pz.pos.z = M.pos.z;

  float x = M.pos.x; float y = M.pos.y; float z = M.pos.z;
  float r = sqrt(x * x + y * y + z * z);
  float ca = 0; float cb = 0; float cg = 0;
  if (r > 0.0001) { ca = x / r; cb = y / r; cg = z / r; }

  info = "**Прямоугольная система координат:** три взаимно перпендикулярные оси с общим началом и единичными отрезками. Координаты точки M — длины её ортогональных проекций на оси, взятые со знаком (перпендикуляры из M к осям на рисунке): M(" + num(x, 2) + "; " + num(y, 2) + "; " + num(z, 2) + ").\n\n**Расстояние от начала:** |OM| = √(x² + y² + z²) ≈ " + format(r, 2) + ".\n\n**Направляющие косинусы:** cos α = " + num(ca, 2) + ", cos β = " + num(cb, 2) + ", cos γ = " + num(cg, 2) + " (cos²α + cos²β + cos²γ = " + format(ca * ca + cb * cb + cg * cg, 2) + ").";
}
]
