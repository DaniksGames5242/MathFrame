[
description = "{info}"

field width = 9; field height = 9; field depth = 9;
show grid = false; show axes = false;
camera start rot = (35, 62);
camera start zoom = 1.15;

// Плоскость α: Ax + By + Cz + D = 0 (коэффициенты — ползунки), точка P перетаскивается.
// H — основание перпендикуляра PH (зелёный); X — точка плоскости на расстоянии r от H (жёлтая наклонная PX).
new Point3D { name = "P"; pos = (1.5, 2.5, 1); text = true("P"); pauseOnDrag = false }
new Point3D { name = "H"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("H") }
new Point3D { name = "X"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("X"); active = showX }
new Point3D { name = "Pa"; pos = (2, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "Pb"; pos = (-1, 0, 1.7); dynamic = false; collision = false; active = false }
new Point3D { name = "Pc"; pos = (-1, 0, -1.7); dynamic = false; collision = false; active = false }

draw InfPlane { name = "alpha"; points = (Pa, Pb, Pc); size = 3.6; opacity = 0.2; color = #3b82f6 }
new Line3D { name = "perp"; pos = (P, H); interact = false; thickness = 4; color = #22c55e }
new Line3D { name = "obl"; pos = (P, X); interact = false; thickness = 3; color = #f59e0b; active = showX }
new Line3D { name = "inpl"; pos = (H, X); interact = false; thickness = 2; active = showX }
new Angle3D { name = "rt"; type = pointAngle; vertex = H; point1 = P; point2 = X; radius = 0.6; active = showX }

new UI { name = "sA"; type = slider; label = "A"; variable = ca; min = -3; max = 3; step = 1; default = 1 }
new UI { name = "sB"; type = slider; label = "B"; variable = cb; min = -3; max = 3; step = 1; default = 2 }
new UI { name = "sC"; type = slider; label = "C"; variable = cc; min = -3; max = 3; step = 1; default = 1 }
new UI { name = "sD"; type = slider; label = "D"; variable = cd; min = -4; max = 4; step = 1; default = -1 }
new UI { name = "sR"; type = slider; label = "расстояние HX в плоскости"; variable = rr; min = 0; max = 3; step = 0.1; default = 1.5 }

string info = "";
float ca = 1; float cb = 2; float cc = 1; float cd = -1; float rr = 1.5; float showX = 1;
float hx = 4.3; float ppx = 1.5; float ppy = 2.5; float ppz = 1;

Function num(x, d) { if (abs(x) < 0.005) { return "0"; } if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function sgn(x) { if (x < 0) { return "− "; } return "+ "; }

Update {
  if (abs(P.pos.x) <= hx && abs(P.pos.y) <= hx && abs(P.pos.z) <= hx) {
    ppx = P.pos.x; ppy = P.pos.y; ppz = P.pos.z;
  } else {
    P.pos.x = ppx; P.pos.y = ppy; P.pos.z = ppz;
  }
  // Нормаль (A, B, C); при нулевом наборе берём (0, 1, 0), в тексте это оговорено.
  float a = ca; float b = cb; float c = cc; float zero = 0;
  if (a * a + b * b + c * c < 0.5) { b = 1; zero = 1; }
  float n2 = a * a + b * b + c * c; float nl = sqrt(n2);
  float nx = a / nl; float ny = b / nl; float nz = c / nl;
  // Базис плоскости: e1 ⟂ n, e2 = n × e1.
  float e1x = -nz; float e1y = 0; float e1z = nx;
  if (sqrt(e1x * e1x + e1z * e1z) < 0.3) { e1x = 0; e1y = nz; e1z = -ny; }
  float el = sqrt(e1x * e1x + e1y * e1y + e1z * e1z); e1x = e1x / el; e1y = e1y / el; e1z = e1z / el;
  float e2x = ny * e1z - nz * e1y; float e2y = nz * e1x - nx * e1z; float e2z = nx * e1y - ny * e1x;
  float k = -cd / nl;
  float ox = k * nx; float oy = k * ny; float oz = k * nz;
  Pa.pos.x = ox + 2 * e1x; Pa.pos.y = oy + 2 * e1y; Pa.pos.z = oz + 2 * e1z;
  Pb.pos.x = ox - e1x + 1.7 * e2x; Pb.pos.y = oy - e1y + 1.7 * e2y; Pb.pos.z = oz - e1z + 1.7 * e2z;
  Pc.pos.x = ox - e1x - 1.7 * e2x; Pc.pos.y = oy - e1y - 1.7 * e2y; Pc.pos.z = oz - e1z - 1.7 * e2z;

  float num0 = a * P.pos.x + b * P.pos.y + c * P.pos.z + cd;
  float sg = num0 / nl;
  H.pos.x = P.pos.x - sg * nx; H.pos.y = P.pos.y - sg * ny; H.pos.z = P.pos.z - sg * nz;
  X.pos.x = H.pos.x + rr * e1x; X.pos.y = H.pos.y + rr * e1y; X.pos.z = H.pos.z + rr * e1z;
  showX = 0;
  if (rr > 0.05 && abs(sg) > 0.05) { showX = 1; }
  float d = abs(sg);
  float px = sqrt(d * d + rr * rr);

  info = "**Расстояние от точки до плоскости** — длина перпендикуляра PH, опущенного из точки P на плоскость α; H — ортогональная проекция P на α.\n\n";
  info = info + "α: " + num(a, 0) + "x " + sgn(b) + format(abs(b), 0) + "y " + sgn(c) + format(abs(c), 0) + "z " + sgn(cd) + format(abs(cd), 0) + " = 0";
  if (zero > 0.5) { info = info + " (A, B, C не все нули; при нулевом наборе взята нормаль (0; 1; 0))"; }
  info = info + ", P(" + num(P.pos.x, 2) + "; " + num(P.pos.y, 2) + "; " + num(P.pos.z, 2) + ").\n\n";
  info = info + "**d = |Ax₀ + By₀ + Cz₀ + D| / √(A² + B² + C²) = |" + num(num0, 2) + "| / " + format(nl, 2) + " = " + format(d, 2) + "**.\n\n";
  if (d < 0.05) {
    info = info + "Точка лежит на плоскости: расстояние равно нулю.";
  } else {
    string cmp = " > ";
    if (px < d + 0.0005) { cmp = " = "; }
    info = info + "Любая наклонная PX длиннее перпендикуляра: при HX = " + format(rr, 1) + " получаем PX = √(d² + HX²) = " + format(px, 2) + cmp + format(d, 2) + ". Знак " + num(sg, 2) + " показывает, по какую сторону от плоскости лежит P.";
  }
}
]
