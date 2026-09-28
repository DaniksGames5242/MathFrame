[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = true;
camera start rot = (25, 70);
camera start zoom = 1.6;

// ---- Середина M отрезка AB — точка с координатами, равными полусуммам
// координат концов; она пересчитывается сама при любом положении A и B. ----
new Point3D { name = "A"; pos = (-2.6, -1.6, 1.4); text = true("A"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "B"; pos = (2.2, 1.8, -1.6); text = true("B"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "M"; pos = (0, 0, 0); text = true("M"); color = #22c55e; dynamic = false; collision = false }
new Line3D { name = "ab"; pos = (A, B); interact = false }

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

  M.pos.x = (A.pos.x + B.pos.x) / 2; M.pos.y = (A.pos.y + B.pos.y) / 2; M.pos.z = (A.pos.z + B.pos.z) / 2;

  info = "**Координаты середины отрезка** AB — полусуммы одноимённых координат его концов: x_M = (x_A + x_B)/2, y_M = (y_A + y_B)/2, z_M = (z_A + z_B)/2.\n\nA(" + num(A.pos.x, 2) + "; " + num(A.pos.y, 2) + "; " + num(A.pos.z, 2) + "), B(" + num(B.pos.x, 2) + "; " + num(B.pos.y, 2) + "; " + num(B.pos.z, 2) + ") ⟹ M(" + num(M.pos.x, 2) + "; " + num(M.pos.y, 2) + "; " + num(M.pos.z, 2) + ").";
}
]
