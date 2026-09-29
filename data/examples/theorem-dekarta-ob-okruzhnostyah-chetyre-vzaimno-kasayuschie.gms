[
description = "{info}"

field width = 16;
field height = 11;
camera type = fixed;

// ---- Три попарно касающиеся окружности (радиусы r₁, r₂, r₃ — ползунки) и две окружности,
// касающиеся всех трёх; кривизны связаны теоремой Декарта. ----
new Circle { name = "w1"; center = O1; radius = r1; color = #3b82f6; thickness = 3 }
new Circle { name = "w2"; center = O2; radius = r2; color = #22c55e; thickness = 3 }
new Circle { name = "w3"; center = O3; radius = r3; color = #f59e0b; thickness = 3 }
new Circle { name = "w4"; center = O4; radius = r4; thickness = 3; active = v4 > 0.5 }
new Circle { name = "w5"; center = O5; radius = r5; thickness = 1.5; active = v5 > 0.5 }
new Point { name = "O1"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("k₁") }
new Point { name = "O2"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("k₂") }
new Point { name = "O3"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("k₃") }
new Point { name = "O4"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("k₄"); active = v4 > 0.5 }
new Point { name = "O5"; pos = (0, 0); dynamic = false; collision = false; collideWithPoints = false; text = true("k₄′"); active = v5 > 0.5 }

new UI { type = slider; label = "радиус r₁"; variable = ra; min = 0.6; max = 2.2; step = 0.1; default = 1.6 }
new UI { type = slider; label = "радиус r₂"; variable = rb; min = 0.6; max = 2.2; step = 0.1; default = 1.2 }
new UI { type = slider; label = "радиус r₃"; variable = rc; min = 0.6; max = 2.2; step = 0.1; default = 0.8 }

float ra = 1.6; float rb = 1.2; float rc = 0.8; float r1 = 2; float r2 = 1.5; float r3 = 1; float r4 = 1; float r5 = 1; float v4 = 0; float v5 = 0; string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
// координата (w = 0: x, w = 1: y) центра окружности радиуса rr (со знаком), касающейся трёх окружностей с центрами (0;0), (x2;0), (x3;y3)
Function cen(w, r1, r2, r3, x2, x3, y3, rr) {
  float c2 = (x2 * x2 - (r2 + rr) * (r2 + rr) + (r1 + rr) * (r1 + rr)) / 2;
  float c3 = ((x3 * x3 + y3 * y3) - (r3 + rr) * (r3 + rr) + (r1 + rr) * (r1 + rr)) / 2;
  float det = x2 * y3;
  if (w == 0) { return c2 * y3 / det; }
  return (x2 * c3 - c2 * x3) / det;
}

Update {
  r1 = ra; r2 = rb; r3 = rc;
  float x2 = r1 + r2;
  float x3 = ((r1 + r3) * (r1 + r3) - (r2 + r3) * (r2 + r3) + x2 * x2) / (2 * x2);
  float y3 = sqrt((r1 + r3) * (r1 + r3) - x3 * x3);
  float k1 = 1 / r1; float k2 = 1 / r2; float k3 = 1 / r3;
  float sq = sqrt(k1 * k2 + k2 * k3 + k3 * k1);
  float k4 = k1 + k2 + k3 + 2 * sq; float k5 = k1 + k2 + k3 - 2 * sq;
  r4 = 1 / k4;
  v4 = 1; v5 = 0;
  float px = 0; float py = 0;
  if (abs(k5) > 0.19) {
    v5 = 1;
    r5 = abs(1 / k5);
    px = cen(0, r1, r2, r3, x2, x3, y3, 1 / k5); py = cen(1, r1, r2, r3, x2, x3, y3, 1 / k5);
  }
  float sx = 0; float sy = 0;
  if (v5 > 0.5 && k5 < 0) { sx = -px; sy = -py; }
  else {
    float mnx = min(-r1, min(x2 - r2, x3 - r3)); float mxx = max(r1, max(x2 + r2, x3 + r3));
    float mny = min(-r1, min(-r2, y3 - r3)); float mxy = max(r1, max(r2, y3 + r3));
    sx = -(mnx + mxx) / 2; sy = -(mny + mxy) / 2;
  }
  O1.pos.x = sx; O1.pos.y = sy; O2.pos.x = x2 + sx; O2.pos.y = sy; O3.pos.x = x3 + sx; O3.pos.y = y3 + sy;
  O4.pos.x = cen(0, r1, r2, r3, x2, x3, y3, r4) + sx; O4.pos.y = cen(1, r1, r2, r3, x2, x3, y3, r4) + sy;
  if (v5 > 0.5) { O5.pos.x = px + sx; O5.pos.y = py + sy; }
  float lhs = (k1 + k2 + k3 + k4) * (k1 + k2 + k3 + k4); float rhs = 2 * (k1 * k1 + k2 * k2 + k3 * k3 + k4 * k4);
  info = "**Теорема Декарта:** для четырёх попарно касающихся окружностей (k — кривизна, 1/r, со знаком «−» при внутреннем касании) (k₁ + k₂ + k₃ + k₄)² = 2(k₁² + k₂² + k₃² + k₄²).\n\n";
  info = info + "Кривизны данных окружностей: k₁ = " + format(k1, 3) + ", k₂ = " + format(k2, 3) + ", k₃ = " + format(k3, 3) + ". Для вписанной между ними k₄ = k₁ + k₂ + k₃ + 2√(k₁k₂ + k₂k₃ + k₃k₁) = " + format(k4, 3) + " (r₄ = " + format(r4, 3) + "): левая часть " + format(lhs, 3) + ", правая " + format(rhs, 3) + ".\n\n";
  if (v5 > 0.5 && k5 < 0) {
    info = info + "Второе решение k₄′ = " + format(k1 + k2 + k3, 3) + " − 2√(…) = " + num(k5, 3) + " < 0: окружность охватывает три данные и касается их внутренне, её радиус " + format(r5, 3) + ".";
  } else if (v5 > 0.5) {
    info = info + "Второе решение k₄′ = " + format(k5, 3) + " > 0: вторая окружность, касающаяся всех трёх извне.";
  } else {
    info = info + "Второе решение k₄′ = " + num(k5, 3) + " почти равно нулю: «окружность» бесконечного радиуса — прямая, касающаяся всех трёх.";
  }
}
]
