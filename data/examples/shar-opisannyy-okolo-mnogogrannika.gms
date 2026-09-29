[
description = "{info}"

field width = 16; field height = 16; field depth = 16;
show grid = false; show axes = false;
camera start rot = (25, 65);
camera start zoom = 1.5;

new Point3D { name = "A"; pos = (-2.5, -2, 1.5); pauseOnDrag = false; text = true("A") }
new Point3D { name = "B"; pos = (2.5, -2.5, 1); pauseOnDrag = false; text = true("B") }
new Point3D { name = "C"; pos = (0.5, -1.5, -2.5); pauseOnDrag = false; text = true("C") }
new Point3D { name = "D"; pos = (0, 2.5, 0); pauseOnDrag = false; text = true("D") }
new Point3D { name = "O"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.6; text = true("O"); color = #f59e0b }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; text = true("M"); color = #22c55e }
new Point3D { name = "W"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.1 }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 3 }
new Line3D { name = "ac"; pos = (A, C); interact = false; thickness = 3 }
new Line3D { name = "ad"; pos = (A, D); interact = false; thickness = 3 }
new Line3D { name = "bc"; pos = (B, C); interact = false; thickness = 3 }
new Line3D { name = "bd"; pos = (B, D); interact = false; thickness = 3 }
new Line3D { name = "cd"; pos = (C, D); interact = false; thickness = 3 }
new Line3D { name = "oa"; pos = (O, A); interact = false; thickness = 1.5; color = #f59e0b }
new Line3D { name = "ob"; pos = (O, B); interact = false; thickness = 1.5; color = #f59e0b }
new Line3D { name = "oc"; pos = (O, C); interact = false; thickness = 1.5; color = #f59e0b }
new Line3D { name = "od"; pos = (O, D); interact = false; thickness = 1.5; color = #f59e0b }
new Line3D { name = "om"; pos = (O, M); interact = false; thickness = 2; color = #22c55e }
draw InfPlane { name = "bis"; points = (M, O, W); size = 2.2; opacity = 0.15; color = #22c55e }
draw Surface { name = "sph"; type = parametric; x = "Ox + Rr * sin(pi * u) * cos(6.283185 * v)"; y = "Oy + Rr * cos(pi * u)"; z = "Oz + Rr * sin(pi * u) * sin(6.283185 * v)"; umin = 0; umax = 1; vmin = 0; vmax = 1; grid = 32; color = #3b82f6; opacity = 0.12 }

string info = "";
float Ox = 0; float Oy = 0; float Oz = 0; float Rr = 1; float dt = 0; float ok = 1;
float pax = -2.5; float pay = -2; float paz = 1.5; float pbx = 2.5; float pby = -2.5; float pbz = 1;
float pcx = 0.5; float pcy = -1.5; float pcz = -2.5; float pdx = 0; float pdy = 2.5; float pdz = 0;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function clampP(P) {
  if (P.pos.x > 3.2) { P.pos.x = 3.2; } if (P.pos.x < -3.2) { P.pos.x = -3.2; }
  if (P.pos.y > 3.2) { P.pos.y = 3.2; } if (P.pos.y < -3.2) { P.pos.y = -3.2; }
  if (P.pos.z > 3.2) { P.pos.z = 3.2; } if (P.pos.z < -3.2) { P.pos.z = -3.2; }
}
Function dist(P, Q) { return sqrt((P.pos.x - Q.pos.x) * (P.pos.x - Q.pos.x) + (P.pos.y - Q.pos.y) * (P.pos.y - Q.pos.y) + (P.pos.z - Q.pos.z) * (P.pos.z - Q.pos.z)); }
// центр описанной сферы тетраэдра ABCD: O = A + (|b|²(c×d) + |c|²(d×b) + |d|²(b×c)) / (2 b·(c×d)), b = AB, c = AC, d = AD
Function circ() {
  float bx = B.pos.x - A.pos.x; float by = B.pos.y - A.pos.y; float bz = B.pos.z - A.pos.z;
  float cx = C.pos.x - A.pos.x; float cy = C.pos.y - A.pos.y; float cz = C.pos.z - A.pos.z;
  float dx = D.pos.x - A.pos.x; float dy = D.pos.y - A.pos.y; float dz = D.pos.z - A.pos.z;
  float cdx = cy * dz - cz * dy; float cdy = cz * dx - cx * dz; float cdz = cx * dy - cy * dx;
  float dbx = dy * bz - dz * by; float dby = dz * bx - dx * bz; float dbz = dx * by - dy * bx;
  float bcx = by * cz - bz * cy; float bcy = bz * cx - bx * cz; float bcz = bx * cy - by * cx;
  dt = bx * cdx + by * cdy + bz * cdz;
  if (abs(dt) < 1.5) { ok = 0; return 0; }
  float b2 = bx * bx + by * by + bz * bz; float c2 = cx * cx + cy * cy + cz * cz; float d2 = dx * dx + dy * dy + dz * dz;
  Ox = A.pos.x + (b2 * cdx + c2 * dbx + d2 * bcx) / (2 * dt);
  Oy = A.pos.y + (b2 * cdy + c2 * dby + d2 * bcy) / (2 * dt);
  Oz = A.pos.z + (b2 * cdz + c2 * dbz + d2 * bcz) / (2 * dt);
  Rr = sqrt((Ox - A.pos.x) * (Ox - A.pos.x) + (Oy - A.pos.y) * (Oy - A.pos.y) + (Oz - A.pos.z) * (Oz - A.pos.z));
  ok = 1;
  if (Rr > 3.6 || sqrt(Ox * Ox + Oy * Oy + Oz * Oz) + Rr > 4.0) { ok = 0; }
  return 0;
}
Update {
  clampP(A); clampP(B); clampP(C); clampP(D);
  circ();
  if (ok < 0.5) {
    A.pos.x = pax; A.pos.y = pay; A.pos.z = paz; B.pos.x = pbx; B.pos.y = pby; B.pos.z = pbz;
    C.pos.x = pcx; C.pos.y = pcy; C.pos.z = pcz; D.pos.x = pdx; D.pos.y = pdy; D.pos.z = pdz;
    circ();
  } else {
    pax = A.pos.x; pay = A.pos.y; paz = A.pos.z; pbx = B.pos.x; pby = B.pos.y; pbz = B.pos.z;
    pcx = C.pos.x; pcy = C.pos.y; pcz = C.pos.z; pdx = D.pos.x; pdy = D.pos.y; pdz = D.pos.z;
  }
  O.pos.x = Ox; O.pos.y = Oy; O.pos.z = Oz;
  M.pos.x = (A.pos.x + B.pos.x) / 2; M.pos.y = (A.pos.y + B.pos.y) / 2; M.pos.z = (A.pos.z + B.pos.z) / 2;
  float ex = B.pos.x - A.pos.x; float ey = B.pos.y - A.pos.y; float ez = B.pos.z - A.pos.z;
  float mx = Ox - M.pos.x; float my = Oy - M.pos.y; float mz = Oz - M.pos.z;
  float vx = ey * mz - ez * my; float vy = ez * mx - ex * mz; float vz = ex * my - ey * mx;
  if (abs(vx) + abs(vy) + abs(vz) < 0.01) { vx = ey * 0 - ez * 1; vy = ez * 0 - ex * 0; vz = ex * 1 - ey * 0; }
  float vl = sqrt(vx * vx + vy * vy + vz * vz);
  W.pos.x = M.pos.x + vx / vl; W.pos.y = M.pos.y + vy / vl; W.pos.z = M.pos.z + vz / vl;
  float dot = ex * mx + ey * my + ez * mz;
  info = "**Описанная сфера** тетраэдра ABCD — единственная сфера, проходящая через все его вершины. Для тетраэдра она существует всегда: четыре точки, не лежащие в одной плоскости, определяют сферу однозначно.\n\n";
  info = info + "Центр O равноудалён от вершин: OA = " + format(dist(O, A), 2) + ", OB = " + format(dist(O, B), 2) + ", OC = " + format(dist(O, C), 2) + ", OD = " + format(dist(O, D), 2) + " — это радиус R = " + format(Rr, 2) + ".\n\n";
  info = info + "Центр лежит в пересечении серединных перпендикулярных плоскостей к рёбрам. Для ребра AB (плоскость зелёная, M — середина AB): OM · AB = " + num(dot, 2) + ", то есть OM ⟂ AB, и O равноудалён от A и B. Центр " + "O = (" + num(Ox, 1) + "; " + num(Oy, 1) + "; " + num(Oz, 1) + ").";
}
]
