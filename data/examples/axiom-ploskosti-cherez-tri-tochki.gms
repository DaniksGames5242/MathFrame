[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.6;

// ---- Три точки A, B, C — не лежащие на одной прямой — задают единственную плоскость.
// Все три перетаскиваются в любом направлении пространства; когда точки почти
// коллинеарны, плоскость вырождается, и такой ход отменяется (точка возвращается
// на последнее корректное место). ----
new Point3D { name = "A"; pos = (-3, -2, -1); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, -1, 2); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (0, 3, -2); text = true("C"); pauseOnDrag = false }

draw InfPlane { name = "plane"; points = (A, B, C); size = 5.5; opacity = 0.3; color = #3b82f6 }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 2 }
new Line3D { name = "bc"; pos = (B, C); interact = false; thickness = 2 }
new Line3D { name = "ca"; pos = (C, A); interact = false; thickness = 2 }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float hx = 4.3; float hy = 4.3; float hz = 4.3;
float S = 0;

Function inField3(x, y, z) { return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz; }

// Площадь треугольника (удвоенная, через векторное произведение) — мера коллинеарности:
// у почти коллинеарных точек она близка к нулю.
Function area2(p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z) {
  float ux = p2x - p1x; float uy = p2y - p1y; float uz = p2z - p1z;
  float vx = p3x - p1x; float vy = p3y - p1y; float vz = p3z - p1z;
  float cx = uy * vz - uz * vy; float cy = uz * vx - ux * vz; float cz = ux * vy - uy * vx;
  return sqrt(cx * cx + cy * cy + cz * cz);
}

Function ok(px, py, pz, q1x, q1y, q1z, q2x, q2y, q2z) {
  if (!inField3(px, py, pz)) { return false; }
  return area2(px, py, pz, q1x, q1y, q1z, q2x, q2y, q2z) >= 1.2;
}

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z;
  pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay) + abs(A.pos.z - paz);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby) + abs(B.pos.z - pbz);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy) + abs(C.pos.z - pcz);
  float m = max(mA, mB, mC);
  if (m > 0.000001) {
    if (mA == m) {
      if (ok(A.pos.x, A.pos.y, A.pos.z, pbx, pby, pbz, pcx, pcy, pcz)) { pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; } else { A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; }
    } else if (mB == m) {
      if (ok(B.pos.x, B.pos.y, B.pos.z, pax, pay, paz, pcx, pcy, pcz)) { pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z; } else { B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz; }
    } else {
      if (ok(C.pos.x, C.pos.y, C.pos.z, pax, pay, paz, pbx, pby, pbz)) { pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; } else { C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; }
    }
  }
  S = area2(A.pos.x, A.pos.y, A.pos.z, B.pos.x, B.pos.y, B.pos.z, C.pos.x, C.pos.y, C.pos.z) / 2;

  info = "**Аксиома:** через любые три точки, не лежащие на одной прямой, проходит единственная плоскость. Точки A, B, C сейчас образуют треугольник площадью S = " + format(S, 2) + " — они не коллинеарны, и плоскость (закрашена) определена однозначно.\n\nПри попытке свести все три точки на одну прямую (площадь треугольника → 0) плоскость перестала бы быть единственной — такой ход недопустим и отменяется.\n\nСцену можно вращать мышью.";
}
]
