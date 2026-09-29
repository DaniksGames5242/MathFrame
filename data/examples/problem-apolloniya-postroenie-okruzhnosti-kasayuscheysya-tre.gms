[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Три данные окружности: центры перетаскиваются, радиусы — ползунки ----
new Point { name = "S1"; pos = (-4, -1.5); text = true("1"); pauseOnDrag = false }
new Point { name = "S2"; pos = (3.5, -2); text = true("2"); pauseOnDrag = false }
new Point { name = "S3"; pos = (0.5, 2.5); text = true("3"); pauseOnDrag = false }
float ra = 1.2; float rb = 1.0; float rc = 0.8; float k = 1;
new Circle { name = "g1"; center = S1; radius = ra; color = #f59e0b; thickness = 3 }
new Circle { name = "g2"; center = S2; radius = rb; color = #f59e0b; thickness = 3 }
new Circle { name = "g3"; center = S3; radius = rc; color = #f59e0b; thickness = 3 }

// ---- Решения: до 16 корней (8 комбинаций касания × 2), годятся только с r > 0 ----
list sx = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list sy = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list sr = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list sm = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
float cnt = 0; float selx = 0; float sely = 0; float selr = 0; float selm = 0; float selOk = 0;
new Curve { name = "c0"; type = parametric; x = "sx[0] + sr[0] * cos(6.2831853 * t)"; y = "sy[0] + sr[0] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[0] > 0 && sr[0] < 60 && sm[0] != selm }
new Curve { name = "c1"; type = parametric; x = "sx[1] + sr[1] * cos(6.2831853 * t)"; y = "sy[1] + sr[1] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[1] > 0 && sr[1] < 60 && sm[1] != selm }
new Curve { name = "c2"; type = parametric; x = "sx[2] + sr[2] * cos(6.2831853 * t)"; y = "sy[2] + sr[2] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[2] > 0 && sr[2] < 60 && sm[2] != selm }
new Curve { name = "c3"; type = parametric; x = "sx[3] + sr[3] * cos(6.2831853 * t)"; y = "sy[3] + sr[3] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[3] > 0 && sr[3] < 60 && sm[3] != selm }
new Curve { name = "c4"; type = parametric; x = "sx[4] + sr[4] * cos(6.2831853 * t)"; y = "sy[4] + sr[4] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[4] > 0 && sr[4] < 60 && sm[4] != selm }
new Curve { name = "c5"; type = parametric; x = "sx[5] + sr[5] * cos(6.2831853 * t)"; y = "sy[5] + sr[5] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[5] > 0 && sr[5] < 60 && sm[5] != selm }
new Curve { name = "c6"; type = parametric; x = "sx[6] + sr[6] * cos(6.2831853 * t)"; y = "sy[6] + sr[6] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[6] > 0 && sr[6] < 60 && sm[6] != selm }
new Curve { name = "c7"; type = parametric; x = "sx[7] + sr[7] * cos(6.2831853 * t)"; y = "sy[7] + sr[7] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[7] > 0 && sr[7] < 60 && sm[7] != selm }
new Curve { name = "c8"; type = parametric; x = "sx[8] + sr[8] * cos(6.2831853 * t)"; y = "sy[8] + sr[8] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[8] > 0 && sr[8] < 60 && sm[8] != selm }
new Curve { name = "c9"; type = parametric; x = "sx[9] + sr[9] * cos(6.2831853 * t)"; y = "sy[9] + sr[9] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[9] > 0 && sr[9] < 60 && sm[9] != selm }
new Curve { name = "c10"; type = parametric; x = "sx[10] + sr[10] * cos(6.2831853 * t)"; y = "sy[10] + sr[10] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[10] > 0 && sr[10] < 60 && sm[10] != selm }
new Curve { name = "c11"; type = parametric; x = "sx[11] + sr[11] * cos(6.2831853 * t)"; y = "sy[11] + sr[11] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[11] > 0 && sr[11] < 60 && sm[11] != selm }
new Curve { name = "c12"; type = parametric; x = "sx[12] + sr[12] * cos(6.2831853 * t)"; y = "sy[12] + sr[12] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[12] > 0 && sr[12] < 60 && sm[12] != selm }
new Curve { name = "c13"; type = parametric; x = "sx[13] + sr[13] * cos(6.2831853 * t)"; y = "sy[13] + sr[13] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[13] > 0 && sr[13] < 60 && sm[13] != selm }
new Curve { name = "c14"; type = parametric; x = "sx[14] + sr[14] * cos(6.2831853 * t)"; y = "sy[14] + sr[14] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[14] > 0 && sr[14] < 60 && sm[14] != selm }
new Curve { name = "c15"; type = parametric; x = "sx[15] + sr[15] * cos(6.2831853 * t)"; y = "sy[15] + sr[15] * sin(6.2831853 * t)"; segments = 120; color = #3b82f6; thickness = 1.5; active = sr[15] > 0 && sr[15] < 60 && sm[15] != selm }
new Curve { name = "csel"; type = parametric; x = "selx + selr * cos(6.2831853 * t)"; y = "sely + selr * sin(6.2831853 * t)"; segments = 120; color = #22c55e; thickness = 3.5; active = selOk > 0.5 }
new UI { type = slider; label = "r₁"; variable = ra; min = 0.4; max = 2.2; step = 0.1; default = 1.2 }
new UI { type = slider; label = "r₂"; variable = rb; min = 0.4; max = 2.2; step = 0.1; default = 1.0 }
new UI { type = slider; label = "r₃"; variable = rc; min = 0.4; max = 2.2; step = 0.1; default = 0.8 }
new UI { type = slider; label = "решение №"; variable = k; min = 1; max = 8; step = 1; default = 1 }

string info = "";
float sig = 0; float ok = 0;

// Решение системы (x − xᵢ)² + (y − yᵢ)² = (r + sᵢrᵢ)²: вычитание первого уравнения даёт x, y линейно через r,
// подстановка в первое — квадратное уравнение на r.
Function solve() {
  float x1 = S1.pos.x; float y1 = S1.pos.y; float x2 = S2.pos.x; float y2 = S2.pos.y; float x3 = S3.pos.x; float y3 = S3.pos.y;
  float a2 = 2 * (x2 - x1); float b2 = 2 * (y2 - y1); float a3 = 2 * (x3 - x1); float b3 = 2 * (y3 - y1);
  float det = a2 * b3 - a3 * b2;
  repeat (16) { sr[i] = 0; sm[i] = 0; }
  if (abs(det) < 0.0001) { return 0; }
  float n = 0;
  repeat (8) {
    float m = i;
    float p1 = ra * (1 - 2 * (m % 2)); float p2 = rb * (1 - 2 * (floor(m / 2) % 2)); float p3 = rc * (1 - 2 * (floor(m / 4) % 2));
    float c2 = x2 * x2 + y2 * y2 - x1 * x1 - y1 * y1 - (p2 * p2 - p1 * p1); float c3 = x3 * x3 + y3 * y3 - x1 * x1 - y1 * y1 - (p3 * p3 - p1 * p1);
    float d2 = 2 * (p2 - p1); float d3 = 2 * (p3 - p1);
    float px = (c2 * b3 - c3 * b2) / det; float qx = (-d2 * b3 + d3 * b2) / det;
    float py = (a2 * c3 - a3 * c2) / det; float qy = (-a2 * d3 + a3 * d2) / det;
    float ex = px - x1; float ey = py - y1;
    float qa = qx * qx + qy * qy - 1; float qb = 2 * (ex * qx + ey * qy - p1); float qc = ex * ex + ey * ey - p1 * p1;
    float r0 = 0; float r1 = 0; float cntR = 0;
    if (abs(qa) < 0.000001) { if (abs(qb) > 0.000001) { r0 = -qc / qb; cntR = 1; } }
    if (abs(qa) >= 0.000001) { float dd = qb * qb - 4 * qa * qc; if (dd >= 0) { r0 = (-qb - sqrt(dd)) / (2 * qa); r1 = (-qb + sqrt(dd)) / (2 * qa); cntR = 2; } }
    if (cntR >= 1 && r0 > 0.001) { sr[2 * m] = r0; sx[2 * m] = px + qx * r0; sy[2 * m] = py + qy * r0; sm[2 * m] = m + 1; }
    if (cntR >= 2 && r1 > 0.001 && abs(r1 - r0) > 0.000001) { sr[2 * m + 1] = r1; sx[2 * m + 1] = px + qx * r1; sy[2 * m + 1] = py + qy * r1; sm[2 * m + 1] = m + 1; }
  }
  return 1;
}
Function kind(s) { if (s > 0) { return "внешне"; } return "внутренне"; }

Update {
  if (abs((S2.pos.x - S1.pos.x) * (S3.pos.y - S1.pos.y) - (S3.pos.x - S1.pos.x) * (S2.pos.y - S1.pos.y)) < 0.05) { S3.pos.y = S3.pos.y + 0.3; }
  ok = solve();
  cnt = 0; selOk = 0; selm = 0;
  repeat (16) { if (sr[i] > 0) { cnt = cnt + 1; if (cnt == min(k, 8)) { selx = sx[i]; sely = sy[i]; selr = sr[i]; selm = sm[i]; selOk = 1; } } }
  string t = "";
  if (selOk > 0.5 && selr < 60) {
    float m = selm - 1;
    float e1 = sqrt((selx - S1.pos.x) ^ 2 + (sely - S1.pos.y) ^ 2); float e2 = sqrt((selx - S2.pos.x) ^ 2 + (sely - S2.pos.y) ^ 2); float e3 = sqrt((selx - S3.pos.x) ^ 2 + (sely - S3.pos.y) ^ 2);
    t = "\n\nВыбранная окружность радиуса " + format(selr, 2) + " касается окружности 1 " + kind(1 - 2 * (m % 2)) + " (расстояние между центрами " + format(e1, 2) + ", r + r₁ = " + format(selr + ra, 2) + ", |r − r₁| = " + format(abs(selr - ra), 2) + "), окружности 2 " + kind(1 - 2 * (floor(m / 2) % 2)) + " (" + format(e2, 2) + "; " + format(selr + rb, 2) + "; " + format(abs(selr - rb), 2) + "), окружности 3 " + kind(1 - 2 * (floor(m / 4) % 2)) + " (" + format(e3, 2) + "; " + format(selr + rc, 2) + "; " + format(abs(selr - rc), 2) + ").";
  }
  info = "**Задача Аполлония для трёх окружностей:** найти окружности, касающиеся трёх данных. У каждой данной касание внешнее или внутреннее — 2³ = 8 сочетаний, поэтому решений не больше восьми. Сейчас их **" + format(cnt, 0) + "** (синие; выбранное ползунком — зелёное).\n\nКаждое сочетание даёт квадратное уравнение на радиус: (x − xᵢ)² + (y − yᵢ)² = (r ± rᵢ)² — три условия на x, y, r." + t;
}
]
