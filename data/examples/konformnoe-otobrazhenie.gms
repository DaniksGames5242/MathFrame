[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Слева плоскость z: квадратная сетка (центр C перетаскивается) и крестик в точке P.
// Справа плоскость w = f(z): образ сетки. Масштаб правой панели подбирается под образ. ----
new Point { name = "L0"; pos = (-7.6, -4.6); dynamic = false; collision = false; active = false }
new Point { name = "L1"; pos = (-0.4, -4.6); dynamic = false; collision = false; active = false }
new Point { name = "L2"; pos = (-0.4, 4.6); dynamic = false; collision = false; active = false }
new Point { name = "L3"; pos = (-7.6, 4.6); dynamic = false; collision = false; active = false }
new Line { name = "l01"; pos = (L0, L1); interact = false; thickness = 1 }
new Line { name = "l12"; pos = (L1, L2); interact = false; thickness = 1 }
new Line { name = "l23"; pos = (L2, L3); interact = false; thickness = 1 }
new Line { name = "l30"; pos = (L3, L0); interact = false; thickness = 1 }
new Point { name = "R0"; pos = (0.4, -4.6); dynamic = false; collision = false; active = false }
new Point { name = "R1"; pos = (7.6, -4.6); dynamic = false; collision = false; active = false }
new Point { name = "R2"; pos = (7.6, 4.6); dynamic = false; collision = false; active = false }
new Point { name = "R3"; pos = (0.4, 4.6); dynamic = false; collision = false; active = false }
new Line { name = "r01"; pos = (R0, R1); interact = false; thickness = 1 }
new Line { name = "r12"; pos = (R1, R2); interact = false; thickness = 1 }
new Line { name = "r23"; pos = (R2, R3); interact = false; thickness = 1 }
new Line { name = "r30"; pos = (R3, R0); interact = false; thickness = 1 }
// оси плоскости z
new Point { name = "ZA"; pos = (-7.6, 0); dynamic = false; collision = false; active = false }
new Point { name = "ZB"; pos = (-0.4, 0); dynamic = false; collision = false; active = false }
new Point { name = "ZC"; pos = (-4, -4.6); dynamic = false; collision = false; active = false }
new Point { name = "ZD"; pos = (-4, 4.6); dynamic = false; collision = false; active = false }
new Line { name = "zre"; pos = (ZA, ZB); interact = false; thickness = 1; color = #6b7280 }
new Line { name = "zim"; pos = (ZC, ZD); interact = false; thickness = 1; color = #6b7280 }
// оси плоскости w (двигаются вместе с масштабом; вне панели прячутся)
new Point { name = "WA"; pos = (0.4, 0); dynamic = false; collision = false; active = false }
new Point { name = "WB"; pos = (7.6, 0); dynamic = false; collision = false; active = false }
new Point { name = "WC"; pos = (4, -4.6); dynamic = false; collision = false; active = false }
new Point { name = "WD"; pos = (4, 4.6); dynamic = false; collision = false; active = false }
new Line { name = "wre"; pos = (WA, WB); interact = false; thickness = 1; color = #6b7280 }
new Line { name = "wim"; pos = (WC, WD); interact = false; thickness = 1; color = #6b7280 }
draw Text { name = "tz"; pos = (-7.1, 4.1); text = "z"; size = 1.4 }
draw Text { name = "tw"; pos = (0.9, 4.1); text = "w"; size = 1.4 }
draw Text { name = "tf"; pos = (4, 4.1); text = "w = " + fname; size = 1.2 }

new Curve { name = "gz0"; type = parametric; x = "zX(0, t)"; y = "zY(0, t)"; segments = 2; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gw0"; type = parametric; x = "wX(0, t)"; y = "wY(0, t)"; segments = 90; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gz1"; type = parametric; x = "zX(1, t)"; y = "zY(1, t)"; segments = 2; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gw1"; type = parametric; x = "wX(1, t)"; y = "wY(1, t)"; segments = 90; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gz2"; type = parametric; x = "zX(2, t)"; y = "zY(2, t)"; segments = 2; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gw2"; type = parametric; x = "wX(2, t)"; y = "wY(2, t)"; segments = 90; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gz3"; type = parametric; x = "zX(3, t)"; y = "zY(3, t)"; segments = 2; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gw3"; type = parametric; x = "wX(3, t)"; y = "wY(3, t)"; segments = 90; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gz4"; type = parametric; x = "zX(4, t)"; y = "zY(4, t)"; segments = 2; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gw4"; type = parametric; x = "wX(4, t)"; y = "wY(4, t)"; segments = 90; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gz5"; type = parametric; x = "zX(5, t)"; y = "zY(5, t)"; segments = 2; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gw5"; type = parametric; x = "wX(5, t)"; y = "wY(5, t)"; segments = 90; color = #3b82f6; thickness = 1.5 }
new Curve { name = "gz6"; type = parametric; x = "zX(6, t)"; y = "zY(6, t)"; segments = 2; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gw6"; type = parametric; x = "wX(6, t)"; y = "wY(6, t)"; segments = 90; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gz7"; type = parametric; x = "zX(7, t)"; y = "zY(7, t)"; segments = 2; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gw7"; type = parametric; x = "wX(7, t)"; y = "wY(7, t)"; segments = 90; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gz8"; type = parametric; x = "zX(8, t)"; y = "zY(8, t)"; segments = 2; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gw8"; type = parametric; x = "wX(8, t)"; y = "wY(8, t)"; segments = 90; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gz9"; type = parametric; x = "zX(9, t)"; y = "zY(9, t)"; segments = 2; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gw9"; type = parametric; x = "wX(9, t)"; y = "wY(9, t)"; segments = 90; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gz10"; type = parametric; x = "zX(10, t)"; y = "zY(10, t)"; segments = 2; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gw10"; type = parametric; x = "wX(10, t)"; y = "wY(10, t)"; segments = 90; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gz11"; type = parametric; x = "zX(11, t)"; y = "zY(11, t)"; segments = 2; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gw11"; type = parametric; x = "wX(11, t)"; y = "wY(11, t)"; segments = 90; color = #f59e0b; thickness = 1.5 }
new Curve { name = "gz12"; type = parametric; x = "zX(12, t)"; y = "zY(12, t)"; segments = 2; color = #3b82f6; thickness = 4; layer = 40 }
new Curve { name = "gw12"; type = parametric; x = "wX(12, t)"; y = "wY(12, t)"; segments = 30; color = #3b82f6; thickness = 4; layer = 40 }
new Curve { name = "gz13"; type = parametric; x = "zX(13, t)"; y = "zY(13, t)"; segments = 2; color = #f59e0b; thickness = 4; layer = 40 }
new Curve { name = "gw13"; type = parametric; x = "wX(13, t)"; y = "wY(13, t)"; segments = 30; color = #f59e0b; thickness = 4; layer = 40 }
new Point { name = "C"; pos = (-2.4, 1.6); text = true("C"); pauseOnDrag = false; size = 0.8 }
new Point { name = "P"; pos = (-1.8, 2.1); text = true("P"); pauseOnDrag = false; color = #22c55e; size = 0.8 }

new UI { name = "sF"; type = select; label = "f(z)"; variable = fn; options = ("sq", "exp", "inv", "mob"); labels = ("z²", "eᶻ", "1/z", "(z − 1)/(z + 1)"); default = "sq" }

// ---- Логика ----
string fn = "sq";
string fname = "z²";
float Lz = 1.4;
float h = 1.1;
float e = 0.35;
float cx = 1; float cy = 1; float px = 1.3; float py = 1.6;
float Lw = 1; float wcx = 0; float wcy = 0;
float lastKey = -1;
string info = "";

Function fre(x, y) {
  if (fn == "sq") { return x * x - y * y; }
  if (fn == "exp") { return exp(x) * cos(y); }
  if (fn == "inv") { return x / (x * x + y * y); }
  return (x * x + y * y - 1) / ((x + 1) ^ 2 + y * y);
}
Function fim(x, y) {
  if (fn == "sq") { return 2 * x * y; }
  if (fn == "exp") { return exp(x) * sin(y); }
  if (fn == "inv") { return -y / (x * x + y * y); }
  return 2 * y / ((x + 1) ^ 2 + y * y);
}
// Точка k-й линии при параметре t (в единицах плоскости z): 0…5 — вертикальные,
// 6…11 — горизонтальные, 12 и 13 — крестик в точке P
Function zx(k, t) {
  if (k < 6) { return cx - h + 2 * h * k / 5; }
  if (k < 12) { return cx - h + 2 * h * t; }
  if (k == 12) { return px; }
  return px - e + 2 * e * t;
}
Function zy(k, t) {
  if (k < 6) { return cy - h + 2 * h * t; }
  if (k < 12) { return cy - h + 2 * h * (k - 6) / 5; }
  if (k == 12) { return py - e + 2 * e * t; }
  return py;
}
Function zX(k, t) { return -4 + Lz * zx(k, t); }
Function zY(k, t) { return Lz * zy(k, t); }
Function wX(k, t) { return 4 + Lw * (fre(zx(k, t), zy(k, t)) - wcx); }
Function wY(k, t) { return Lw * (fim(zx(k, t), zy(k, t)) - wcy); }
Function num(v) { if (v < -0.005) { return "−" + format(abs(v), 2); } return format(abs(v), 2); }
// Полюс функции (или (99, 99), если его нет)
Function poleX() { if (fn == "inv") { return 0; } if (fn == "mob") { return -1; } return 99; }

Update {
  if (fn == "sq") { fname = "z²"; } if (fn == "exp") { fname = "eᶻ"; } if (fn == "inv") { fname = "1/z"; } if (fn == "mob") { fname = "(z − 1)/(z + 1)"; }
  // Квадрат сетки целиком в левой панели и не накрывает полюс
  C.pos.x = max(-7.6 + Lz * h + 0.1, min(-0.4 - Lz * h - 0.1, C.pos.x));
  C.pos.y = max(-4.6 + Lz * h + 0.1, min(4.6 - Lz * h - 0.1, C.pos.y));
  cx = (C.pos.x + 4) / Lz; cy = C.pos.y / Lz;
  float pl = poleX();
  if (abs(cx - pl) < h + 0.25 && abs(cy) < h + 0.25) {
    // выталкиваем по кратчайшему направлению
    float ox = h + 0.25 - abs(cx - pl); float oy = h + 0.25 - abs(cy);
    if (ox < oy) { if (cx >= pl) { cx = pl + h + 0.25; } else { cx = pl - h - 0.25; } }
    else { if (cy >= 0) { cy = h + 0.25; } else { cy = -h - 0.25; } }
    C.pos.x = -4 + Lz * cx; C.pos.y = Lz * cy;
  }
  P.pos.x = max(-7.6 + 0.3, min(-0.4 - 0.3, P.pos.x)); P.pos.y = max(-4.6 + 0.3, min(4.6 - 0.3, P.pos.y));
  px = (P.pos.x + 4) / Lz; py = P.pos.y / Lz;
  if ((px - pl) ^ 2 + py * py < 0.3 * 0.3) {
    float dl = sqrt((px - pl) ^ 2 + py * py) + 0.000001;
    px = pl + (px - pl) * 0.3 / dl; py = py * 0.3 / dl;
    P.pos.x = -4 + Lz * px; P.pos.y = Lz * py;
  }

  // Масштаб правой панели — по габаритам образа сетки и крестика
  float key = cx * 1000 + cy * 10 + px * 7 + py * 3 + Lz;
  if (fn == "exp") { key = key + 0.1; } if (fn == "inv") { key = key + 0.2; } if (fn == "mob") { key = key + 0.3; }
  if (key != lastKey) {
    float x1 = 1000; float x2 = -1000; float y1 = 1000; float y2 = -1000;
    repeat (14) { float k = i; repeat (9) {
      float u = fre(zx(k, i / 8), zy(k, i / 8)); float v = fim(zx(k, i / 8), zy(k, i / 8));
      x1 = min(x1, u); x2 = max(x2, u); y1 = min(y1, v); y2 = max(y2, v);
    } }
    wcx = (x1 + x2) / 2; wcy = (y1 + y2) / 2;
    Lw = 0.85 * min(7.2 / max(x2 - x1, 0.001), 9.2 / max(y2 - y1, 0.001));
    lastKey = key;
  }
  // оси w: прямая Im w = 0 и Re w = 0 (прячем за край панели, если не попадают)
  float oy = -Lw * wcy; float ox = 4 - Lw * wcx;
  if (abs(oy) > 4.6) { oy = 99; } if (ox < 0.4 || ox > 7.6) { ox = 99; }
  WA.pos.y = oy; WB.pos.y = oy; WC.pos.x = ox; WD.pos.x = ox;
  if (oy == 99) { WA.pos.x = 99; WB.pos.x = 99; } else { WA.pos.x = 0.4; WB.pos.x = 7.6; }
  if (ox == 99) { WC.pos.y = 99; WD.pos.y = 99; } else { WC.pos.y = -4.6; WD.pos.y = 4.6; }

  // f'(P) — модуль (растяжение) и аргумент (поворот)
  float dr = 0; float di = 0;
  if (fn == "sq") { dr = 2 * px; di = 2 * py; }
  if (fn == "exp") { dr = exp(px) * cos(py); di = exp(px) * sin(py); }
  if (fn == "inv") { float r2 = px * px + py * py; dr = -(px * px - py * py) / (r2 * r2); di = 2 * px * py / (r2 * r2); }
  if (fn == "mob") { float qx = px + 1; float r2 = qx * qx + py * py; dr = 2 * (qx * qx - py * py) / (r2 * r2); di = -4 * qx * py / (r2 * r2); }
  float md = sqrt(dr * dr + di * di);

  info = "**Конформное отображение** сохраняет углы между кривыми (и их ориентацию). Аналитическая функция w = f(z) конформна во всех точках, где f′(z) ≠ 0: малая окрестность точки поворачивается на arg f′(z) и растягивается в |f′(z)| раз. Поэтому образы двух семейств прямых сетки (синих и оранжевых) — кривые, которые по-прежнему пересекаются под прямым углом.\n\nВ точке P = " + num(px) + " + " + num(py) + "i:   |f′(P)| = " + num(md) + ", поворот на " + num(atan2(di, dr) * 180 / pi) + "° — крестик в P переходит в такой же прямой крестик.";
  if (fn == "sq" && md < 0.25) { info = info + " Рядом с z = 0, где f′(0) = 0, конформность нарушается: z² удваивает углы."; }
}
]
