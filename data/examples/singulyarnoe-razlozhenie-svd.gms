[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true;
show grid = true;

// ---- Матрица A задаётся столбцами: Ae₁ и Ae₂ перетаскиваются (масштаб: 2 клетки = 1) ----
// Ползунок s ведёт единичную окружность через три этапа A = UΣVᵀ:
// 0 → 1 — поворот Vᵀ, 1 → 2 — растяжение Σ вдоль осей, 2 → 3 — поворот U.
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.6 }
new Point { name = "E1"; pos = (3, 1); text = true("Ae₁"); pauseOnDrag = false; size = 0.8 }
new Point { name = "E2"; pos = (-1, 2); text = true("Ae₂"); pauseOnDrag = false; size = 0.8 }
new Line { name = "oe1"; pos = (O, E1); interact = false; thickness = 1 }
new Line { name = "oe2"; pos = (O, E2); interact = false; thickness = 1 }
new Curve { name = "circ0"; type = parametric; x = "2 * cos(2 * pi * t)"; y = "2 * sin(2 * pi * t)"; segments = 100; color = #6b7280; thickness = 1 }
new Curve { name = "img"; type = parametric; x = "cx(t)"; y = "cy(t)"; segments = 160; color = #3b82f6; thickness = 3 }
new Point { name = "P1"; pos = (2, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e }
new Point { name = "P2"; pos = (0, 2); dynamic = false; collision = false; size = 0.5; color = #f59e0b }
new Line { name = "op1"; pos = (O, P1); color = #22c55e; thickness = 3; interact = false; layer = 12 }
new Line { name = "op2"; pos = (O, P2); color = #f59e0b; thickness = 3; interact = false; layer = 12 }
draw Vector { name = "vp1"; edge = "op1"; pos = 1; color = #22c55e; thickness = 3 }
draw Vector { name = "vp2"; edge = "op2"; pos = 1; color = #f59e0b; thickness = 3 }
draw Text { name = "t1"; pos = (P1.pos.x * 1.12 + 0.3, P1.pos.y * 1.12 + 0.3); text = lab1; color = #22c55e; size = 1.1 }
draw Text { name = "t2"; pos = (P2.pos.x * 1.12 + 0.3, P2.pos.y * 1.12 + 0.3); text = lab2; color = #f59e0b; size = 1.1 }

new UI { name = "sS"; type = slider; label = "этап (Vᵀ → Σ → U)"; variable = s; min = 0; max = 3; step = 0.01; default = 0 }

// ---- Логика ----
float s = 0;
float m11 = 1; float m12 = 0; float m21 = 0; float m22 = 1;
string lab1 = "v₁"; string lab2 = "v₂";
string info = "";

Function cx(t) { return 2 * (m11 * cos(2 * pi * t) + m12 * sin(2 * pi * t)); }
Function cy(t) { return 2 * (m21 * cos(2 * pi * t) + m22 * sin(2 * pi * t)); }
Function num(v) { if (v < -0.005) { return "−" + format(abs(v), 2); } return format(abs(v), 2); }
Function deg(v) { return num(v * 180 / pi) + "°"; }
Function clamp01(v) { return max(0, min(1, v)); }

Update {
  float a = E1.pos.x / 2; float c = E1.pos.y / 2; float b = E2.pos.x / 2; float d = E2.pos.y / 2;
  // AᵀA = [[p, q], [q, r]] — её собственные векторы v₁, v₂, собственные значения σ₁², σ₂²
  float p = a * a + c * c; float q = a * b + c * d; float r = b * b + d * d;
  float tv = 0.5 * atan2(2 * q, p - r);
  float h = sqrt(((p - r) / 2) ^ 2 + q * q);
  float s1 = sqrt((p + r) / 2 + h); float s2 = sqrt(max(0, (p + r) / 2 - h));
  float det = a * d - b * c;
  float sg = 1; if (det < 0) { sg = -1; }
  float av1x = a * cos(tv) + b * sin(tv); float av1y = c * cos(tv) + d * sin(tv);
  float tu = atan2(av1y, av1x);
  // Частичное отображение M(s) = R(tu·k₃) · diag(sx, sy) · R(−tv·k₁); при det A < 0 второе
  // растяжение берётся со знаком минус (отражение), тогда U и V — повороты.
  float k1 = clamp01(s); float k2 = clamp01(s - 1); float k3 = clamp01(s - 2);
  float al = -tv * k1; float be = tu * k3;
  float sx = 1 + (s1 - 1) * k2; float sy = 1 + (sg * s2 - 1) * k2;
  float ca = cos(al); float sa = sin(al); float cb = cos(be); float sb = sin(be);
  // D·R(al)
  float n11 = sx * ca; float n12 = -sx * sa; float n21 = sy * sa; float n22 = sy * ca;
  m11 = cb * n11 - sb * n21; m12 = cb * n12 - sb * n22; m21 = sb * n11 + cb * n21; m22 = sb * n12 + cb * n22;
  // Образы v₁, v₂ на текущем этапе
  float v1x = cos(tv); float v1y = sin(tv); float v2x = -sin(tv); float v2y = cos(tv);
  P1.pos.x = 2 * (m11 * v1x + m12 * v1y); P1.pos.y = 2 * (m21 * v1x + m22 * v1y);
  P2.pos.x = 2 * (m11 * v2x + m12 * v2y); P2.pos.y = 2 * (m21 * v2x + m22 * v2y);
  lab1 = "v₁"; lab2 = "v₂";
  if (s > 0.99) { lab1 = "e₁"; lab2 = "e₂"; }
  if (s > 1.01) { lab1 = "σ₁e₁"; lab2 = "σ₂e₂"; }
  if (s > 2.99) { lab1 = "σ₁u₁"; lab2 = "σ₂u₂"; }

  info = "**Сингулярное разложение** A = UΣVᵀ: любое линейное отображение плоскости — поворот Vᵀ, растяжение вдоль осей в σ₁ и σ₂ раз и поворот U. Единичная окружность (серая) переходит в эллипс с полуосями σ₁u₁ и σ₂u₂, а в них — векторы v₁ и v₂: Avᵢ = σᵢuᵢ.\n\nA = [[" + num(a) + ", " + num(b) + "], [" + num(c) + ", " + num(d) + "]]:   σ₁ = " + num(s1) + ", σ₂ = " + num(s2) + ";   Vᵀ — поворот на " + deg(-tv) + ", U — поворот на " + deg(tu);
  if (det < 0) { info = info + "; det A < 0, поэтому одно из растяжений — с отражением"; }
  info = info + ".";
  if (s2 < 0.01) { info = info + " σ₂ = 0: ранг A равен 1, эллипс сплющен в отрезок."; }
  info = info + "\n\nЭтап: ";
  if (s < 0.01) { info = info + "исходная единичная окружность и правые сингулярные векторы v₁, v₂."; }
  if (s >= 0.01 && s <= 1) { info = info + "поворот Vᵀ переводит v₁, v₂ в базисные e₁, e₂."; }
  if (s > 1 && s <= 2) { info = info + "Σ растягивает вдоль осей: e₁ в σ₁ раз, e₂ в σ₂ раз."; }
  if (s > 2) { info = info + "поворот U ставит полуоси на место: получается образ окружности при A."; }
}
]
