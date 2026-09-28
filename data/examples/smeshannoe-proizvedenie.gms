[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.6;

// ---- Три вектора a = OA, b = OB, c = OC из начала O задают параллелепипед;
// его объём — модуль их смешанного произведения (a, b, c) = a · (b × c). ----
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "A"; pos = (2.4, -0.6, 0.4); text = true("a"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "B"; pos = (0.2, 1.9, 0.6); text = true("b"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "C"; pos = (0.4, -0.2, 2.2); text = true("c"); color = #22c55e; pauseOnDrag = false }
new Line3D { name = "oa"; pos = (O, A) }
new Line3D { name = "ob"; pos = (O, B) }
new Line3D { name = "oc"; pos = (O, C) }
draw Vector3D { name = "va"; edge = "oa"; pos = 1; color = #3b82f6 }
draw Vector3D { name = "vb"; edge = "ob"; pos = 1; color = #f59e0b }
draw Vector3D { name = "vc"; edge = "oc"; pos = 1; color = #22c55e }
// остальные 9 рёбер параллелепипеда — по вычисляемым вершинам
new Point3D { name = "AB"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "AC"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "BC"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "ABC"; pos = (0, 0, 0); dynamic = false; active = false }
new Line3D { name = "e1"; pos = (A, AB); interact = false }
new Line3D { name = "e2"; pos = (B, AB); interact = false }
new Line3D { name = "e3"; pos = (A, AC); interact = false }
new Line3D { name = "e4"; pos = (C, AC); interact = false }
new Line3D { name = "e5"; pos = (B, BC); interact = false }
new Line3D { name = "e6"; pos = (C, BC); interact = false }
new Line3D { name = "e7"; pos = (AB, ABC); interact = false }
new Line3D { name = "e8"; pos = (AC, ABC); interact = false }
new Line3D { name = "e9"; pos = (BC, ABC); interact = false }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float hx = 4.3; float hy = 3.3; float hz = 4.3;

Function inField3(x, y, z) { return abs(x) <= hx && abs(y) <= hy && abs(z) <= hz; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z;
  pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z;
}

Update {
  if (inField3(A.pos.x, A.pos.y, A.pos.z)) { pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; } else { A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; }
  if (inField3(B.pos.x, B.pos.y, B.pos.z)) { pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z; } else { B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz; }
  if (inField3(C.pos.x, C.pos.y, C.pos.z)) { pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; } else { C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; }

  AB.pos.x = A.pos.x + B.pos.x; AB.pos.y = A.pos.y + B.pos.y; AB.pos.z = A.pos.z + B.pos.z;
  AC.pos.x = A.pos.x + C.pos.x; AC.pos.y = A.pos.y + C.pos.y; AC.pos.z = A.pos.z + C.pos.z;
  BC.pos.x = B.pos.x + C.pos.x; BC.pos.y = B.pos.y + C.pos.y; BC.pos.z = B.pos.z + C.pos.z;
  ABC.pos.x = A.pos.x + B.pos.x + C.pos.x; ABC.pos.y = A.pos.y + B.pos.y + C.pos.y; ABC.pos.z = A.pos.z + B.pos.z + C.pos.z;

  float ax = A.pos.x; float ay = A.pos.y; float az = A.pos.z;
  float bx = B.pos.x; float by = B.pos.y; float bz = B.pos.z;
  float cx = C.pos.x; float cy = C.pos.y; float cz = C.pos.z;
  float bcx = by * cz - bz * cy; float bcy = bz * cx - bx * cz; float bcz = bx * cy - by * cx;
  float trip = ax * bcx + ay * bcy + az * bcz;

  info = "**Смешанное произведение** трёх векторов (a, b, c) = a · (b × c) — число, равное объёму параллелепипеда, построенного на a, b, c, со знаком: он положителен, если тройка (a, b, c) правая, и отрицателен, если левая.\n\n(a, b, c) = " + num(trip, 2) + ", значит объём параллелепипеда V = " + format(abs(trip), 2) + ".";
  if (abs(trip) < 0.03) { info = info + " Векторы почти компланарны — параллелепипед почти вырожден."; }
}
]
