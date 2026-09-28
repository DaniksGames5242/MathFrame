[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.6;

// ---- Векторы a = OA, b = OB от начала O; параллелограмм на них показывает площадь
// |a × b|, зелёная стрелка — направление векторного произведения (перпендикулярно
// плоскости a, b; отрисована единичной длины — истинная длина в описании). ----
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "A"; pos = (2.2, 0.4, 1.4); text = true("a"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "B"; pos = (0.6, 1.8, -1.6); text = true("b"); color = #f59e0b; pauseOnDrag = false }
new Line3D { name = "oa"; pos = (O, A) }
new Line3D { name = "ob"; pos = (O, B) }
draw Vector3D { name = "va"; edge = "oa"; pos = 1; color = #3b82f6 }
draw Vector3D { name = "vb"; edge = "ob"; pos = 1; color = #f59e0b }
new Point3D { name = "C"; pos = (2.8, 2.2, -0.2); dynamic = false; active = false }
new Line3D { name = "ac"; pos = (A, C); interact = false }
new Line3D { name = "bc"; pos = (B, C); interact = false }
new Point3D { name = "N"; pos = (0, 0, 1); dynamic = false; active = false }
new Line3D { name = "on"; pos = (O, N); color = #22c55e; thickness = 3 }
draw Vector3D { name = "vn"; edge = "on"; pos = 1; color = #22c55e }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float hx = 4.3; float hy = 3.3; float hz = 4.3;

Function inField3(x, y, z) { return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z;
  pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
}

Update {
  // A, B в поле; длина каждого вектора не больше 2.6 (чтобы параллелограмм был виден целиком).
  float la = sqrt(A.pos.x * A.pos.x + A.pos.y * A.pos.y + A.pos.z * A.pos.z);
  if (inField3(A.pos.x, A.pos.y, A.pos.z) && la <= 2.6 && la >= 0.3) { pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; } else { A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; }
  float lb = sqrt(B.pos.x * B.pos.x + B.pos.y * B.pos.y + B.pos.z * B.pos.z);
  if (inField3(B.pos.x, B.pos.y, B.pos.z) && lb <= 2.6 && lb >= 0.3) { pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z; } else { B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz; }

  C.pos.x = A.pos.x + B.pos.x; C.pos.y = A.pos.y + B.pos.y; C.pos.z = A.pos.z + B.pos.z;

  float ax = A.pos.x; float ay = A.pos.y; float az = A.pos.z;
  float bx = B.pos.x; float by = B.pos.y; float bz = B.pos.z;
  float nx = ay * bz - az * by; float ny = az * bx - ax * bz; float nz = ax * by - ay * bx;
  float nlen = sqrt(nx * nx + ny * ny + nz * nz);
  if (nlen > 0.0001) { N.pos.x = nx / nlen; N.pos.y = ny / nlen; N.pos.z = nz / nlen; } else { N.pos.x = 0; N.pos.y = 0; N.pos.z = 1; }

  float dot = ax * bx + ay * by + az * bz;
  float la2 = sqrt(ax * ax + ay * ay + az * az); float lb2 = sqrt(bx * bx + by * by + bz * bz);
  float cosang = 0; if (la2 > 0.0001 && lb2 > 0.0001) { cosang = dot / (la2 * lb2); }
  if (cosang > 1) { cosang = 1; } if (cosang < -1) { cosang = -1; }
  float ang = acos(cosang) * 180 / 3.14159265;

  info = "**Векторное произведение** a × b — вектор (зелёный), перпендикулярный плоскости a и b; его длина равна площади параллелограмма, построенного на a и b, а направление задаётся правой тройкой (a, b, a × b).\n\n**Координаты:** a × b = (" + num(nx, 2) + "; " + num(ny, 2) + "; " + num(nz, 2) + "), |a × b| = " + format(nlen, 2) + " — площадь параллелограмма (угол между a и b ≈ " + format(ang, 0) + "°).";
  if (nlen < 0.05) { info = info + " Векторы почти коллинеарны — произведение близко к нулевому."; }
}
]
