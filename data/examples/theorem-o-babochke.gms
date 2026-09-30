[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Хорды AC и DE окружности пересекаются в точке B внутри неё. Все четыре конца хорд
// перетаскиваются по окружности; чередование A, D, C, E сохраняется (концы не проходят друг
// через друга), поэтому хорды всегда пересекаются внутри круга. ----
new Circle { name = "w"; center = (0, 0); radius = 5; thickness = 2; interact = false }
new Point { name = "A"; pos = (-4.33, 2.5); text = true("A"); pauseOnDrag = false }
new Point { name = "D"; pos = (-1.71, -4.7); text = true("D"); pauseOnDrag = false }
new Point { name = "C"; pos = (4.41, -2.36); text = true("C"); pauseOnDrag = false }
new Point { name = "E"; pos = (2.65, 4.24); text = true("E"); pauseOnDrag = false }
new Point { name = "B"; pos = (0, 0); dynamic = false; collision = false; text = true("B"); color = #f59e0b }
new Line { name = "ac"; pos = (A, C) }
new Line { name = "de"; pos = (D, E) }

// ---- Вкладка 2: подобные треугольники ABE и DBC ----
new Line { name = "ae"; pos = (A, E); color = #3b82f6; interact = false; layer = 3 }
new Line { name = "dc"; pos = (D, C); color = #22c55e; interact = false; layer = 3 }
new Claster { name = "tabSim"; elements = (ae, dc); active = false }

new UI { name = "btnProd"; type = button; label = "Произведения отрезков"; action = "tab = 1; tabSim.active = false" }
new UI { name = "btnSim"; type = button; label = "Подобные треугольники"; action = "tab = 2; tabSim.active = true" }

float tab = 1; string info = "";
float R = 5; float g = 0.25; float twoPi = 6.283185307179586;
float ta = 2.62; float td = 4.36; float tc = 5.78; float te = 7.33;

Function dist(x1, y1, x2, y2) { return sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)); }
// Новый угол вершины: непрерывно от прежнего значения p (без скачков на 2π).
Function unwrap(x, y, p) {
  float d = atan2(y, x) - p;
  d = d - twoPi * round(d / twoPi);
  return p + d;
}
Function clamp(v, lo, hi) { if (v < lo) { return lo; } if (v > hi) { return hi; } return v; }

Update {
  float ma = abs(A.pos.x - R * cos(ta)) + abs(A.pos.y - R * sin(ta));
  float md = abs(D.pos.x - R * cos(td)) + abs(D.pos.y - R * sin(td));
  float mc = abs(C.pos.x - R * cos(tc)) + abs(C.pos.y - R * sin(tc));
  float me = abs(E.pos.x - R * cos(te)) + abs(E.pos.y - R * sin(te));
  float m = max(ma, md, mc, me);
  if (m > 0.000001) {
    // Двигается вершина с наибольшим смещением: её угол ограничен соседями по кругу.
    if (ma == m) { ta = clamp(unwrap(A.pos.x, A.pos.y, ta), te - twoPi + g, td - g); }
    else if (md == m) { td = clamp(unwrap(D.pos.x, D.pos.y, td), ta + g, tc - g); }
    else if (mc == m) { tc = clamp(unwrap(C.pos.x, C.pos.y, tc), td + g, te - g); }
    else { te = clamp(unwrap(E.pos.x, E.pos.y, te), tc + g, ta + twoPi - g); }
    A.pos.x = R * cos(ta); A.pos.y = R * sin(ta); D.pos.x = R * cos(td); D.pos.y = R * sin(td);
    C.pos.x = R * cos(tc); C.pos.y = R * sin(tc); E.pos.x = R * cos(te); E.pos.y = R * sin(te);
  }
  // Точка пересечения хорд AC и DE.
  float ux = C.pos.x - A.pos.x; float uy = C.pos.y - A.pos.y;
  float vx = E.pos.x - D.pos.x; float vy = E.pos.y - D.pos.y;
  float s = ((D.pos.x - A.pos.x) * vy - (D.pos.y - A.pos.y) * vx) / (ux * vy - uy * vx);
  B.pos.x = A.pos.x + s * ux; B.pos.y = A.pos.y + s * uy;

  float ab = dist(A.pos.x, A.pos.y, B.pos.x, B.pos.y); float bc = dist(B.pos.x, B.pos.y, C.pos.x, C.pos.y);
  float db = dist(D.pos.x, D.pos.y, B.pos.x, B.pos.y); float be = dist(B.pos.x, B.pos.y, E.pos.x, E.pos.y);
  float ob = dist(0, 0, B.pos.x, B.pos.y);
  if (tab == 1) {
    info = "**Теорема:** если хорды AC и DE пересекаются в точке B внутри окружности, то AB · BC = DB · BE.\n\n**AB · BC** = " + format(ab, 2) + " · " + format(bc, 2) + " = " + format(ab * bc, 2) + "\n\n**DB · BE** = " + format(db, 2) + " · " + format(be, 2) + " = " + format(db * be, 2) + "\n\nЭто степень точки B: R² − OB² = " + format(R * R, 2) + " − " + format(ob * ob, 2) + " = " + format(R * R - ob * ob, 2) + ". Когда B — центр, хорды делятся пополам и произведения равны R².";
  } else {
    info = "**Треугольники ABE и DBC подобны:** ∠AEB = ∠DCB как вписанные углы, опирающиеся на дугу AD, ∠ABE = ∠DBC как вертикальные.\n\n**Из подобия** AB / DB = BE / BC: " + format(ab, 2) + " / " + format(db, 2) + " = " + format(ab / db, 3) + ", " + format(be, 2) + " / " + format(bc, 2) + " = " + format(be / bc, 3) + ".\n\nПерекрёстное умножение даёт AB · BC = DB · BE.";
  }
}
]
