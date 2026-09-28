[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.6;

// ---- Тетраэдр ABCD: все четыре вершины свободны и перетаскиваются в любом
// направлении пространства — фигура остаётся объёмной (три измерения), пока
// вершины не легли в одну плоскость (объём не обратился в 0). Точка M проверяется
// на принадлежность внутренности через знаки объёмов четырёх под-тетраэдров. ----
new Point3D { name = "A"; pos = (-3, -2, -2); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, -2, 1); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (0, 2, -3); text = true("C"); pauseOnDrag = false }
new Point3D { name = "D"; pos = (0, -1, 3); text = true("D"); pauseOnDrag = false }

new Line3D { name = "ab"; pos = (A, B) }
new Line3D { name = "ac"; pos = (A, C) }
new Line3D { name = "ad"; pos = (A, D) }
new Line3D { name = "bc"; pos = (B, C) }
new Line3D { name = "bd"; pos = (B, D) }
new Line3D { name = "cd"; pos = (C, D) }

// ---- Пробная точка M: показывает внутреннюю/внешнюю точку фигуры. ----
new Point3D { name = "M"; pos = (0, 0, 0); text = true("M"); color = #f59e0b; pauseOnDrag = false }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float pdx = 0; float pdy = 0; float pdz = 0;
float pmx = 0; float pmy = 0; float pmz = 0;
float hx = 4.3; float hy = 3.3; float hz = 4.3;
float V = 0; float inside = 0;

Function inField3(x, y, z) {
  return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz;
}

// Знаковый (учетверённый) объём тетраэдра p1 p2 p3 p4.
Function vol6(p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, p4x, p4y, p4z) {
  float ux = p2x - p1x; float uy = p2y - p1y; float uz = p2z - p1z;
  float vx = p3x - p1x; float vy = p3y - p1y; float vz = p3z - p1z;
  float wx = p4x - p1x; float wy = p4y - p1y; float wz = p4z - p1z;
  float cx = vy * wz - vz * wy; float cy = vz * wx - vx * wz; float cz = vx * wy - vy * wx;
  return ux * cx + uy * cy + uz * cz;
}

// Допустимо ли новое положение вершины p при трёх других фиксированных q1, q2, q3:
// внутри поля и объём не вырождается (вершины не легли в одну плоскость).
Function ok(px, py, pz, q1x, q1y, q1z, q2x, q2y, q2z, q3x, q3y, q3z) {
  if (!inField3(px, py, pz)) { return false; }
  return abs(vol6(px, py, pz, q1x, q1y, q1z, q2x, q2y, q2z, q3x, q3y, q3z)) >= 3;
}

Function sign(x) { if (x > 0.000001) { return 1; } if (x < -0.000001) { return -1; } return 0; }

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z;
  pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z;
  pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z;
  pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay) + abs(A.pos.z - paz);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby) + abs(B.pos.z - pbz);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy) + abs(C.pos.z - pcz);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy) + abs(D.pos.z - pdz);
  float m = max(mA, mB, mC, mD);
  if (m > 0.000001) {
    if (mA == m) {
      if (ok(A.pos.x, A.pos.y, A.pos.z, pbx, pby, pbz, pcx, pcy, pcz, pdx, pdy, pdz)) { pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; } else { A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; }
    } else if (mB == m) {
      if (ok(B.pos.x, B.pos.y, B.pos.z, pax, pay, paz, pcx, pcy, pcz, pdx, pdy, pdz)) { pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z; } else { B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz; }
    } else if (mC == m) {
      if (ok(C.pos.x, C.pos.y, C.pos.z, pax, pay, paz, pbx, pby, pbz, pdx, pdy, pdz)) { pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; } else { C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; }
    } else {
      if (ok(D.pos.x, D.pos.y, D.pos.z, pax, pay, paz, pbx, pby, pbz, pcx, pcy, pcz)) { pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z; } else { D.pos.x = pdx; D.pos.y = pdy; D.pos.z = pdz; }
    }
  }

  // Точка M — свободная, ограничена только полем.
  if (inField3(M.pos.x, M.pos.y, M.pos.z)) { pmx = M.pos.x; pmy = M.pos.y; pmz = M.pos.z; }
  else { M.pos.x = pmx; M.pos.y = pmy; M.pos.z = pmz; }

  // Объём тетраэдра и проверка M на принадлежность внутренности: M внутри, если все
  // четыре под-тетраэдра (M с тремя вершинами вместо одной) ориентированы так же, как ABCD.
  float vT = vol6(A.pos.x, A.pos.y, A.pos.z, B.pos.x, B.pos.y, B.pos.z, C.pos.x, C.pos.y, C.pos.z, D.pos.x, D.pos.y, D.pos.z);
  float v1 = vol6(M.pos.x, M.pos.y, M.pos.z, B.pos.x, B.pos.y, B.pos.z, C.pos.x, C.pos.y, C.pos.z, D.pos.x, D.pos.y, D.pos.z);
  float v2 = vol6(A.pos.x, A.pos.y, A.pos.z, M.pos.x, M.pos.y, M.pos.z, C.pos.x, C.pos.y, C.pos.z, D.pos.x, D.pos.y, D.pos.z);
  float v3 = vol6(A.pos.x, A.pos.y, A.pos.z, B.pos.x, B.pos.y, B.pos.z, M.pos.x, M.pos.y, M.pos.z, D.pos.x, D.pos.y, D.pos.z);
  float v4 = vol6(A.pos.x, A.pos.y, A.pos.z, B.pos.x, B.pos.y, B.pos.z, C.pos.x, C.pos.y, C.pos.z, M.pos.x, M.pos.y, M.pos.z);
  float st = sign(vT);
  inside = 0;
  if (st != 0 && sign(v1) == st && sign(v2) == st && sign(v3) == st && sign(v4) == st) { inside = 1; }
  V = abs(vT) / 6;

  info = "**Пространственная фигура** имеет протяжённость сразу в трёх измерениях — тетраэдр ABCD задан четырьмя вершинами, не лежащими в одной плоскости; никакая тройка его точек не определяет всю фигуру. Его **объём** V = " + format(V, 2) + " — мера, которой нет ни у линий, ни у плоских фигур.\n\n**Граница** фигуры — поверхность из четырёх треугольных граней (ABC, ABD, ACD, BCD), отделяющая внутренние точки от внешних.\n\nТочка M сейчас " + iif3(inside > 0.5, "**внутренняя**: у неё есть окрестность, целиком лежащая внутри тетраэдра во всех трёх направлениях", "**внешняя**") + ".\n\nСцену можно вращать мышью.";
}

Function iif3(c, s1, s2) { if (c) { return s1; } return s2; }
]
