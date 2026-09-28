[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = true;
camera start rot = (25, 70);
camera start zoom = 1.6;

// ---- Расстояние |AB| — гипотенуза прямоугольного треугольника с катетами |PB|
// (по вертикали) и |AP| (в горизонтальной плоскости, где P — проекция B на высоту A). ----
new Point3D { name = "A"; pos = (-2.4, -1.4, 1.6); text = true("A"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "B"; pos = (2.2, 1.6, -1.2); text = true("B"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "P"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("P") }
new Line3D { name = "ab"; pos = (A, B); color = #22c55e; thickness = 3 }
new Line3D { name = "ap"; pos = (A, P); interact = false }
new Line3D { name = "pb"; pos = (P, B); interact = false }

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
  if (inField3(A.pos.x, A.pos.y, A.pos.z)) { pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; } else { A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; }
  if (inField3(B.pos.x, B.pos.y, B.pos.z)) { pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z; } else { B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz; }

  // P — точка на вертикали над B на высоте A: сначала в плоскости XZ находим
  // расстояние между проекциями A и B, затем перпендикулярно добавляем разность Y.
  P.pos.x = B.pos.x; P.pos.y = A.pos.y; P.pos.z = B.pos.z;

  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float dz = B.pos.z - A.pos.z;
  float dxz = sqrt(dx * dx + dz * dz);
  float d = sqrt(dx * dx + dy * dy + dz * dz);

  info = "**Расстояние между точками** A(" + num(A.pos.x, 2) + "; " + num(A.pos.y, 2) + "; " + num(A.pos.z, 2) + ") и B(" + num(B.pos.x, 2) + "; " + num(B.pos.y, 2) + "; " + num(B.pos.z, 2) + ") находится двойным применением теоремы Пифагора: сначала |AP| = " + format(dxz, 2) + " — расстояние между проекциями в горизонтальной плоскости, затем |PB| = " + format(abs(dy), 2) + " по вертикали, и |AB| = √(|AP|² + |PB|²).\n\n**d = √((" + num(dx, 2) + ")² + (" + num(dy, 2) + ")² + (" + num(dz, 2) + ")²) ≈ " + format(d, 2) + "**.";
}
]
