[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Окружность инверсии ω: центр O, радиус k задаётся точкой K ----
new Point { name = "O"; pos = (-2, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "K"; pos = (0.5, 0); text = true("K"); pauseOnDrag = false }
new Circle { name = "omega"; center = O; radius = K; thickness = 1.5 }

// ---- Исходная окружность: центр S, радиус задаётся точкой T; M — точка на ней ----
new Point { name = "S"; pos = (2.5, 0.5); text = true("S"); pauseOnDrag = false; color = #f59e0b }
new Point { name = "T"; pos = (4, 0.5); pauseOnDrag = false; color = #f59e0b; size = 0.8 }
new Circle { name = "src"; center = S; radius = T; color = #f59e0b; thickness = 3 }
new Point { name = "M"; circle = "src"; t = 0.3; text = true("M"); pauseOnDrag = false; color = #f59e0b; collideWithPoints = false }

// ---- Образ: окружность (центр IC, через M') или прямая (через L1, L2) ----
new Point { name = "M2"; pos = (0, 0); dynamic = false; collision = false; text = true("M′"); color = #3b82f6 }
new Point { name = "IC"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "img"; center = IC; radius = M2; color = #3b82f6; thickness = 3 }
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "imgLine"; pos = (L1, L2); color = #3b82f6; thickness = 3; interact = false }
new Claster { name = "asCircle"; elements = (img); active = true }
new Claster { name = "asLine"; elements = (imgLine); active = false }

// Луч из центра инверсии через M и M'
new Point { name = "RE"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "ray"; pos = (O, RE); active = false }
draw Punctir { name = "pray"; edge = "ray"; layer = 1 }

// ---- Логика ----
string info = "";
float k = 2.5; float d = 0; float r = 0;
float onO = 0;
float pSx = 2.5; float pSy = 0.5;

Update {
  // Радиус инверсии 1…4.5
  float kx = K.pos.x - O.pos.x; float ky = K.pos.y - O.pos.y; k = sqrt(kx * kx + ky * ky);
  if (k < 1 || k > 4.5) { float kk = min(max(k, 1), 4.5); K.pos.x = O.pos.x + kx * kk / (k + 0.000001); K.pos.y = O.pos.y + ky * kk / (k + 0.000001); k = kk; }

  // Перетаскивание S переносит окружность целиком (T едет вместе с центром)
  T.pos.x = T.pos.x + S.pos.x - pSx; T.pos.y = T.pos.y + S.pos.y - pSy;
  // Исходная окружность: радиус не меньше 0.4; центр не совпадает с O
  float tx = T.pos.x - S.pos.x; float ty = T.pos.y - S.pos.y; r = sqrt(tx * tx + ty * ty);
  if (r < 0.4) { T.pos.x = S.pos.x + 0.4; T.pos.y = S.pos.y; r = 0.4; }
  float sx = S.pos.x - O.pos.x; float sy = S.pos.y - O.pos.y; d = sqrt(sx * sx + sy * sy);
  if (d < 0.3) { S.pos.x = O.pos.x + 0.3; S.pos.y = O.pos.y; sx = 0.3; sy = 0; d = 0.3; }
  // Окружность почти проходит через O — «примагничиваем»: ровно через O
  onO = 0;
  if (abs(d - r) < 0.2) {
    T.pos.x = S.pos.x + tx * d / r; T.pos.y = S.pos.y + ty * d / r; r = d; onO = 1;
  }
  pSx = S.pos.x; pSy = S.pos.y;
  // M не должна совпасть с O (у неё нет образа) — сдвигаем по окружности
  if (onO == 1 && sqrt((M.pos.x - O.pos.x) ^ 2 + (M.pos.y - O.pos.y) ^ 2) < 0.6) { M.t = M.t + 0.08; }

  // Образ точки M: на луче OM, |OM|·|OM'| = k²
  float mx = M.pos.x - O.pos.x; float my = M.pos.y - O.pos.y; float m2 = mx * mx + my * my + 0.000001;
  M2.pos.x = O.pos.x + k * k * mx / m2; M2.pos.y = O.pos.y + k * k * my / m2;
  float far = max(sqrt(m2), sqrt((M2.pos.x - O.pos.x) ^ 2 + (M2.pos.y - O.pos.y) ^ 2)) + 1;
  RE.pos.x = O.pos.x + mx / sqrt(m2) * far; RE.pos.y = O.pos.y + my / sqrt(m2) * far;

  if (onO == 1) {
    // Образ — прямая, перпендикулярная OS, на расстоянии k²/(2r) от O
    asCircle.active = false; asLine.active = true;
    float h = k * k / (2 * d); float ux = sx / d; float uy = sy / d;
    L1.pos.x = O.pos.x + ux * h - uy * 30; L1.pos.y = O.pos.y + uy * h + ux * 30;
    L2.pos.x = O.pos.x + ux * h + uy * 30; L2.pos.y = O.pos.y + uy * h - ux * 30;
  } else {
    // Образ — окружность с центром на прямой OS: IC = O + k²/(d² − r²)·(S − O)
    asCircle.active = true; asLine.active = false;
    float q = k * k / (d * d - r * r);
    IC.pos.x = O.pos.x + q * sx; IC.pos.y = O.pos.y + q * sy;
  }

  if (onO == 1) {
    info = "**Окружность, проходящая через центр инверсии, переходит в прямую**, не проходящую через центр: самой точке O на окружности соответствует бесконечно удалённая точка.\n\nОбраз точки M — точка M′ на луче OM, причём OM · OM′ = k² = " + format(k * k, 2) + ".";
  } else {
    float rr = k * k * r / abs(d * d - r * r);
    info = "**Окружность, не проходящая через центр инверсии, переходит в окружность.** Центр образа лежит на прямой OS, но не совпадает с образом центра S.\n\nОбраз точки M — точка M′ на луче OM: OM · OM′ = " + format(sqrt((M.pos.x - O.pos.x) ^ 2 + (M.pos.y - O.pos.y) ^ 2), 2) + " · " + format(sqrt((M2.pos.x - O.pos.x) ^ 2 + (M2.pos.y - O.pos.y) ^ 2), 2) + " = k² = " + format(k * k, 2) + ". Радиус исходной окружности " + format(r, 2) + ", образа — " + format(rr, 2) + ".\n\nЧтобы увидеть переход в прямую, проведите исходную окружность через O.";
  }
}
]
