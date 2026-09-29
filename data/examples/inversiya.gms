[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Центр инверсии O, окружность инверсии ω радиуса √k, точка M и её образ M′ ----
new Point { name = "O"; pos = (0, 0); text = true("O"); pauseOnDrag = false }
float k = 6; float rad = 2.45;
new Circle { name = "omega"; center = O; radius = rad; thickness = 2 }
new Point { name = "M"; pos = (4, 1.5); text = true("M"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "M2"; pos = (0, 0); dynamic = false; collision = false; text = true("M′"); color = #3b82f6 }
new Point { name = "T"; pos = (0, 0); dynamic = false; collision = false; size = 0.6 }
new Line { name = "ray"; pos = (O, M2); interact = false }
new Line { name = "ray2"; pos = (O, M); interact = false }
new Line { name = "tOT"; pos = (O, T); interact = false; active = act > 0.5 }
new Line { name = "tTM"; pos = (T, M); interact = false; active = act > 0.5 }
new Line { name = "tTM2"; pos = (T, M2); interact = false; active = act > 0.5 }
new UI { type = slider; label = "k"; variable = k; min = 2; max = 16; step = 0.5; default = 6 }

string info = ""; float act = 0; float lx = 4; float ly = 1.5; float lox = 0; float loy = 0; float lk = 6;

// Наибольшее расстояние от точки (ox, oy) вдоль единичного луча (ux, uy) до границы поля
Function rayMax(ox, oy, ux, uy) {
  float fx = fieldMaxX - 0.3; float fy = fieldMaxY - 0.3; float m = 1000;
  if (ux > 0.0001) { m = min(m, (fx - ox) / ux); }
  if (ux < -0.0001) { m = min(m, (-fx - ox) / ux); }
  if (uy > 0.0001) { m = min(m, (fy - oy) / uy); }
  if (uy < -0.0001) { m = min(m, (-fy - oy) / uy); }
  return m;
}
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  rad = sqrt(k);
  // ω целиком в поле
  float bx = fieldMaxX - rad - 0.3; float by = fieldMaxY - rad - 0.3;
  if (O.pos.x > bx) { O.pos.x = bx; }
  if (O.pos.x < -bx) { O.pos.x = -bx; }
  if (O.pos.y > by) { O.pos.y = by; }
  if (O.pos.y < -by) { O.pos.y = -by; }
  float ox = O.pos.x; float oy = O.pos.y;
  float dx = M.pos.x - ox; float dy = M.pos.y - oy; float d = sqrt(dx * dx + dy * dy);
  if (d < 0.0001) { dx = 1; dy = 0; d = 1; }
  float ux = dx / d; float uy = dy / d;
  // Точка M и образ M′ — оба в поле, M не в центре: d ∈ [k / rayMax, rayMax]
  float far = rayMax(ox, oy, ux, uy); float dmin = max(0.5, k / far); float dmax = far;
  float nd = min(max(d, dmin), dmax);
  if (dmin > dmax) { M.pos.x = lx; M.pos.y = ly; O.pos.x = lox; O.pos.y = loy; k = lk; ox = lox; oy = loy; dx = lx - ox; dy = ly - oy; d = sqrt(dx * dx + dy * dy); ux = dx / d; uy = dy / d; nd = d; }
  if (abs(nd - d) > 0.000001) { M.pos.x = ox + ux * nd; M.pos.y = oy + uy * nd; d = nd; }
  lx = M.pos.x; ly = M.pos.y; lox = ox; loy = oy; lk = k;
  float d2 = k / d;
  M2.pos.x = ox + ux * d2; M2.pos.y = oy + uy * d2;
  // Построение: T ∈ ω над ближайшей к O из точек M, M′; тогда OT ⊥ TQ и OP · OQ = OT²
  float p = min(d, d2);
  act = 0;
  if (abs(d - rad) > 0.08) { act = 1; T.pos.x = ox + ux * p - uy * sqrt(max(k - p * p, 0)); T.pos.y = oy + uy * p + ux * sqrt(max(k - p * p, 0)); }
  string pos = "лежит на окружности ω и совпадает со своим образом";
  if (d < rad - 0.08) { pos = "лежит внутри ω, образ — снаружи"; }
  if (d > rad + 0.08) { pos = "лежит вне ω, образ — внутри"; }
  info = "**Инверсия** с центром O и степенью k = " + format(k, 1) + " (радиус окружности инверсии √k = " + format(rad, 2) + ") переводит M в точку M′ того же луча OM с OM · OM′ = k.\n\nOM · OM′ = " + format(d, 2) + " · " + format(d2, 2) + " = " + format(d * d2, 2) + ". Точка M " + pos + ".\n\nПостроение: в прямоугольном треугольнике OTQ с прямым углом при T катет OT = √k, а OP · OQ = OT² = k, где P — ближайшая к O из точек M, M′.";
}
]
