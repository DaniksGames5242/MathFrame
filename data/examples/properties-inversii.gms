[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Общее: центр O = (0, 0), окружность инверсии ω радиуса √k ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
float k = 6; float rad = 2.45; int tab = 1;
new Circle { name = "omega"; center = O; radius = rad; thickness = 2 }
new UI { type = slider; label = "k"; variable = k; min = 2; max = 12; step = 0.5; default = 6 }

// ---- Вкладка 1: инволютивность — M → M′ → M″ = M ----
new Point { name = "M"; pos = (4, 1.5); text = true("M"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "M2"; pos = (0, 0); dynamic = false; collision = false; text = true("M′"); color = #3b82f6 }
new Line { name = "ray"; pos = (O, M2); interact = false }
new Line { name = "ray2"; pos = (O, M); interact = false }
new Claster { name = "t1"; elements = (M, M2, ray, ray2); active = true }

// ---- Вкладка 2: конформность — две прямые через P и их образы (окружности через O) ----
new Point { name = "P"; pos = (2.5, 2.5); text = true("P"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "P2"; pos = (0, 0); dynamic = false; collision = false; text = true("P′"); color = #3b82f6 }
new Point { name = "a1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "b1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "a2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "b2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "l1"; pos = (a1, b1); color = #f59e0b; interact = false }
new Line { name = "l2"; pos = (a2, b2); color = #f59e0b; interact = false }
float al = 20; float be = 100; float cx1 = 0; float cy1 = 0; float q1 = 1; float cx2 = 0; float cy2 = 0; float q2 = 1; float dd1 = 1; float dd2 = 1;
new Curve { name = "im1"; type = parametric; x = "cx1 + q1 * cos(6.2831853 * t)"; y = "cy1 + q1 * sin(6.2831853 * t)"; segments = 160; color = #3b82f6; thickness = 2.5; active = dd1 > 0.25 }
new Curve { name = "im2"; type = parametric; x = "cx2 + q2 * cos(6.2831853 * t)"; y = "cy2 + q2 * sin(6.2831853 * t)"; segments = 160; color = #3b82f6; thickness = 2.5; active = dd2 > 0.25 }
new UI { name = "sa"; type = slider; label = "угол l₁, °"; variable = al; min = 0; max = 179; step = 1; default = 20 }
new UI { name = "sb"; type = slider; label = "угол l₂, °"; variable = be; min = 0; max = 179; step = 1; default = 100 }
new Claster { name = "t2"; elements = (P, P2, l1, l2, im1, im2, sa, sb); active = false }

// ---- Вкладка 3: окружность, ортогональная ω, переходит в себя ----
new Point { name = "S"; pos = (3.6, 0.8); text = true("S"); pauseOnDrag = false; color = #f59e0b }
float rho = 2.76;
new Circle { name = "orth"; center = S; radius = rho; color = #f59e0b; thickness = 2.5 }
new Point { name = "N"; circle = "orth"; t = 0.3; text = true("N"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "N2"; pos = (0, 0); dynamic = false; collision = false; text = true("N′"); color = #3b82f6 }
new Line { name = "rayN"; pos = (O, N2); interact = false }
new Line { name = "rayN2"; pos = (O, N); interact = false }
new Claster { name = "t3"; elements = (S, orth, N, N2, rayN, rayN2); active = false }

new UI { type = button; name = "b1"; label = "Инволютивность"; action = "tab = 1; t1.active = true; t2.active = false; t3.active = false" }
new UI { type = button; name = "b2"; label = "Конформность"; action = "tab = 2; t1.active = false; t2.active = true; t3.active = false" }
new UI { type = button; name = "b3"; label = "Ортогональная окружность"; action = "tab = 3; t1.active = false; t2.active = false; t3.active = true" }

string info = "";
float lx = 4; float ly = 1.5; float lpx = 2.5; float lpy = 2.5; float lsx = 3.6; float lsy = 0.8; float lk = 6;

Function rayMax(ox, oy, ux, uy) {
  float fx = fieldMaxX - 0.3; float fy = fieldMaxY - 0.3; float m = 1000;
  if (ux > 0.0001) { m = min(m, (fx - ox) / ux); }
  if (ux < -0.0001) { m = min(m, (-fx - ox) / ux); }
  if (uy > 0.0001) { m = min(m, (fy - oy) / uy); }
  if (uy < -0.0001) { m = min(m, (-fy - oy) / uy); }
  return m;
}
// Допустимая окружность, ортогональная ω, с центром (sx, sy): целиком в поле, центр вне ω
Function okS(sx, sy) {
  float d2 = sx * sx + sy * sy;
  if (d2 < k + 0.6) { return 0; }
  float r = sqrt(d2 - k);
  if (abs(sx) + r > fieldMaxX - 0.2 || abs(sy) + r > fieldMaxY - 0.2) { return 0; }
  return 1;
}
Function deg(x) { return x * 180 / 3.14159265; }

Update {
  rad = sqrt(k);
  // Точка, у которой точка и образ в поле, не в центре (общий приём для M и P)
  float mx = M.pos.x; float my = M.pos.y;
  if (tab == 2) { mx = P.pos.x; my = P.pos.y; }
  float d = sqrt(mx * mx + my * my);
  if (d < 0.0001) { mx = 1; my = 0; d = 1; }
  float ux = mx / d; float uy = my / d;
  float far = rayMax(0, 0, ux, uy); float dmin = max(0.5, k / far); float nd = min(max(d, dmin), far);
  if (dmin > far) { mx = lx; my = ly; if (tab == 2) { mx = lpx; my = lpy; } d = sqrt(mx * mx + my * my); ux = mx / d; uy = my / d; nd = d; }
  if (tab == 1) {
    if (abs(nd - d) > 0.000001 || dmin > far) { M.pos.x = ux * nd; M.pos.y = uy * nd; d = nd; }
    lx = M.pos.x; ly = M.pos.y;
    float d2 = k / d;
    M2.pos.x = ux * d2; M2.pos.y = uy * d2;
    // Повторная инверсия
    float e2 = M2.pos.x * M2.pos.x + M2.pos.y * M2.pos.y;
    float bx = k * M2.pos.x / e2; float by = k * M2.pos.y / e2;
    info = "**Инволютивность.** Повторная инверсия возвращает точку: OM · OM′ = k и OM′ · OM″ = k, поэтому M″ = M.\n\nM = (" + format(M.pos.x, 2) + "; " + format(M.pos.y, 2) + "), M′ = (" + format(M2.pos.x, 2) + "; " + format(M2.pos.y, 2) + "), M″ = (" + format(bx, 2) + "; " + format(by, 2) + ").\n\nПрямая и обратная инверсии совпадают. Точки самой ω (OM = √k = " + format(rad, 2) + ") неподвижны; точки внутри переходят наружу, снаружи — внутрь (сейчас OM = " + format(d, 2) + ").";
  }
  if (tab == 2) {
    if (abs(nd - d) > 0.000001 || dmin > far) { P.pos.x = ux * nd; P.pos.y = uy * nd; d = nd; }
    lpx = P.pos.x; lpy = P.pos.y;
    float px = P.pos.x; float py = P.pos.y;
    float d2 = k / d; float ppx = ux * d2; float ppy = uy * d2;
    P2.pos.x = ppx; P2.pos.y = ppy;
    float u1x = cos(al * 3.14159265 / 180); float u1y = sin(al * 3.14159265 / 180);
    float u2x = cos(be * 3.14159265 / 180); float u2y = sin(be * 3.14159265 / 180);
    a1.pos.x = px - 30 * u1x; a1.pos.y = py - 30 * u1y; b1.pos.x = px + 30 * u1x; b1.pos.y = py + 30 * u1y;
    a2.pos.x = px - 30 * u2x; a2.pos.y = py - 30 * u2y; b2.pos.x = px + 30 * u2x; b2.pos.y = py + 30 * u2y;
    // Образ прямой на расстоянии dᵢ от O — окружность с диаметром от O до образа основания перпендикуляра
    float s1 = px * (-u1y) + py * u1x; float s2 = px * (-u2y) + py * u2x;
    dd1 = abs(s1); dd2 = abs(s2);
    float g1 = 1; if (s1 < 0) { g1 = -1; } float g2 = 1; if (s2 < 0) { g2 = -1; }
    q1 = k / (2 * max(dd1, 0.0001)); q2 = k / (2 * max(dd2, 0.0001));
    cx1 = -u1y * g1 * q1; cy1 = u1x * g1 * q1; cx2 = -u2y * g2 * q2; cy2 = u2x * g2 * q2;
    string t = "";
    if (dd1 > 0.25 && dd2 > 0.25) {
      float ang = deg(acos(min(abs(u1x * u2x + u1y * u2y), 1)));
      float r1x = ppx - cx1; float r1y = ppy - cy1; float r2x = ppx - cx2; float r2y = ppy - cy2;
      float angI = deg(acos(min(abs(r1x * r2x + r1y * r2y) / (q1 * q2), 1)));
      t = "Угол между прямыми l₁ и l₂ равен " + format(ang, 1) + "°, угол между их образами — окружностями — в точке P′ равен " + format(angI, 1) + "°.";
    } else { t = "Одна из прямых проходит через O (её образ — она сама), окружность-образ вырождается в прямую."; }
    info = "**Конформность.** Инверсия сохраняет величину углов между кривыми, но меняет направление обхода: прямые l₁ и l₂ (жёлтые) пересекаются в P, а их образы (синие окружности через O) — в P′.\n\n" + t;
  }
  if (tab == 3) {
    float sx = S.pos.x; float sy = S.pos.y;
    if (okS(sx, sy) < 0.5) {
      if (okS(sx, lsy) > 0.5) { S.pos.y = lsy; sy = lsy; }
      else { if (okS(lsx, sy) > 0.5) { S.pos.x = lsx; sx = lsx; } else { S.pos.x = lsx; S.pos.y = lsy; sx = lsx; sy = lsy; } }
    }
    lsx = sx; lsy = sy;
    rho = sqrt(sx * sx + sy * sy - k);
    float nx = N.pos.x; float ny = N.pos.y; float dn = sqrt(nx * nx + ny * ny);
    float d2 = k / dn; N2.pos.x = nx * d2 / dn; N2.pos.y = ny * d2 / dn;
    float dist = sqrt((N2.pos.x - sx) ^ 2 + (N2.pos.y - sy) ^ 2);
    info = "**Окружность, ортогональная ω, переходит в себя.** Центр S на расстоянии OS = " + format(sqrt(sx * sx + sy * sy), 2) + " от O, радиус ρ = " + format(rho, 2) + ", и OS² = k + ρ² = " + format(k, 1) + " + " + format(rho * rho, 2) + " = " + format(k + rho * rho, 2) + " — это и есть ортогональность.\n\nОбраз точки N — точка N′ той же окружности: расстояние от S до N′ равно " + format(dist, 2) + " = ρ.";
  }
}
]
