[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = false;
camera start rot = (25, 70);
camera start zoom = 1.6;

// ---- Векторы a = OA, b = OB задают плоскость (полупрозрачная, через O, A, B);
// c = OC перетаскивается свободно — он компланарен a и b, только когда лежит в
// этой самой плоскости (смешанное произведение обращается в ноль). ----
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "A"; pos = (2.3, -0.4, 0.6); text = true("a"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "B"; pos = (0.3, 0.5, 2.1); text = true("b"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "C"; pos = (1.6, -1.6, 1.4); text = true("c"); pauseOnDrag = false }
new Line3D { name = "oa"; pos = (O, A) }
new Line3D { name = "ob"; pos = (O, B) }
new Line3D { name = "oc"; pos = (O, C) }
draw Vector3D { name = "va"; edge = "oa"; pos = 1; color = #3b82f6 }
draw Vector3D { name = "vb"; edge = "ob"; pos = 1; color = #f59e0b }
draw Vector3D { name = "vc"; edge = "oc"; pos = 1; color = #22c55e; active = coplanar > 0.5 }
draw Vector3D { name = "vc2"; edge = "oc"; pos = 1; active = coplanar < 0.5 }
draw InfPlane { name = "pl"; points = (O, A, B); size = 4; opacity = 0.35; fade = true }

new UI { name = "btn"; type = button; label = "Положить c в плоскость"; action = "snap = 1" }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float hx = 4.3; float hy = 3.3; float hz = 4.3;
float coplanar = 0; float snap = 0;

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

  float ax = A.pos.x; float ay = A.pos.y; float az = A.pos.z;
  float bx = B.pos.x; float by = B.pos.y; float bz = B.pos.z;
  float bcx = ay * bz - az * by; float bcy = az * bx - ax * bz; float bcz = ax * by - ay * bx;
  float bclen = sqrt(bcx * bcx + bcy * bcy + bcz * bcz);

  if (snap > 0.5) {
    // Проекция c на плоскость (a, b): убираем составляющую вдоль нормали a × b.
    float d = (C.pos.x * bcx + C.pos.y * bcy + C.pos.z * bcz) / (bclen * bclen);
    C.pos.x = C.pos.x - d * bcx; C.pos.y = C.pos.y - d * bcy; C.pos.z = C.pos.z - d * bcz;
    pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z;
    snap = 0;
  }

  float trip = C.pos.x * bcx + C.pos.y * bcy + C.pos.z * bcz;
  coplanar = 0; if (abs(trip) < 0.05 * bclen) { coplanar = 1; }

  info = "**Компланарные векторы** — векторы, лежащие в одной плоскости (или ей параллельные): один из них раскладывается по двум другим. Признак — равенство нулю смешанного произведения (a, b, c) = a · (b × c).\n\n(a, b, c) = " + num(trip, 2) + ".";
  if (coplanar > 0.5) { info = info + " Сейчас **c компланарен** a и b — лежит в закрашенной плоскости."; }
  else { info = info + " Сейчас **c не компланарен** a и b — выходит из плоскости; параллелепипед на a, b, c не вырожден."; }
}
]
