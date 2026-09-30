[
description = "{info}"

field width = 12; field height = 12; field depth = 12;
show grid = false; show axes = false;
camera start rot = (-30, 66);
camera start zoom = 1.3;

// Плоскость изображения z = 0; центр проецирования S перед ней (z > 0), объекты — за ней (z < 0).
new Point3D { name = "G1"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "G2"; pos = (1, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "G3"; pos = (0, 1, 0); dynamic = false; collision = false; active = false }
draw InfPlane { name = "pi"; points = (G1, G2, G3); size = 4.6; opacity = 0.1; color = #22c55e }

new Point3D { name = "S"; pos = (0.5, 1.2, 4.5); text = true("S"); pauseOnDrag = false }
new Point3D { name = "A"; pos = (-2.5, 0.3, -1.5); text = true("A"); pauseOnDrag = false }
new Point3D { name = "B"; pos = (-0.5, 0.3, -4.5); text = true("B"); pauseOnDrag = false }
new Point3D { name = "C"; pos = (-2.5, -2, -1.5); text = true("C"); pauseOnDrag = false }
new Point3D { name = "D"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D") }
new Point3D { name = "M"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M") }
new Point3D { name = "A1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("A′") }
new Point3D { name = "B1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("B′") }
new Point3D { name = "C1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("C′") }
new Point3D { name = "D1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("D′") }
new Point3D { name = "M1"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("M′") }
new Point3D { name = "V"; pos = (0, 0, 0); dynamic = false; collision = false; text = true("V"); active = vs > 0.5 }
new Point3D { name = "EA"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }
new Point3D { name = "EC"; pos = (0, 0, 0); dynamic = false; collision = false; active = false }

// Проектирующие лучи (из S через точки объекта), объекты и их образы.
new Line3D { name = "rA"; pos = (S, A); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "rB"; pos = (S, B); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "rC"; pos = (S, C); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "rD"; pos = (S, D); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "rM"; pos = (S, M); interact = false; thickness = 1; color = #22c55e }
new Line3D { name = "rV"; pos = (S, V); interact = false; thickness = 1; color = #22c55e; active = vs > 0.5 }
new Line3D { name = "ab"; pos = (A, B); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "cd"; pos = (C, D); interact = false; thickness = 4; color = #3b82f6 }
new Line3D { name = "ia"; pos = (A1, EA); interact = false; thickness = 1.5; color = #f59e0b }
new Line3D { name = "ic"; pos = (C1, EC); interact = false; thickness = 1.5; color = #f59e0b }
new Line3D { name = "iab"; pos = (A1, B1); interact = false; thickness = 4; color = #f59e0b }
new Line3D { name = "icd"; pos = (C1, D1); interact = false; thickness = 4; color = #f59e0b }
new UI { name = "sM"; type = slider; label = "точка M на отрезке AB: AM : AB"; variable = m; min = 0.1; max = 0.9; step = 0.05; default = 0.5 }

string info = "";
float m = 0.5; float vs = 0;
float qsx = 0.5; float qsy = 1.2; float qsz = 4.5; float qax = -2.5; float qay = 0.3; float qaz = -1.5;
float qbx = -0.5; float qby = 0.3; float qbz = -4.5; float qcx = -2.5; float qcy = -2; float qcz = -1.5;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
// Проекция точки (x, y, z) из центра (sx, sy, sz) на плоскость z = 0: t — доля пути от S до точки.
Function pt(sz, pz) { return sz / (sz - pz); }
Function dist(ax, ay, az, bx, by, bz) { return sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by) + (az - bz) * (az - bz)); }
// Допустимо: центр перед плоскостью, объекты за ней, всё в пределах поля, отрезки не вырождены.
Function okP(sx, sy, sz, ax, ay, az, bx, by, bz, cx, cy, cz, dz) {
  if (sz < 1 || sz > 5.6 || abs(sx) > 5.6 || abs(sy) > 5.6) { return 0; }
  if (az > -0.4 || bz > -0.4 || cz > -0.4 || dz > -0.4) { return 0; }
  if (az < -5.6 || bz < -5.6 || cz < -5.6 || dz < -5.6) { return 0; }
  if (abs(ax) > 5.6 || abs(bx) > 5.6 || abs(cx) > 5.6 || abs(ay) > 5.6 || abs(by) > 5.6 || abs(cy) > 5.6) { return 0; }
  if (abs(ax + cx - bx) > 5.6 || abs(ay + cy - by) > 5.6) { return 0; }
  if (dist(ax, ay, az, bx, by, bz) < 1.2) { return 0; }
  if (dist(ax, ay, az, cx, cy, cz) < 0.8) { return 0; }
  return 1;
}

Update {
  float dx = B.pos.x - A.pos.x; float dy = B.pos.y - A.pos.y; float dz = B.pos.z - A.pos.z;
  float ok = okP(S.pos.x, S.pos.y, S.pos.z, A.pos.x, A.pos.y, A.pos.z, B.pos.x, B.pos.y, B.pos.z, C.pos.x, C.pos.y, C.pos.z, C.pos.z + dz);
  if (ok < 0.5) {
    S.pos.x = qsx; S.pos.y = qsy; S.pos.z = qsz; A.pos.x = qax; A.pos.y = qay; A.pos.z = qaz;
    B.pos.x = qbx; B.pos.y = qby; B.pos.z = qbz; C.pos.x = qcx; C.pos.y = qcy; C.pos.z = qcz;
    dx = B.pos.x - A.pos.x; dy = B.pos.y - A.pos.y; dz = B.pos.z - A.pos.z;
  } else {
    qsx = S.pos.x; qsy = S.pos.y; qsz = S.pos.z; qax = A.pos.x; qay = A.pos.y; qaz = A.pos.z;
    qbx = B.pos.x; qby = B.pos.y; qbz = B.pos.z; qcx = C.pos.x; qcy = C.pos.y; qcz = C.pos.z;
  }
  float sx = S.pos.x; float sy = S.pos.y; float sz = S.pos.z;
  // D = C + (B − A): прямая CD параллельна AB; M делит AB в отношении m.
  D.pos.x = C.pos.x + dx; D.pos.y = C.pos.y + dy; D.pos.z = C.pos.z + dz;
  M.pos.x = A.pos.x + m * dx; M.pos.y = A.pos.y + m * dy; M.pos.z = A.pos.z + m * dz;
  float ta = pt(sz, A.pos.z); float tb = pt(sz, B.pos.z); float tc = pt(sz, C.pos.z); float td = pt(sz, D.pos.z); float tm = pt(sz, M.pos.z);
  A1.pos.x = sx + ta * (A.pos.x - sx); A1.pos.y = sy + ta * (A.pos.y - sy); A1.pos.z = 0;
  B1.pos.x = sx + tb * (B.pos.x - sx); B1.pos.y = sy + tb * (B.pos.y - sy); B1.pos.z = 0;
  C1.pos.x = sx + tc * (C.pos.x - sx); C1.pos.y = sy + tc * (C.pos.y - sy); C1.pos.z = 0;
  D1.pos.x = sx + td * (D.pos.x - sx); D1.pos.y = sy + td * (D.pos.y - sy); D1.pos.z = 0;
  M1.pos.x = sx + tm * (M.pos.x - sx); M1.pos.y = sy + tm * (M.pos.y - sy); M1.pos.z = 0;
  // Точка схода V: след луча из S, параллельного AB (существует, если AB не параллельна плоскости изображения).
  vs = 0;
  float par = 0; if (abs(dz) < 0.15) { par = 1; }
  float ex = 0; float ey = 0; float fx = 0; float fy = 0;
  if (par < 0.5) {
    float mu = -sz / dz;
    V.pos.x = sx + mu * dx; V.pos.y = sy + mu * dy; V.pos.z = 0;
    if (abs(V.pos.x) < 5.8 && abs(V.pos.y) < 5.8) { vs = 1; }
    ex = V.pos.x - A1.pos.x; ey = V.pos.y - A1.pos.y; fx = V.pos.x - C1.pos.x; fy = V.pos.y - C1.pos.y;
  } else {
    ex = dx; ey = dy; fx = dx; fy = dy;
  }
  // Образы прямых продолжаются до V (или на длину 8, если V далеко / нет).
  float el = sqrt(ex * ex + ey * ey); if (el < 0.001) { el = 0.001; }
  float fl = sqrt(fx * fx + fy * fy); if (fl < 0.001) { fl = 0.001; }
  float k = 8; float k2 = 8; if (vs > 0.5) { k = el; k2 = fl; }
  EA.pos.x = A1.pos.x + ex / el * k; EA.pos.y = A1.pos.y + ey / el * k; EA.pos.z = 0;
  EC.pos.x = C1.pos.x + fx / fl * k2; EC.pos.y = C1.pos.y + fy / fl * k2; EC.pos.z = 0;
  float ab = dist(A.pos.x, A.pos.y, A.pos.z, B.pos.x, B.pos.y, B.pos.z);
  float ab1 = dist(A1.pos.x, A1.pos.y, 0, B1.pos.x, B1.pos.y, 0);
  float am1 = dist(A1.pos.x, A1.pos.y, 0, M1.pos.x, M1.pos.y, 0); float mb1 = dist(M1.pos.x, M1.pos.y, 0, B1.pos.x, B1.pos.y, 0);
  info = "**Центральное проецирование**: каждая точка X переходит в X′ — точку пересечения луча SX с плоскостью изображения (зелёная плоскость). Прямые AB и CD параллельны (D = C + AB), их образы — жёлтые отрезки A′B′ и C′D′.";
  if (par > 0.5) {
    info = info + "\n\nПрямая AB (почти) параллельна плоскости изображения: её образ параллелен ей самой, **точки схода нет**, образы AB и CD остаются параллельными.";
  } else {
    info = info + "\n\nЛуч, проведённый из S параллельно AB, пересекает плоскость изображения в точке схода **V(" + num(V.pos.x, 2) + "; " + num(V.pos.y, 2) + ")**: образы параллельных прямых AB и CD сходятся в V.";
  }
  info = info + "\n\nОтношение длин не сохраняется: AM : MB = " + format(m / (1 - m), 3) + ", а A′M′ : M′B′ = **" + format(am1 / mb1, 3) + "**; длина AB = " + format(ab, 2) + " переходит в A′B′ = " + format(ab1, 2) + ". Прямая, не проходящая через S, снова переходит в прямую.";
}
]
