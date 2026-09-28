[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Прямоугольный треугольник: угол при A заблокирован в 90° (движок держит его прямым
// при перетаскивании любой вершины). Второе ограничение — постоянное отношение катетов
// AC / AB = k — поддерживается в Update: когда меняется длина одного катета (вершина B или C
// сдвинута вдоль своей стороны — так их и позволяет двигать заблокированный угол), другой катет
// пересчитывается вдоль СВОЕГО текущего направления от A, чтобы отношение не менялось. Вершина A
// свободна и двигает весь треугольник как жёсткое тело — заблокированный угол это уже умеет. ----
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (2, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-5, 3); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

new Angle { name = "angA"; lines = (ab, ca); lock = true }
draw Angle { name = "arcA"; angle = "angA"; measure = false }
new Angle { name = "angB"; lines = (ab, bc) }
draw Angle { name = "arcB"; angle = "angB" }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcC"; angle = "angC" }

new UI { name = "btn45"; type = button; label = "45° · 45° · 90°"; action = "tab = 1; snap()" }
new UI { name = "btn306090"; type = button; label = "30° · 60° · 90°"; action = "tab = 2; snap()" }

// ---- Логика ----
float tab = 1;
// Отношение катетов AC / AB: у равнобедренного оно 1; у 30–60–90 катет против угла в 30°
// (AC, если угол B держим равным 30°) вдвое короче гипотенузы и в √3 раза короче второго катета.
float k = 1;
float pab = 0; float pac = 0;
string info = "";

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

// Наибольший множитель s ∈ [0, 1], при котором A + dir·len·s ещё в поле (dir — единичный вектор).
Function fit(ax, ay, dirx, diry, len) {
  if (inField(ax + dirx * len, ay + diry * len)) { return len; }
  float lo = 0; float hi = len;
  repeat (20) { float mid = (lo + hi) / 2; if (inField(ax + dirx * mid, ay + diry * mid)) { lo = mid; } else { hi = mid; } }
  return lo;
}

// Наибольший общий множитель s ∈ [0, 1], при котором ОБЕ вершины (по своим направлениям
// и желаемым длинам) остаются в поле. Нужен, чтобы у границы поля катет и вершина
// пересчитывались одним и тем же множителем — иначе отношение катетов на границе съезжает.
Function fit2(ax, ay, ux, uy, lenB, vx, vy, lenC) {
  if (inField(ax + ux * lenB, ay + uy * lenB) && inField(ax + vx * lenC, ay + vy * lenC)) { return 1; }
  float lo = 0; float hi = 1;
  repeat (24) {
    float mid = (lo + hi) / 2;
    if (inField(ax + ux * lenB * mid, ay + uy * lenB * mid) && inField(ax + vx * lenC * mid, ay + vy * lenC * mid)) { lo = mid; } else { hi = mid; }
  }
  return lo;
}

// Пересчитать треугольник под текущее k, сохранив длину AB.
Function snap() {
  k = 1; if (tab == 2) { k = 1 / sqrt(3); }
  float uabx = (B.pos.x - A.pos.x) / max(ab.length, 0.0001); float uaby = (B.pos.y - A.pos.y) / max(ab.length, 0.0001);
  float uacx = (C.pos.x - A.pos.x) / max(ca.length, 0.0001); float uacy = (C.pos.y - A.pos.y) / max(ca.length, 0.0001);
  float wantC = ab.length * k;
  float s = fit2(A.pos.x, A.pos.y, uabx, uaby, ab.length, uacx, uacy, wantC);
  B.pos.x = A.pos.x + uabx * ab.length * s; B.pos.y = A.pos.y + uaby * ab.length * s;
  C.pos.x = A.pos.x + uacx * wantC * s; C.pos.y = A.pos.y + uacy * wantC * s;
  return 0;
}

Start {
  snap();
  pab = ab.length; pac = ca.length;
}

Update {
  float curAB = ab.length; float curAC = ca.length;
  float uabx = (B.pos.x - A.pos.x) / max(curAB, 0.0001); float uaby = (B.pos.y - A.pos.y) / max(curAB, 0.0001);
  float uacx = (C.pos.x - A.pos.x) / max(curAC, 0.0001); float uacy = (C.pos.y - A.pos.y) / max(curAC, 0.0001);
  if (abs(curAB - pab) > 0.00001) {
    // Двигали B: пересчитываем C под то же отношение k. У границы поля общий множитель s
    // (fit2) чуть сжимает ОБА катета сразу, чтобы отношение не съехало.
    float wantC = curAB * k;
    if (abs(wantC - curAC) > 0.00001) {
      float s = fit2(A.pos.x, A.pos.y, uabx, uaby, curAB, uacx, uacy, wantC);
      B.pos.x = A.pos.x + uabx * curAB * s; B.pos.y = A.pos.y + uaby * curAB * s;
      C.pos.x = A.pos.x + uacx * wantC * s; C.pos.y = A.pos.y + uacy * wantC * s;
    }
  } else if (abs(curAC - pac) > 0.00001) {
    float wantB = curAC / k;
    if (abs(wantB - curAB) > 0.00001) {
      float s = fit2(A.pos.x, A.pos.y, uacx, uacy, curAC, uabx, uaby, wantB);
      C.pos.x = A.pos.x + uacx * curAC * s; C.pos.y = A.pos.y + uacy * curAC * s;
      B.pos.x = A.pos.x + uabx * wantB * s; B.pos.y = A.pos.y + uaby * wantB * s;
    }
  }
  pab = ab.length; pac = ca.length;

  if (tab == 1) {
    info = "**Равнобедренный прямоугольный треугольник (45° · 45° · 90°):** катеты равны, AB = AC = " + format(ab.length, 2) + ", гипотенуза BC = " + format(bc.length, 2) + " = AB·√2 ≈ " + format(ab.length * sqrt(2), 2) + ".\n\nПлощадь S = AB² / 2 = " + format(ab.length * ab.length / 2, 2) + ".";
  } else {
    info = "**Треугольник с углами 30° · 60° · 90°:** меньший катет (против угла 30°) AC = " + format(ca.length, 2) + ", вдвое короче гипотенузы BC = " + format(bc.length, 2) + " ≈ 2·AC = " + format(2 * ca.length, 2) + ", больший катет AB = " + format(ab.length, 2) + " = AC·√3 ≈ " + format(ca.length * sqrt(3), 2) + ".\n\nПлощадь S = AB·AC / 2 = " + format(ab.length * ca.length / 2, 2) + ".";
  }
}
]
