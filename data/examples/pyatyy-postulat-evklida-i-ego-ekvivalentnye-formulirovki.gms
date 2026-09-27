[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Модель Пуанкаре: плоскость Лобачевского — внутренность круга, «прямые» — дуги окружностей,
// перпендикулярных границе (и диаметры). Прямая l проходит через U и V; через точку P вне её —
// две предельные параллели (оранжевые), между ними бесконечно много прямых, не пересекающих l
// (синие), и прямые, пересекающие l (серая). В режиме «Евклид» — обычная плоскость. ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "RB"; pos = (4.4, 0); dynamic = false; collision = false; active = false }
new Circle { name = "abs"; center = O; radius = RB; thickness = 2; active = mode == "hyp" }
new Curve { name = "g0"; type = parametric; x = "gx(0, t)"; y = "gy(0, t)"; segments = 120; color = #ef4444; thickness = 4; layer = 20 }
new Curve { name = "g1"; type = parametric; x = "gx(1, t)"; y = "gy(1, t)"; segments = 120; color = #f59e0b; thickness = 3; layer = 20 }
new Curve { name = "g2"; type = parametric; x = "gx(2, t)"; y = "gy(2, t)"; segments = 120; color = #f59e0b; thickness = 3; layer = 20 }
new Curve { name = "g3"; type = parametric; x = "gx(3, t)"; y = "gy(3, t)"; segments = 120; color = #3b82f6; thickness = 1.8; layer = 15 }
new Curve { name = "g4"; type = parametric; x = "gx(4, t)"; y = "gy(4, t)"; segments = 120; color = #3b82f6; thickness = 1.8; layer = 15 }
new Curve { name = "g5"; type = parametric; x = "gx(5, t)"; y = "gy(5, t)"; segments = 120; color = #3b82f6; thickness = 1.8; layer = 15 }
new Curve { name = "g6"; type = parametric; x = "gx(6, t)"; y = "gy(6, t)"; segments = 120; color = #3b82f6; thickness = 1.8; layer = 15 }
new Curve { name = "g7"; type = parametric; x = "gx(7, t)"; y = "gy(7, t)"; segments = 120; color = #6b7280; thickness = 1.5; layer = 15 }
new Point { name = "U"; pos = (-2.6, -1.6); text = true("U"); pauseOnDrag = false; color = #ef4444; layer = 60 }
new Point { name = "V"; pos = (2.4, -2.1); text = true("V"); pauseOnDrag = false; color = #ef4444; layer = 60 }
new Point { name = "P"; pos = (0.3, 1.6); text = true("P"); pauseOnDrag = false; color = #f59e0b; layer = 60 }
draw Text { name = "tl"; pos = (lbx, lby); text = "l"; color = #ef4444; size = 1.4 }

new UI { name = "sM"; type = select; label = "плоскость"; variable = mode; options = ("hyp", "euc"); labels = ("Лобачевского (диск Пуанкаре)", "Евклида"); default = "hyp" }

// ---- Логика ----
string mode = "hyp";
float S = 4.4;
float lbx = 0; float lby = 0;
list GX = (0, 0, 0, 0, 0, 0, 0, 0); list GY = (0, 0, 0, 0, 0, 0, 0, 0); list GR = (0, 0, 0, 0, 0, 0, 0, 0);
list GA = (0, 0, 0, 0, 0, 0, 0, 0); list GS = (0, 0, 0, 0, 0, 0, 0, 0); list GL = (0, 0, 0, 0, 0, 0, 0, 0);
list EX = (0, 0, 0, 0, 0, 0, 0, 0); list EY = (0, 0, 0, 0, 0, 0, 0, 0); list FX = (0, 0, 0, 0, 0, 0, 0, 0); list FY = (0, 0, 0, 0, 0, 0, 0, 0);
float rx = 0; float ry = 0;
string info = "";

// Точка k-й «прямой» при t ∈ [0; 1] (в единицах экрана)
Function gx(k, t) { if (GL[k] == 1) { return S * (EX[k] + (FX[k] - EX[k]) * t); } return S * (GX[k] + GR[k] * cos(GA[k] + GS[k] * t)); }
Function gy(k, t) { if (GL[k] == 1) { return S * (EY[k] + (FY[k] - EY[k]) * t); } return S * (GY[k] + GR[k] * sin(GA[k] + GS[k] * t)); }
// Прямая Евклида через (x1, y1) в направлении (dx, dy)
Function eline(k, x1, y1, dx, dy) { float l = sqrt(dx * dx + dy * dy) + 0.000001; GL[k] = 1; EX[k] = x1 - 5 * dx / l; EY[k] = y1 - 5 * dy / l; FX[k] = x1 + 5 * dx / l; FY[k] = y1 + 5 * dy / l; return 0; }
// Геодезическая через три точки одной окружности (центр — по трём точкам); если они на
// одной прямой с центром диска — диаметр
Function geo3(k, x1, y1, x2, y2, x3, y3) {
  float d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
  if (abs(d) < 0.000001) { float l = sqrt(x1 * x1 + y1 * y1) + 0.000001; if (l < 0.001) { l = sqrt(x2 * x2 + y2 * y2); x1 = x2; y1 = y2; } GL[k] = 1; EX[k] = -x1 / l; EY[k] = -y1 / l; FX[k] = x1 / l; FY[k] = y1 / l; return 0; }
  float a = x1 * x1 + y1 * y1; float b = x2 * x2 + y2 * y2; float c = x3 * x3 + y3 * y3;
  float cx = (a * (y2 - y3) + b * (y3 - y1) + c * (y1 - y2)) / d;
  float cy = (a * (x3 - x2) + b * (x1 - x3) + c * (x2 - x1)) / d;
  float cl = sqrt(cx * cx + cy * cy);
  if (cl > 500) { float l = sqrt(x1 * x1 + y1 * y1) + 0.000001; GL[k] = 1; EX[k] = -x1 / l; EY[k] = -y1 / l; FX[k] = x1 / l; FY[k] = y1 / l; return 0; }
  float r = sqrt(max(cl * cl - 1, 0.000001));
  // дуга внутри диска: от направления на центр диска ± atan(1/r)
  float psi = atan2(-cy, -cx); float del = atan(1 / r);
  GL[k] = 0; GX[k] = cx; GY[k] = cy; GR[k] = r; GA[k] = psi - del; GS[k] = 2 * del;
  return 0;
}
// Геодезическая через две внутренние точки: третья — образ первой при инверсии в границе
Function geo2(k, x1, y1, x2, y2) { float q = x1 * x1 + y1 * y1; if (q < 0.0001) { return geo3(k, x2, y2, x1, y1, x2 / (x2 * x2 + y2 * y2), y2 / (x2 * x2 + y2 * y2)); } return geo3(k, x1, y1, x2, y2, x1 / q, y1 / q); }
// Отображение, переводящее P в 0, и обратное: w = (z − p)/(1 − p̄z), z = (w + p)/(1 + p̄w) → rx, ry
Function mob(x, y, px, py, sg) {
  // числитель z + sg·p, знаменатель 1 + sg·p̄z
  float nx = x + sg * px; float ny = y + sg * py;
  float dx = 1 + sg * (px * x + py * y); float dy = sg * (px * y - py * x);
  float dd = dx * dx + dy * dy;
  rx = (nx * dx + ny * dy) / dd; ry = (ny * dx - nx * dy) / dd;
  return 0;
}
Function clampIn(Q) { float d = sqrt(Q.pos.x ^ 2 + Q.pos.y ^ 2); if (d > 0.93 * S) { Q.pos.x = Q.pos.x * 0.93 * S / d; Q.pos.y = Q.pos.y * 0.93 * S / d; } return 0; }

Update {
  float px = P.pos.x / S; float py = P.pos.y / S;
  float ux = U.pos.x / S; float uy = U.pos.y / S; float vx = V.pos.x / S; float vy = V.pos.y / S;
  if (mode == "hyp") {
    clampIn(U); clampIn(V); clampIn(P);
    px = P.pos.x / S; py = P.pos.y / S; ux = U.pos.x / S; uy = U.pos.y / S; vx = V.pos.x / S; vy = V.pos.y / S;
    geo2(0, ux, uy, vx, vy);
    // идеальные концы l
    float e1x = 0; float e1y = 0; float e2x = 0; float e2y = 0;
    if (GL[0] == 1) { e1x = EX[0]; e1y = EY[0]; e2x = FX[0]; e2y = FY[0]; }
    else { e1x = GX[0] + GR[0] * cos(GA[0]); e1y = GY[0] + GR[0] * sin(GA[0]); e2x = GX[0] + GR[0] * cos(GA[0] + GS[0]); e2y = GY[0] + GR[0] * sin(GA[0] + GS[0]); }
    // предельные параллели: через P и идеальный конец l
    float q = px * px + py * py + 0.000001;
    geo3(1, px, py, e1x, e1y, px / q, py / q);
    geo3(2, px, py, e2x, e2y, px / q, py / q);
    // Переходим в систему, где P = 0: там прямые через P — диаметры. Концы l видны под углами b1, b2
    mob(e1x, e1y, px, py, -1); float b1 = atan2(ry, rx);
    mob(e2x, e2y, px, py, -1); float b2 = atan2(ry, rx);
    float w = b2 - b1; if (w < 0) { w = w + 2 * pi; } if (w > pi) { float tmp = b1; b1 = b2; b2 = tmp; w = 2 * pi - w; }
    // диаметры с направлением θ ∈ (b2; b1 + π) не пересекают l — это «синие» параллели
    repeat (4) {
      float th = b2 + (pi - w) * (i + 1) / 5;
      mob(cos(th), sin(th), px, py, 1); float ax = rx; float ay = ry;
      mob(-cos(th), -sin(th), px, py, 1);
      geo3(3 + i, px, py, ax, ay, rx, ry);
    }
    // одна прямая, пересекающая l
    float tc = b1 + w / 2;
    mob(cos(tc), sin(tc), px, py, 1); float cx0 = rx; float cy0 = ry; mob(-cos(tc), -sin(tc), px, py, 1);
    geo3(7, px, py, cx0, cy0, rx, ry);
    lbx = S * (e1x * 0.8 + 0.05); lby = S * (e1y * 0.8 + 0.05);
  } else {
    float dx = vx - ux; float dy = vy - uy;
    eline(0, ux, uy, dx, dy); eline(1, px, py, dx, dy); eline(2, px, py, dx, dy);
    repeat (4) { float a = atan2(dy, dx) + 0.25 * (i + 1); eline(3 + i, px, py, cos(a), sin(a)); GL[3 + i] = 1; }
    GL[3] = 1; EX[3] = 0; EY[3] = 0; FX[3] = 0; FY[3] = 0;
    GL[4] = 1; EX[4] = 0; EY[4] = 0; FX[4] = 0; FY[4] = 0;
    GL[5] = 1; EX[5] = 0; EY[5] = 0; FX[5] = 0; FY[5] = 0;
    GL[6] = 1; EX[6] = 0; EY[6] = 0; FX[6] = 0; FY[6] = 0;
    eline(7, px, py, cos(atan2(dy, dx) + 0.6), sin(atan2(dy, dx) + 0.6));
    lbx = S * (ux + vx) / 2 + 0.3; lby = S * (uy + vy) / 2 - 0.4;
  }

  info = "**Пятый постулат Евклида** в равносильной форме (аксиома Плейфера): через точку P вне прямой l проходит **ровно одна** прямая, не пересекающая l. Две тысячи лет его пытались вывести из остальных аксиом, пока Лобачевский, Бойяи и Гаусс не поняли, что это невозможно: существует геометрия, где верны все остальные аксиомы, а пятый постулат — нет.\n\n";
  if (mode == "hyp") { info = info + "**Модель Пуанкаре** плоскости Лобачевского: точки — внутренность круга, прямые — дуги окружностей, перпендикулярных границе. Первые четыре постулата выполняются (через две точки — ровно одна такая дуга и т. д.), но через P проходят **бесконечно много** прямых, не пересекающих l: все, что лежат между двумя предельными параллелями (оранжевыми), которые «встречаются» с l только на недостижимой границе. Следствия: сумма углов треугольника меньше 180°, подобных неравных треугольников нет."; }
  else { info = info + "**Евклидова плоскость:** все прямые через P, кроме одной (оранжевой), пересекают l."; }
  info = info + "\n\nТочки U, V (задают прямую l) и P перетаскиваются.";
}
]
