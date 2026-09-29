[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Центр инверсии O = (0, 0), окружность ω радиуса √k; прямая l — через точку Q под углом α ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
float k = 6; float rad = 2.45; float al = 30;
new Circle { name = "omega"; center = O; radius = rad; thickness = 1.5 }
new Point { name = "Q"; pos = (-2.5, 2.2); text = true("Q"); pauseOnDrag = false; color = #f59e0b; collideWithPoints = false }
new Point { name = "a"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "b"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "l"; pos = (a, b); color = #f59e0b; thickness = 3; interact = false }
new Point { name = "M"; pos = (0, 0); pauseOnDrag = false; text = true("M"); color = #f59e0b; collideWithPoints = false }
new Point { name = "M2"; pos = (0, 0); dynamic = false; collision = false; text = true("M′"); color = #3b82f6 }
new Line { name = "ray"; pos = (O, M2); interact = false }
new Line { name = "ray2"; pos = (O, M); interact = false }

// Образ: окружность с диаметром OF′ (F — основание перпендикуляра из O на l)
float cx = 0; float cy = 0; float q = 1; float dist = 1; float thru = 0;
new Curve { name = "img"; type = parametric; x = "cx + q * cos(6.2831853 * t)"; y = "cy + q * sin(6.2831853 * t)"; segments = 160; color = #3b82f6; thickness = 3; active = thru < 0.5 }

new UI { type = slider; label = "угол прямой, °"; variable = al; min = 0; max = 179; step = 1; default = 30 }
new UI { type = slider; label = "k"; variable = k; min = 2; max = 12; step = 0.5; default = 6 }

string info = ""; float sM = 1.5; float lsM = 1.5; float lqx = -2.5; float lqy = 2.2;

Function inF(x, y) { if (abs(x) > fieldMaxX - 0.2 || abs(y) > fieldMaxY - 0.2) { return 0; } return 1; }
// Точка M = (mx, my) допустима: сама и её образ в поле, и M не в центре
Function okM(mx, my) {
  float d2 = mx * mx + my * my;
  if (d2 < 0.36) { return 0; }
  if (inF(mx, my) < 0.5) { return 0; }
  return inF(k * mx / d2, k * my / d2);
}

Update {
  rad = sqrt(k);
  float ux = cos(al * 3.14159265 / 180); float uy = sin(al * 3.14159265 / 180);
  // Прямая через центр: если Q почти на прямой через O, Q ложится точно на неё
  float sd = Q.pos.x * (-uy) + Q.pos.y * ux;
  thru = 0;
  if (abs(sd) < 0.3) { float pr = Q.pos.x * ux + Q.pos.y * uy; Q.pos.x = pr * ux; Q.pos.y = pr * uy; sd = 0; thru = 1; }
  float px = Q.pos.x; float py = Q.pos.y;
  a.pos.x = px - 30 * ux; a.pos.y = py - 30 * uy; b.pos.x = px + 30 * ux; b.pos.y = py + 30 * uy;
  // M ездит по прямой: параметр s — расстояние вдоль l от основания перпендикуляра F
  float g = 1; if (sd < 0) { g = -1; }
  float fx = -uy * sd; float fy = ux * sd;
  float s = (M.pos.x - fx) * ux + (M.pos.y - fy) * uy;
  float mx = fx + s * ux; float my = fy + s * uy;
  if (okM(mx, my) < 0.5) {
    // скольжение: пробуем ближайшие допустимые s в сторону последнего
    float s2 = lsM; mx = fx + s2 * ux; my = fy + s2 * uy;
    if (okM(mx, my) < 0.5) {
      // сдвинулись Q, α или k — ищем допустимое s
      float found = 0;
      repeat (60) { if (found < 0.5) { float sc = (i - 30) * 0.4; if (okM(fx + sc * ux, fy + sc * uy) > 0.5) { s2 = sc; found = 1; } } }
      mx = fx + s2 * ux; my = fy + s2 * uy;
    }
    s = s2;
  }
  M.pos.x = mx; M.pos.y = my; lsM = s;
  float dm = mx * mx + my * my;
  M2.pos.x = k * mx / dm; M2.pos.y = k * my / dm;
  dist = abs(sd);
  string t = "";
  if (thru > 0.5) {
    t = "**Прямая через центр инверсии переходит в себя** (без самого центра): каждая точка остаётся на своём луче из O. Центр O образа не имеет.\n\nM и M′ лежат на прямой по одну сторону от O: OM · OM′ = " + format(sqrt(dm) * sqrt(M2.pos.x ^ 2 + M2.pos.y ^ 2), 2) + " = k.";
  } else {
    q = k / (2 * dist); cx = -uy * g * q; cy = ux * g * q;
    float om = sqrt(dm);
    float chk = sqrt((M2.pos.x - cx) ^ 2 + (M2.pos.y - cy) ^ 2);
    t = "**Прямая, не проходящая через центр, переходит в окружность через центр O** (сам O выколот). Расстояние от O до прямой " + format(dist, 2) + ", диаметр образа k / " + format(dist, 2) + " = " + format(k / dist, 2) + ", радиус " + format(q, 2) + ".\n\nОбраз M′ точки M лежит на окружности: расстояние от центра образа до M′ равно " + format(chk, 2) + ", радиус " + format(q, 2) + ". OM · OM′ = " + format(om, 2) + " · " + format(k / om, 2) + " = " + format(k, 1) + ".\n\nЧтобы увидеть прямую, проходящую через центр, приблизьте точку Q к прямой через O.";
  }
  info = t;
}
]
