[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true;
show grid = true;

// ---- f(z) = 1/(z − a₁) + 2/(z − a₂) − 1.5/(z − a₃): три простых полюса (перетаскиваются).
// Контур — окружность (центр K и точка на ней перетаскиваются). Серые штрихи — поле Пойа
// функции f (вектор (Re f, −Im f)): интеграл по контуру — это его циркуляция и поток. ----
draw Field { name = "fld"; P = "fpx(x, y)"; Q = "fpy(x, y)"; xmin = -8; xmax = 8; ymin = -5; ymax = 5; grid = 25; scale = 1.6; color = #6b7280 }
draw Graph { name = "gIn"; graph = "gi"; nodeColor = #f59e0b; nodeRadius = 17; labels = false; interactive = false; showWeights = false; layer = 40 }
new Point { name = "A1"; pos = (-2, 1); text = true("a₁: Res = 1"); pauseOnDrag = false; color = #ef4444; layer = 60 }
new Point { name = "A2"; pos = (1.5, -0.5); text = true("a₂: Res = 2"); pauseOnDrag = false; color = #ef4444; layer = 60 }
new Point { name = "A3"; pos = (4.5, 2.5); text = true("a₃: Res = −1,5"); pauseOnDrag = false; color = #ef4444; layer = 60 }
new Point { name = "K"; pos = (-0.5, 0.3); text = true("K"); pauseOnDrag = false; color = #3b82f6; size = 0.8 }
new Point { name = "RP"; pos = (3.1, 0.3); pauseOnDrag = false; color = #3b82f6; size = 0.8 }
new Circle { name = "cont"; center = K; radius = RP; color = #3b82f6; thickness = 3 }
new Point { name = "D0"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "D1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "dir"; pos = (D0, D1); color = "transparent"; interact = false }
draw Vector { name = "vdir"; edge = "dir"; pos = 1; color = #3b82f6; thickness = 3 }

// ---- Логика ----
float c1 = 1; float c2 = 2; float c3 = -1.5;
float Ir = 0; float Ii = 0;
float sumIn = 0;
string inside = "";
string info = "";

// f(z) = Σ cₖ/(z − aₖ); 1/(z − a) = (x̄ − ā)/|z − a|²
Function fr(x, y) {
  float d1 = (x - A1.pos.x) ^ 2 + (y - A1.pos.y) ^ 2; float d2 = (x - A2.pos.x) ^ 2 + (y - A2.pos.y) ^ 2; float d3 = (x - A3.pos.x) ^ 2 + (y - A3.pos.y) ^ 2;
  return c1 * (x - A1.pos.x) / d1 + c2 * (x - A2.pos.x) / d2 + c3 * (x - A3.pos.x) / d3;
}
Function fi(x, y) {
  float d1 = (x - A1.pos.x) ^ 2 + (y - A1.pos.y) ^ 2; float d2 = (x - A2.pos.x) ^ 2 + (y - A2.pos.y) ^ 2; float d3 = (x - A3.pos.x) ^ 2 + (y - A3.pos.y) ^ 2;
  return -c1 * (y - A1.pos.y) / d1 - c2 * (y - A2.pos.y) / d2 - c3 * (y - A3.pos.y) / d3;
}
// Поле Пойа (Re f, −Im f), нормированное — видно только направление
Function fpx(x, y) { float u = fr(x, y); float v = -fi(x, y); return u / (sqrt(u * u + v * v) + 0.000001); }
Function fpy(x, y) { float u = fr(x, y); float v = -fi(x, y); return v / (sqrt(u * u + v * v) + 0.000001); }
Function num(v) { if (abs(v) < 0.005) { return "0"; } if (v < 0) { return "−" + format(abs(v), 2); } return format(v, 2); }
Function isIn(P) { return (P.pos.x - K.pos.x) ^ 2 + (P.pos.y - K.pos.y) ^ 2 < (RP.pos.x - K.pos.x) ^ 2 + (RP.pos.y - K.pos.y) ^ 2; }

Update {
  float R = sqrt((RP.pos.x - K.pos.x) ^ 2 + (RP.pos.y - K.pos.y) ^ 2);
  // стрелка направления обхода (против часовой) в верхней точке контура
  D0.pos.x = K.pos.x + 0.6; D0.pos.y = K.pos.y + R; D1.pos.x = K.pos.x - 0.3; D1.pos.y = K.pos.y + R;

  // Численный интеграл ∮ f dz по окружности: dz = iR·e^(iθ)dθ
  Ir = 0; Ii = 0;
  float M = 720;
  repeat (M) {
    float th = 2 * pi * (i + 0.5) / M;
    float x = K.pos.x + R * cos(th); float y = K.pos.y + R * sin(th);
    float dzr = -R * sin(th) * 2 * pi / M; float dzi = R * cos(th) * 2 * pi / M;
    float a = fr(x, y); float b = fi(x, y);
    Ir = Ir + a * dzr - b * dzi; Ii = Ii + a * dzi + b * dzr;
  }
  gi = newGraph(); sumIn = 0; inside = "";
  if (isIn(A1)) { sumIn = sumIn + c1; addNode(gi, "a1", [A1.pos.x, A1.pos.y]); inside = inside + " a₁"; }
  if (isIn(A2)) { sumIn = sumIn + c2; addNode(gi, "a2", [A2.pos.x, A2.pos.y]); inside = inside + " a₂"; }
  if (isIn(A3)) { sumIn = sumIn + c3; addNode(gi, "a3", [A3.pos.x, A3.pos.y]); inside = inside + " a₃"; }
  if (inside == "") { inside = " нет"; }

  info = "**Вычет** функции f в изолированной особой точке a — коэффициент c₋₁ при (z − a)⁻¹ в её ряде Лорана; для простого полюса Res_(z=a) f = lim (z − a)f(z). **Теорема о вычетах:** интеграл по замкнутому контуру, обходящему особые точки против часовой стрелки, равен ∮ f dz = 2πi · Σ Res — сумме вычетов в точках **внутри** контура.\n\nf(z) = 1/(z − a₁) + 2/(z − a₂) − 1,5/(z − a₃). Внутри контура:" + inside + ", Σ Res = " + num(sumIn) + ", 2πi · Σ Res = " + num(2 * pi * sumIn) + "i.\n\nЧисленно по окружности: ∮ f dz ≈ " + num(Ir) + " + " + num(Ii) + "i.";
}
]
