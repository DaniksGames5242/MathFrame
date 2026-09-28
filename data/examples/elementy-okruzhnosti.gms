[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

new Point { name = "O"; pos = (0, 0); text = true("O"); dynamic = false; collision = false }
new Circle { name = "w"; center = "O"; radius = 4 }

// ---- Вкладка 1: радиус, диаметр, хорда. P — на окружности, Q — вычисляемая
// диаметрально противоположная точка. C, D — независимые точки хорды. ----
new Point { name = "P"; circle = "w"; t = 0.02; text = true("P") }
new Point { name = "Q"; pos = (0, 0); dynamic = false; collision = false; text = true("Q") }
new Line { name = "opq"; pos = (P, Q); interact = false }
new Point { name = "C"; circle = "w"; t = 0.2; text = true("C") }
new Point { name = "D"; circle = "w"; t = 0.42; text = true("D") }
new Line { name = "cd"; pos = (C, D); interact = false }
new Point { name = "H1"; construct = altitude; vertex = O; base = "cd"; dynamic = false; collision = false; text = true("H") }
new Line { name = "oh1"; pos = (O, "H1"); interact = false; color = "transparent" }
new Claster { name = "tab1"; elements = (P, Q, opq, C, D, cd, H1, oh1); active = true }

// ---- Вкладка 2: дуга. E, F — концы, M — вычисляемая точка внутри малой дуги для её отрисовки. ----
new Point { name = "E"; circle = "w"; t = 0.05; text = true("E") }
new Point { name = "F"; circle = "w"; t = 0.3; text = true("F") }
new Point { name = "Mm"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "oe"; pos = (O, E); interact = false; color = "transparent" }
new Line { name = "of"; pos = (O, F); interact = false; color = "transparent" }
draw Arc { name = "minorArc"; points = (E, Mm, F); color = #f59e0b; thickness = 4 }
new Claster { name = "tab2"; elements = (E, F, minorArc, oe, of); active = false }

// ---- Вкладка 3: касательная и секущая из внешней точки T. T1, T2 — точки касания,
// S1, S2 — точки пересечения секущей TS с окружностью. ----
new Point { name = "T"; pos = (7, 3); text = true("T") }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; text = true("T₁") }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; text = true("T₂") }
new Line { name = "tt1"; pos = (T, "T1"); interact = false }
new Line { name = "tt2"; pos = (T, "T2"); interact = false }
new Point { name = "Send"; circle = "w"; t = 0.55; text = true("S₂") }
new Point { name = "S1"; pos = (0, 0); dynamic = false; collision = false; text = true("S₁") }
new Line { name = "secLine"; pos = (T, Send); interact = false; color = #22c55e }
new Claster { name = "tab3"; elements = (T, T1, T2, tt1, tt2, Send, S1, secLine); active = false }

new UI { name = "b1"; type = button; label = "Радиус и хорда"; action = "tab = 1; tab1.active = true; tab2.active = false; tab3.active = false" }
new UI { name = "b2"; type = button; label = "Дуга"; action = "tab = 2; tab1.active = false; tab2.active = true; tab3.active = false" }
new UI { name = "b3"; type = button; label = "Касательная и секущая"; action = "tab = 3; tab1.active = false; tab2.active = false; tab3.active = true" }

// ---- Логика ----
float tab = 1;
float R = 4;
string info = "";

Update {
  Q.pos.x = -P.pos.x; Q.pos.y = -P.pos.y;

  float hx = H1.pos.x; float hy = H1.pos.y;
  float oh = sqrt(hx * hx + hy * hy);
  float cdLen = cd.length;

  float aE = atan2(E.pos.y, E.pos.x); float aF = atan2(F.pos.y, F.pos.x);
  float diff = aF - aE;
  while (diff > 3.14159265358979) { diff = diff - 2 * 3.14159265358979; }
  while (diff < -3.14159265358979) { diff = diff + 2 * 3.14159265358979; }
  float mid = aE + diff / 2;
  Mm.pos.x = R * cos(mid); Mm.pos.y = R * sin(mid);
  float arcDeg = abs(diff) * 180 / 3.14159265358979;

  // Внешняя точка T: если случайно оказалась внутри круга — выталкиваем на минимальное
  // безопасное расстояние вдоль того же направления.
  float dT = sqrt(T.pos.x * T.pos.x + T.pos.y * T.pos.y);
  if (dT < R + 0.6) { float k = (R + 0.6) / max(dT, 0.001); T.pos.x = T.pos.x * k; T.pos.y = T.pos.y * k; dT = R + 0.6; }
  float tanLen = sqrt(dT * dT - R * R);
  float baseAng = atan2(T.pos.y, T.pos.x);
  float off = atan2(tanLen, R);
  T1.pos.x = R * cos(baseAng + off); T1.pos.y = R * sin(baseAng + off);
  T2.pos.x = R * cos(baseAng - off); T2.pos.y = R * sin(baseAng - off);

  // Секущая T-Send: Send всегда на окружности (точка на объекте), поэтому прямая
  // всегда пересекает окружность второй раз — вычисляем эту вторую точку S1.
  float dx = Send.pos.x - T.pos.x; float dy = Send.pos.y - T.pos.y;
  float A2 = dx * dx + dy * dy;
  float B2 = 2 * (T.pos.x * dx + T.pos.y * dy);
  float C2 = T.pos.x * T.pos.x + T.pos.y * T.pos.y - R * R;
  float Disc = B2 * B2 - 4 * A2 * C2;
  if (Disc < 0) { Disc = 0; }
  float sq = sqrt(Disc);
  float tA = (-B2 - sq) / (2 * A2); float tB = (-B2 + sq) / (2 * A2);
  // Один из корней близок к 1 (это сама точка Send) — берём другой.
  float tOther = tA; if (abs(tA - 1) < abs(tB - 1)) { tOther = tB; }
  S1.pos.x = T.pos.x + dx * tOther; S1.pos.y = T.pos.y + dy * tOther;
  float sFull = sqrt((Send.pos.x - T.pos.x) * (Send.pos.x - T.pos.x) + (Send.pos.y - T.pos.y) * (Send.pos.y - T.pos.y));
  float eExt = sqrt((S1.pos.x - T.pos.x) * (S1.pos.x - T.pos.x) + (S1.pos.y - T.pos.y) * (S1.pos.y - T.pos.y));
  if (eExt > sFull) { float tmp = eExt; eExt = sFull; sFull = tmp; }
  float tanLen2 = sqrt(dT * dT - R * R);

  if (tab == 1) {
    info = "**Радиус** OP = " + format(R, 2) + " — отрезок от центра до точки окружности; **диаметр** PQ = " + format(2 * R, 2) + " — хорда через центр, вдвое длиннее радиуса.\n\n**Хорда** CD = " + format(cdLen, 2) + ", перпендикуляр из центра OH = " + format(oh, 2) + " делит её пополам: CH = HD = " + format(cdLen / 2, 2) + ".";
  } else if (tab == 2) {
    info = "**Дуга EF** (выделена оранжевым) — часть окружности между E и F; её градусная мера равна центральному углу ∠EOF = " + format(arcDeg, 1) + "°. Оставшаяся часть окружности — большая дуга — равна " + format(360 - arcDeg, 1) + "°.";
  } else {
    info = "**Касательные из T:** TT₁ = TT₂ = " + format(tanLen2, 2) + " — отрезки касательных из одной внешней точки равны, и в точках касания T₁, T₂ они перпендикулярны радиусам.\n\n**Секущая из T:** вся секущая TS₂ = " + format(sFull, 2) + ", внешняя часть TS₁ = " + format(eExt, 2) + ". Проверка: TT₁² = " + format(tanLen2 * tanLen2, 2) + ", TS₁ · TS₂ = " + format(eExt * sFull, 2) + " — совпадают (степень точки T).";
  }
}
]
