[
description = "{info}"

field width = 10;
field height = 10;
field depth = 10;
show grid = false;
show axes = true;
camera start rot = (35, 65);
camera start zoom = 1;

// ---- Начало O и три вектора a = OA, b = OB, c = OC ----
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.4 }
new Point3D { name = "A"; pos = (3, 0.5, -1.5); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (0.5, 3, 1); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (-1, 1, 3); text = true("C"); pauseOnDrag = false }
new Line3D { name = "la"; pos = (O, A); color = #3b82f6; thickness = 3 }
new Line3D { name = "lb"; pos = (O, B); color = #f59e0b; thickness = 3 }
new Line3D { name = "lc"; pos = (O, C); color = #22c55e; thickness = 3 }
draw Vector3D { name = "va"; edge = "la"; pos = 1; color = #3b82f6 }
draw Vector3D { name = "vb"; edge = "lb"; pos = 1; color = #f59e0b }
draw Vector3D { name = "vc"; edge = "lc"; pos = 1; color = #22c55e }

// ---- Параллелепипед на a, b, c: остальные 4 вершины и рёбра ----
new Point3D { name = "AB"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "AC"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "BC"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "ABC"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "e1"; pos = (A, AB) }
new Line3D { name = "e2"; pos = (B, AB) }
new Line3D { name = "e3"; pos = (A, AC) }
new Line3D { name = "e4"; pos = (C, AC) }
new Line3D { name = "e5"; pos = (B, BC) }
new Line3D { name = "e6"; pos = (C, BC) }
new Line3D { name = "e7"; pos = (AB, ABC) }
new Line3D { name = "e8"; pos = (AC, ABC) }
new Line3D { name = "e9"; pos = (BC, ABC) }

// ---- Векторное произведение a × b, отложенное от O ----
new Point3D { name = "N"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "ln"; pos = (O, N); color = #f59e0b; thickness = 3 }
draw Vector3D { name = "vn"; edge = "ln"; pos = 1; color = #f59e0b }

// ---- Логика ----
string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float ax = A.pos.x; float ay = A.pos.y; float az = A.pos.z;
  float bx = B.pos.x; float by = B.pos.y; float bz = B.pos.z;
  float cx0 = C.pos.x; float cy0 = C.pos.y; float cz0 = C.pos.z;

  AB.pos.x = ax + bx; AB.pos.y = ay + by; AB.pos.z = az + bz;
  AC.pos.x = ax + cx0; AC.pos.y = ay + cy0; AC.pos.z = az + cz0;
  BC.pos.x = bx + cx0; BC.pos.y = by + cy0; BC.pos.z = bz + cz0;
  ABC.pos.x = ax + bx + cx0; ABC.pos.y = ay + by + cy0; ABC.pos.z = az + bz + cz0;

  float la0 = sqrt(ax * ax + ay * ay + az * az);
  float lb0 = sqrt(bx * bx + by * by + bz * bz);
  float lc0 = sqrt(cx0 * cx0 + cy0 * cy0 + cz0 * cz0);

  // Векторное произведение a × b
  float nx = ay * bz - az * by; float ny = az * bx - ax * bz; float nz = ax * by - ay * bx;
  float nlen = sqrt(nx * nx + ny * ny + nz * nz);
  float scale = 3 / max(nlen, 0.000001);
  N.pos.x = nx * scale; N.pos.y = ny * scale; N.pos.z = nz * scale;

  // Смешанное произведение (a, b, c) = a · (b × c) — объём параллелепипеда со знаком
  float mixed = ax * (by * cz0 - bz * cy0) + ay * (bz * cx0 - bx * cz0) + az * (bx * cy0 - by * cx0);
  float cosAB = (ax * bx + ay * by + az * bz) / max(la0 * lb0, 0.000001);

  string comp = "**a, b, c некомпланарны** — образуют базис пространства, объём параллелепипеда на них равен |V| = " + num(abs(mixed), 2) + " > 0.";
  if (abs(mixed) < 0.08) { comp = "**a, b, c компланарны** (смешанное произведение ≈ 0) — все три лежат в одной плоскости, параллелепипед вырожден."; }

  info = "**a** = (" + num(ax, 1) + "; " + num(ay, 1) + "; " + num(az, 1) + "), |a| = " + format(la0, 2) + ".  **b** = (" + num(bx, 1) + "; " + num(by, 1) + "; " + num(bz, 1) + "), |b| = " + format(lb0, 2) + ".  **c** = (" + num(cx0, 1) + "; " + num(cy0, 1) + "; " + num(cz0, 1) + "), |c| = " + format(lc0, 2) + ".\n\n**Векторное произведение a × b** (красное) перпендикулярно обоим сомножителям, его длина |a × b| = " + format(nlen, 2) + " равна площади параллелограмма на a и b. cos угла между a и b = " + format(cosAB, 2) + ".\n\n**Смешанное произведение** (a, b, c) = " + num(mixed, 2) + ". " + comp + "\n\nСцену можно вращать мышью.";
}
]
