[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Система Лоренца x′ = σ(y − x), y′ = x(ρ − z) − y, z′ = xy − βz; проекция на плоскость
// (x, z). Две траектории стартуют из S и из точки, сдвинутой на 0.001 по x. ----
new Curve { name = "trA"; type = parametric; x = "ax(t)"; y = "az(t)"; segments = 700; color = #3b82f6; thickness = 1.5 }
new Curve { name = "trB"; type = parametric; x = "bx(t)"; y = "bz(t)"; segments = 700; color = #f59e0b; thickness = 1.5 }
new Point { name = "PA"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6; size = 0.7; layer = 50 }
new Point { name = "PB"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; size = 0.7; layer = 50 }
new Point { name = "S"; pos = (-3, 2); text = true("S"); pauseOnDrag = false; color = #22c55e; layer = 60 }
new Point { name = "C1"; pos = (0, 0); dynamic = false; collision = false; size = 0.5; color = #6b7280; active = rho > 1 }
new Point { name = "C2"; pos = (0, 0); dynamic = false; collision = false; size = 0.5; color = #6b7280; active = rho > 1 }

new UI { name = "sR"; type = slider; label = "ρ"; variable = rho; min = 10; max = 35; step = 0.1; default = 28 }
new UI { name = "bR"; type = button; label = "Заново из S"; action = "restart = 1" }

// ---- Логика ----
float sg = 10; float be = 8 / 3; float rho = 28;
float NT = 700;
float hd = 0; float cnt = 0;
float xa = 0; float ya = 0; float za = 0; float xb = 0; float yb = 0; float zb = 0;
float lastSx = 999; float lastSy = 999; float lastRho = 0;
float restart = 1;
float tt = 0;
list XA = (0); list ZA = (0); list XB = (0); list ZB = (0);
string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
Function PX(x) { return 0.3 * x; }
Function PZ(z) { return 0.17 * (z - 25) + 0.2; }
Function idx(t) { return md(hd - cnt + floor(t * (cnt - 1) + 0.5) + NT, NT); }
Function ax(t) { if (cnt < 2) { return PX(xa); } return XA[idx(t)]; }
Function az(t) { if (cnt < 2) { return PZ(za); } return ZA[idx(t)]; }
Function bx(t) { if (cnt < 2) { return PX(xb); } return XB[idx(t)]; }
Function bz(t) { if (cnt < 2) { return PZ(zb); } return ZB[idx(t)]; }
// Шаг Рунге — Кутты 4-го порядка для одной траектории; результат — в rx, ry, rz
float rx = 0; float ry = 0; float rz = 0;
Function rk(x, y, z, h) {
  float k1x = sg * (y - x); float k1y = x * (rho - z) - y; float k1z = x * y - be * z;
  float x2 = x + h / 2 * k1x; float y2 = y + h / 2 * k1y; float z2 = z + h / 2 * k1z;
  float k2x = sg * (y2 - x2); float k2y = x2 * (rho - z2) - y2; float k2z = x2 * y2 - be * z2;
  float x3 = x + h / 2 * k2x; float y3 = y + h / 2 * k2y; float z3 = z + h / 2 * k2z;
  float k3x = sg * (y3 - x3); float k3y = x3 * (rho - z3) - y3; float k3z = x3 * y3 - be * z3;
  float x4 = x + h * k3x; float y4 = y + h * k3y; float z4 = z + h * k3z;
  float k4x = sg * (y4 - x4); float k4y = x4 * (rho - z4) - y4; float k4z = x4 * y4 - be * z4;
  rx = x + h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x);
  ry = y + h / 6 * (k1y + 2 * k2y + 2 * k3y + k4y);
  rz = z + h / 6 * (k1z + 2 * k2z + 2 * k3z + k4z);
  return 0;
}

Update {
  if (len(XA) < NT) { repeat (NT - 1) { push(XA, 0); push(ZA, 0); push(XB, 0); push(ZB, 0); } }
  S.pos.x = max(-6.5, min(6.5, S.pos.x)); S.pos.y = max(-4.2, min(4.2, S.pos.y));
  if (S.pos.x != lastSx || S.pos.y != lastSy || rho != lastRho) { restart = 1; }
  if (restart == 1) {
    xa = S.pos.x / 0.3; ya = xa; za = (S.pos.y - 0.2) / 0.17 + 25;
    xb = xa + 0.001; yb = ya; zb = za;
    hd = 0; cnt = 0; tt = 0;
    lastSx = S.pos.x; lastSy = S.pos.y; lastRho = rho; restart = 0;
  }
  // 5 шагов по 0.008 за кадр
  repeat (5) {
    rk(xa, ya, za, 0.008); xa = rx; ya = ry; za = rz;
    rk(xb, yb, zb, 0.008); xb = rx; yb = ry; zb = rz;
    XA[hd] = PX(xa); ZA[hd] = PZ(za); XB[hd] = PX(xb); ZB[hd] = PZ(zb);
    hd = md(hd + 1, NT); cnt = min(cnt + 1, NT); tt = tt + 0.008;
  }
  PA.pos.x = PX(xa); PA.pos.y = PZ(za); PB.pos.x = PX(xb); PB.pos.y = PZ(zb);
  // Положения равновесия C± = (±√(β(ρ − 1)), ±…, ρ − 1)
  float q = sqrt(max(0, be * (rho - 1)));
  C1.pos.x = PX(q); C1.pos.y = PZ(rho - 1); C2.pos.x = PX(-q); C2.pos.y = PZ(rho - 1);
  float dd = sqrt((xa - xb) ^ 2 + (ya - yb) ^ 2 + (za - zb) ^ 2);

  info = "**Странный аттрактор** — притягивающее множество сложной (фрактальной) структуры, на котором движение хаотично: траектории со временем подходят к нему и остаются рядом, но две сколь угодно близкие траектории на нём экспоненциально расходятся. Классический пример — аттрактор Лоренца (проекция на плоскость x, z; размерность ≈ 2,06).\n\nρ = " + format(rho, 1) + ", t = " + format(tt, 1) + ":   расстояние между траекториями, стартовавшими на 0,001 друг от друга, — " + format(dd, 4) + ".";
  if (rho > 24.74) { info = info + " При ρ > 24,74 оба равновесия (серые точки) неустойчивы — траектории навсегда мечутся между ними, расходясь до размеров аттрактора."; }
  else { info = info + " При ρ < 24,74 равновесия (серые точки) устойчивы: траектории сходятся к одному из них, аттрактор не странный."; }
}
]
