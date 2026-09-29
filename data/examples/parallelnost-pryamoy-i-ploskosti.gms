[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (40, 60);
camera start zoom = 1.1;

// ---- Плоскость α задана точками P1, P2, P3, прямая a — точками A и B (все свободны).
// Прямая a целиком (на всю ширину поля) — L1L2. Считается взаимное расположение:
// пересекает / лежит в плоскости / параллельна (нет общих точек). При почти параллельном
// направлении прямая «притягивается» к параллельности. ----
new Point3D { name = "P1"; pos = (-3, -1.5, -2.5); text = true("P1"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "P2"; pos = (3, -1, -2); text = true("P2"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "P3"; pos = (0, -0.5, 3); text = true("P3"); color = #3b82f6; pauseOnDrag = false }
new Point3D { name = "A"; pos = (-3, 1.5, -1); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (3, 1.93, -1); text = true("B"); pauseOnDrag = false }
new Point3D { name = "L1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "L2"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "X"; pos = (0, 0, 0); dynamic = false; collision = false; color = #f59e0b; text = true("X"); active = showX }
new Point3D { name = "FA"; pos = (0, 0, 0); dynamic = false; collision = false; radius = 0.08; active = par }
new Point3D { name = "FB"; pos = (0, 0, 0); dynamic = false; collision = false; radius = 0.08; active = par }
draw InfPlane { name = "alpha"; points = (P1, P2, P3); size = 3.6; opacity = 0.2; color = #3b82f6 }
new Line3D { name = "la"; pos = (L1, L2); interact = false; thickness = 3 }
new Line3D { name = "ha"; pos = (A, FA); interact = false; active = par }
new Line3D { name = "hb"; pos = (B, FB); interact = false; active = par }
draw Punctir { name = "punA"; edge = "ha" }
draw Punctir { name = "punB"; edge = "hb" }

string info = "";
float par = 0; float showX = 0;
float p1x = 0; float p1y = 0; float p1z = 0; float p2x = 0; float p2y = 0; float p2z = 0;
float p3x = 0; float p3y = 0; float p3z = 0; float pax = 0; float pay = 0; float paz = 0;
float pbx = 0; float pby = 0; float pbz = 0;

Function cl4(v) { if (v > 4.3) { return 4.3; } if (v < -4.3) { return -4.3; } return v; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function tb(m, d, h) {
  if (d > 0.000001) { return (h - m) / d; }
  if (d < -0.000001) { return (-h - m) / d; }
  return 1000;
}
Function ok() {
  float ux = P2.pos.x - P1.pos.x; float uy = P2.pos.y - P1.pos.y; float uz = P2.pos.z - P1.pos.z;
  float vx = P3.pos.x - P1.pos.x; float vy = P3.pos.y - P1.pos.y; float vz = P3.pos.z - P1.pos.z;
  float cx = uy * vz - uz * vy; float cy = uz * vx - ux * vz; float cz = ux * vy - uy * vx;
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float dz = B.pos.z - A.pos.z;
  return sqrt(cx * cx + cy * cy + cz * cz) >= 3 && dx * dx + dy * dy + dz * dz >= 2.25;
}

Start {
  p1x = P1.pos.x; p1y = P1.pos.y; p1z = P1.pos.z; p2x = P2.pos.x; p2y = P2.pos.y; p2z = P2.pos.z;
  p3x = P3.pos.x; p3y = P3.pos.y; p3z = P3.pos.z; pax = A.pos.x; pay = A.pos.y; paz = A.pos.z;
  pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
}

Update {
  // Точки не выходят за поле (движок в 3D их не удерживает): лишнее срезается по осям.
  if (abs(P1.pos.x) > 4.3 || abs(P1.pos.y) > 4.3 || abs(P1.pos.z) > 4.3) { P1.pos.x = cl4(P1.pos.x); P1.pos.y = cl4(P1.pos.y); P1.pos.z = cl4(P1.pos.z); }
  if (abs(P2.pos.x) > 4.3 || abs(P2.pos.y) > 4.3 || abs(P2.pos.z) > 4.3) { P2.pos.x = cl4(P2.pos.x); P2.pos.y = cl4(P2.pos.y); P2.pos.z = cl4(P2.pos.z); }
  if (abs(P3.pos.x) > 4.3 || abs(P3.pos.y) > 4.3 || abs(P3.pos.z) > 4.3) { P3.pos.x = cl4(P3.pos.x); P3.pos.y = cl4(P3.pos.y); P3.pos.z = cl4(P3.pos.z); }
  if (abs(A.pos.x) > 4.3 || abs(A.pos.y) > 4.3 || abs(A.pos.z) > 4.3) { A.pos.x = cl4(A.pos.x); A.pos.y = cl4(A.pos.y); A.pos.z = cl4(A.pos.z); }
  if (abs(B.pos.x) > 4.3 || abs(B.pos.y) > 4.3 || abs(B.pos.z) > 4.3) { B.pos.x = cl4(B.pos.x); B.pos.y = cl4(B.pos.y); B.pos.z = cl4(B.pos.z); }
  if (ok()) {
    p1x = P1.pos.x; p1y = P1.pos.y; p1z = P1.pos.z; p2x = P2.pos.x; p2y = P2.pos.y; p2z = P2.pos.z;
    p3x = P3.pos.x; p3y = P3.pos.y; p3z = P3.pos.z; pax = A.pos.x; pay = A.pos.y; paz = A.pos.z;
    pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
  } else {
    P1.pos.x = p1x; P1.pos.y = p1y; P1.pos.z = p1z; P2.pos.x = p2x; P2.pos.y = p2y; P2.pos.z = p2z;
    P3.pos.x = p3x; P3.pos.y = p3y; P3.pos.z = p3z; A.pos.x = pax; A.pos.y = pay; A.pos.z = paz;
    B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz;
  }
  float ux = P2.pos.x - P1.pos.x; float uy = P2.pos.y - P1.pos.y; float uz = P2.pos.z - P1.pos.z;
  float vx = P3.pos.x - P1.pos.x; float vy = P3.pos.y - P1.pos.y; float vz = P3.pos.z - P1.pos.z;
  float nx = uy * vz - uz * vy; float ny = uz * vx - ux * vz; float nz = ux * vy - uy * vx;
  float nl = sqrt(nx * nx + ny * ny + nz * nz);
  nx = nx / nl; ny = ny / nl; nz = nz / nl;
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float dz = B.pos.z - A.pos.z;
  float dl = sqrt(dx * dx + dy * dy + dz * dz);
  float sn = abs(nx * dx + ny * dy + nz * dz) / dl;
  // Почти параллельно: точку B кладём в плоскость через A, параллельную α.
  if (sn < 0.035 && sn > 0.0001) {
    float k = nx * dx + ny * dy + nz * dz;
    B.pos.x = B.pos.x - k * nx; B.pos.y = B.pos.y - k * ny; B.pos.z = B.pos.z - k * nz;
    dx = B.pos.x - A.pos.x; dy = B.pos.y - A.pos.y; dz = B.pos.z - A.pos.z;
    sn = 0;
  }
  float sA = nx * (A.pos.x - P1.pos.x) + ny * (A.pos.y - P1.pos.y) + nz * (A.pos.z - P1.pos.z);
  float sB = nx * (B.pos.x - P1.pos.x) + ny * (B.pos.y - P1.pos.y) + nz * (B.pos.z - P1.pos.z);
  dl = sqrt(dx * dx + dy * dy + dz * dz);
  float ux1 = dx / dl; float uy1 = dy / dl; float uz1 = dz / dl;
  float t1 = min(tb(A.pos.x, -ux1, 4.3), tb(A.pos.y, -uy1, 4.3), tb(A.pos.z, -uz1, 4.3));
  float t2 = min(tb(A.pos.x, ux1, 4.3), tb(A.pos.y, uy1, 4.3), tb(A.pos.z, uz1, 4.3));
  L1.pos.x = A.pos.x - ux1 * t1; L1.pos.y = A.pos.y - uy1 * t1; L1.pos.z = A.pos.z - uz1 * t1;
  L2.pos.x = A.pos.x + ux1 * t2; L2.pos.y = A.pos.y + uy1 * t2; L2.pos.z = A.pos.z + uz1 * t2;

  par = 0; showX = 0;
  float state = 0;
  if (sn < 0.0001 && abs(sA) < 0.15) { state = 1; }
  if (sn < 0.0001 && abs(sA) >= 0.15) { state = 2; par = 1; }
  if (sn >= 0.0001) {
    float s = -sA / (nx * ux1 + ny * uy1 + nz * uz1);
    X.pos.x = A.pos.x + ux1 * s; X.pos.y = A.pos.y + uy1 * s; X.pos.z = A.pos.z + uz1 * s;
    if (abs(X.pos.x) < 4.3 && abs(X.pos.y) < 4.3 && abs(X.pos.z) < 4.3) { showX = 1; }
  }
  if (par > 0.5) {
    FA.pos.x = A.pos.x - sA * nx; FA.pos.y = A.pos.y - sA * ny; FA.pos.z = A.pos.z - sA * nz;
    FB.pos.x = B.pos.x - sB * nx; FB.pos.y = B.pos.y - sB * ny; FB.pos.z = B.pos.z - sB * nz;
  }

  info = "**Параллельность прямой и плоскости.** Прямая a = AB и плоскость α = P1P2P3 возможны в трёх взаимных расположениях: прямая пересекает плоскость в одной точке, лежит в ней или не имеет с ней общих точек — тогда a ∥ α.\n\n";
  if (state == 2) {
    info = info + "Сейчас **a ∥ α**: общих точек нет, направляющий вектор AB лежит в плоскости, параллельной α. Расстояние от точки прямой до плоскости постоянно: от A — " + num(abs(sA), 2) + ", от B — " + num(abs(sB), 2) + ".";
  } else if (state == 1) {
    info = info + "Сейчас прямая a **лежит в плоскости α** (расстояние от A до α равно " + num(abs(sA), 2) + "), у них бесконечно много общих точек — это не параллельность.";
  } else {
    info = info + "Сейчас прямая a **пересекает плоскость** α в одной точке X; угол между прямой и плоскостью — " + num(asin(sn) * 180 / pi, 1) + "°. Общие точки есть — параллельности нет.";
    if (showX < 0.5) { info = info + " Точка X лежит вне поля."; }
  }
}
]
