[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.6;

// ---- Базис e1, e2, e3 (не обязательно перпендикулярный!) и точка M задают
// параллелепипед: M = x·e1 + y·e2 + z·e3. Перетаскивая концы базисных векторов,
// видно, что координаты (x; y; z) одной и той же точки M меняются вместе с базисом,
// хотя сама точка на месте — координаты зависят от выбора базиса. ----
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "E1"; pos = (2.4, -0.5, 0); text = true("e₁"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "E2"; pos = (0.3, 2.2, 0.4); text = true("e₂"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "E3"; pos = (0.2, -0.3, 2.5); text = true("e₃"); color = #22c55e; pauseOnDrag = false }
new Line3D { name = "oe1"; pos = (O, E1) }
new Line3D { name = "oe2"; pos = (O, E2) }
new Line3D { name = "oe3"; pos = (O, E3) }
draw Vector3D { name = "v1"; edge = "oe1"; pos = 1; color = #3b82f6 }
draw Vector3D { name = "v2"; edge = "oe2"; pos = 1; color = #f59e0b }
draw Vector3D { name = "v3"; edge = "oe3"; pos = 1; color = #22c55e }
new Point3D { name = "M"; pos = (1.6, 1.2, 1.0); text = true("M"); pauseOnDrag = false }
new Line3D { name = "om"; pos = (O, M); interact = false }
// рёбра параллелепипеда разложения (0,0,0)-M по осям e1,e2,e3
new Point3D { name = "P1"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "P2"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "P3"; pos = (0, 0, 0); dynamic = false; active = false }
new Line3D { name = "l1"; pos = (O, P1); interact = false }
new Line3D { name = "l2"; pos = (P1, P2); interact = false }
new Line3D { name = "l3"; pos = (P2, M); interact = false }

// ---- Логика ----
string info = "";
float px1 = 0; float py1 = 0; float pz1 = 0;
float px2 = 0; float py2 = 0; float pz2 = 0;
float px3 = 0; float py3 = 0; float pz3 = 0;
float pmx = 0; float pmy = 0; float pmz = 0;
float hx = 4.3; float hy = 3.3; float hz = 4.3;

Function inField3(x, y, z) { return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Start {
  px1 = E1.pos.x; py1 = E1.pos.y; pz1 = E1.pos.z;
  px2 = E2.pos.x; py2 = E2.pos.y; pz2 = E2.pos.z;
  px3 = E3.pos.x; py3 = E3.pos.y; pz3 = E3.pos.z;
  pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z;
}

Update {
  if (inField3(E1.pos.x, E1.pos.y, E1.pos.z)) { px1 = E1.pos.x; py1 = E1.pos.y; pz1 = E1.pos.z; } else { E1.pos.x = px1; E1.pos.y = py1; E1.pos.z = pz1; }
  if (inField3(E2.pos.x, E2.pos.y, E2.pos.z)) { px2 = E2.pos.x; py2 = E2.pos.y; pz2 = E2.pos.z; } else { E2.pos.x = px2; E2.pos.y = py2; E2.pos.z = pz2; }
  if (inField3(E3.pos.x, E3.pos.y, E3.pos.z)) { px3 = E3.pos.x; py3 = E3.pos.y; pz3 = E3.pos.z; } else { E3.pos.x = px3; E3.pos.y = py3; E3.pos.z = pz3; }
  if (inField3(M.pos.x, M.pos.y, M.pos.z)) { pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z; } else { M.pos.x = pmx; M.pos.y = pmy; M.pos.z = pmz; }

  float e1x = E1.pos.x; float e1y = E1.pos.y; float e1z = E1.pos.z;
  float e2x = E2.pos.x; float e2y = E2.pos.y; float e2z = E2.pos.z;
  float e3x = E3.pos.x; float e3y = E3.pos.y; float e3z = E3.pos.z;
  float mx = M.pos.x; float my = M.pos.y; float mz = M.pos.z;

  // Разложение M = x·e1 + y·e2 + z·e3 по правилу Крамера через смешанные произведения.
  float cx = e2y * e3z - e2z * e3y; float cy = e2z * e3x - e2x * e3z; float cz = e2x * e3y - e2y * e3x;
  float det = e1x * cx + e1y * cy + e1z * cz;
  float x = 0; float y = 0; float z = 0;
  if (abs(det) > 0.0001) {
    x = (mx * cx + my * cy + mz * cz) / det;
    float dx = e1y * e3z - e1z * e3y; float dy = e1z * e3x - e1x * e3z; float dz = e1x * e3y - e1y * e3x;
    y = (mx * dx + my * dy + mz * dz) / det;
    float gx = e1y * e2z - e1z * e2y; float gy = e1z * e2x - e1x * e2z; float gz = e1x * e2y - e1y * e2x;
    z = (mx * gx + my * gy + mz * gz) / det;
  }
  P1.pos.x = x * e1x; P1.pos.y = x * e1y; P1.pos.z = x * e1z;
  P2.pos.x = P1.pos.x + y * e2x; P2.pos.y = P1.pos.y + y * e2y; P2.pos.z = P1.pos.z + y * e2z;

  info = "**Координаты точки M** в базисе e₁, e₂, e₃ — коэффициенты разложения M = x·e₁ + y·e₂ + z·e₃ (рёбра параллелепипеда на рисунке). При этом базисные векторы **не обязаны быть перпендикулярными** — важна лишь их линейная независимость.\n\nM(" + num(x, 2) + "; " + num(y, 2) + "; " + num(z, 2) + ").";
  if (abs(det) <= 0.0001) { info = info + " Базис вырожден (векторы компланарны) — разложение невозможно."; }
  else { info = info + " Подвиньте e₁, e₂ или e₃ — координаты той же точки M изменятся, хотя сама точка останется на месте."; }
}
]
