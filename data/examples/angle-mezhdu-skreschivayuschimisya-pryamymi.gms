[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.1;

// ---- Скрещивающиеся прямые AB (синяя) и CD (жёлтая). Через произвольную точку O
// проводим прямые, параллельные им, — угол между ними и есть угол между AB и CD. ----
new Point3D { name = "A"; pos = (-3, -1, -2); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, 1, -2); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (-1, -3, 2); text = true("C"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "D"; pos = (1, 3, 1); text = true("D"); color = #f59e0b; pauseOnDrag = false }
new Point3D { name = "O"; pos = (2, -1.5, 2); text = true("O"); color = #22c55e; pauseOnDrag = false }
new Point3D { name = "P1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "P2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Q1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Q2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "U"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "V"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "cd"; pos = (C, D); interact = false; thickness = 3; color = #f59e0b }
new Line3D { name = "o1"; pos = (P1, P2); interact = false; thickness = 1.5; color = #3b82f6 }
new Line3D { name = "o2"; pos = (Q1, Q2); interact = false; thickness = 1.5; color = #f59e0b }
new Angle3D { name = "phi"; type = lineLine; line1 = (O, U); line2 = (O, V); radius = 1.2; active = nopar }

string info = "";
float par = 0; float nopar = 1;
float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;
float pcx = 0; float pcy = 0; float pcz = 0;
float pdx = 0; float pdy = 0; float pdz = 0;

Function cl4(v) { if (v > 4.3) { return 4.3; } if (v < -4.3) { return -4.3; } return v; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function tb(m, d, h) {
  if (d > 0.000001) { return (h - m) / d; }
  if (d < -0.000001) { return (-h - m) / d; }
  return 1000;
}
Function ok() {
  float ax = B.pos.x - A.pos.x; float ay = B.pos.y - A.pos.y; float az = B.pos.z - A.pos.z;
  float cx = D.pos.x - C.pos.x; float cy = D.pos.y - C.pos.y; float cz = D.pos.z - C.pos.z;
  return ax * ax + ay * ay + az * az >= 2.25 && cx * cx + cy * cy + cz * cz >= 2.25;
}

Start {
  pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z;
}

Update {
  // Точки не выходят за поле (движок в 3D их не удерживает): лишнее срезается по осям.
  if (abs(A.pos.x) > 4.3 || abs(A.pos.y) > 4.3 || abs(A.pos.z) > 4.3) { A.pos.x = cl4(A.pos.x); A.pos.y = cl4(A.pos.y); A.pos.z = cl4(A.pos.z); }
  if (abs(B.pos.x) > 4.3 || abs(B.pos.y) > 4.3 || abs(B.pos.z) > 4.3) { B.pos.x = cl4(B.pos.x); B.pos.y = cl4(B.pos.y); B.pos.z = cl4(B.pos.z); }
  if (abs(C.pos.x) > 4.3 || abs(C.pos.y) > 4.3 || abs(C.pos.z) > 4.3) { C.pos.x = cl4(C.pos.x); C.pos.y = cl4(C.pos.y); C.pos.z = cl4(C.pos.z); }
  if (abs(D.pos.x) > 4.3 || abs(D.pos.y) > 4.3 || abs(D.pos.z) > 4.3) { D.pos.x = cl4(D.pos.x); D.pos.y = cl4(D.pos.y); D.pos.z = cl4(D.pos.z); }
  if (abs(O.pos.x) > 4.3 || abs(O.pos.y) > 4.3 || abs(O.pos.z) > 4.3) { O.pos.x = cl4(O.pos.x); O.pos.y = cl4(O.pos.y); O.pos.z = cl4(O.pos.z); }
  if (ok()) {
    pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
    pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z;
  } else {
    A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz;
    C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; D.pos.x = pdx; D.pos.y = pdy; D.pos.z = pdz;
  }
  float d1x = B.pos.x - A.pos.x; float d1y = B.pos.y - A.pos.y; float d1z = B.pos.z - A.pos.z;
  float d2x = D.pos.x - C.pos.x; float d2y = D.pos.y - C.pos.y; float d2z = D.pos.z - C.pos.z;
  float l1 = sqrt(d1x * d1x + d1y * d1y + d1z * d1z); float l2 = sqrt(d2x * d2x + d2y * d2y + d2z * d2z);
  float dot = d1x * d2x + d1y * d2y + d1z * d2z;
  float cs = abs(dot) / (l1 * l2); if (cs > 1) { cs = 1; }
  float phi = acos(cs) * 180 / pi;
  float ux = d1x / l1; float uy = d1y / l1; float uz = d1z / l1;
  float vx = d2x / l2; float vy = d2y / l2; float vz = d2z / l2;
  float nx = d1y * d2z - d1z * d2y; float ny = d1z * d2x - d1x * d2z; float nz = d1x * d2y - d1y * d2x;
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  par = 0; nopar = 1; if (nl < 0.02 * l1 * l2) { par = 1; nopar = 0; }
  float mixed = (C.pos.x - A.pos.x) * nx + (C.pos.y - A.pos.y) * ny + (C.pos.z - A.pos.z) * nz;
  float dist = 0; if (par < 0.5) { dist = abs(mixed) / nl; }

  // Прямые через O, параллельные AB и CD, — на всю ширину поля.
  float a1 = min(tb(O.pos.x, -ux, 4.3), tb(O.pos.y, -uy, 4.3), tb(O.pos.z, -uz, 4.3));
  float a2 = min(tb(O.pos.x, ux, 4.3), tb(O.pos.y, uy, 4.3), tb(O.pos.z, uz, 4.3));
  float b1 = min(tb(O.pos.x, -vx, 4.3), tb(O.pos.y, -vy, 4.3), tb(O.pos.z, -vz, 4.3));
  float b2 = min(tb(O.pos.x, vx, 4.3), tb(O.pos.y, vy, 4.3), tb(O.pos.z, vz, 4.3));
  P1.pos.x = O.pos.x - ux * a1; P1.pos.y = O.pos.y - uy * a1; P1.pos.z = O.pos.z - uz * a1;
  P2.pos.x = O.pos.x + ux * a2; P2.pos.y = O.pos.y + uy * a2; P2.pos.z = O.pos.z + uz * a2;
  Q1.pos.x = O.pos.x - vx * b1; Q1.pos.y = O.pos.y - vy * b1; Q1.pos.z = O.pos.z - vz * b1;
  Q2.pos.x = O.pos.x + vx * b2; Q2.pos.y = O.pos.y + vy * b2; Q2.pos.z = O.pos.z + vz * b2;
  // Лучи угла: направляющие, повёрнутые так, чтобы угол был острым или прямым.
  float sg = 1; if (dot < 0) { sg = -1; }
  U.pos.x = O.pos.x + ux; U.pos.y = O.pos.y + uy; U.pos.z = O.pos.z + uz;
  V.pos.x = O.pos.x + sg * vx; V.pos.y = O.pos.y + sg * vy; V.pos.z = O.pos.z + sg * vz;

  info = "**Угол между скрещивающимися прямыми** AB и CD — угол между прямыми, проведёнными через любую точку O параллельно им (точку O можно двигать — угол не меняется). Он равен углу между направляющими векторами и всегда острый или прямой.\n\n";
  info = info + "AB = (" + num(d1x, 1) + "; " + num(d1y, 1) + "; " + num(d1z, 1) + "), CD = (" + num(d2x, 1) + "; " + num(d2y, 1) + "; " + num(d2z, 1) + "). cos φ = |AB · CD| / (|AB| · |CD|) = |" + num(dot, 2) + "| / (" + num(l1, 2) + " · " + num(l2, 2) + ") = " + num(cs, 3) + ", откуда **φ = " + num(phi, 1) + "°**.";
  if (par > 0.5) {
    info = info + "\n\nНаправляющие коллинеарны: прямые параллельны, φ = 0°.";
  } else {
    info = info + "\n\nРасстояние между прямыми (" + num(dist, 2) + ") и угол между ними не связаны: их можно менять независимо.";
  }
}
]
