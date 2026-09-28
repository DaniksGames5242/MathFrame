[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = true;
camera start rot = (25, 70);
camera start zoom = 1.6;

// ---- Вектор AB в пространстве: его координаты — разности координат конца и
// начала. A и B перетаскиваются в любом направлении пространства. ----
new Point3D { name = "A"; pos = (-2, -1, 1); text = true("A"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "B"; pos = (2, 1.5, -1.5); text = true("B"); color = #f59e0b; pauseOnDrag = false }
new Line3D { name = "ab"; pos = (A, B) }
draw Vector3D { name = "vab"; edge = "ab"; pos = 1; color = #22c55e }

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

  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float dz = B.pos.z - A.pos.z;
  float len = sqrt(dx * dx + dy * dy + dz * dz);
  info = "**Координаты вектора** AB — разности координат конца и начала: AB = (" + num(dx, 2) + "; " + num(dy, 2) + "; " + num(dz, 2) + ") при A(" + num(A.pos.x, 2) + "; " + num(A.pos.y, 2) + "; " + num(A.pos.z, 2) + "), B(" + num(B.pos.x, 2) + "; " + num(B.pos.y, 2) + "; " + num(B.pos.z, 2) + ").\n\n**Длина:** |AB| = √((" + num(dx, 2) + ")² + (" + num(dy, 2) + ")² + (" + num(dz, 2) + ")²) ≈ " + format(len, 2) + ".";
}
]
