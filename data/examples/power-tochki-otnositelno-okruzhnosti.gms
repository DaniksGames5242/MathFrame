[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Окружность (O, r), точка M и секущая MP: вторая точка Q — на пересечении MP с окружностью.
// Из M — обе касательные (когда M вне окружности). ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Circle { name = "w"; center = O; radius = r }
new Point { name = "M"; pos = (6, 2.5); text = true("M"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "P"; circle = "w"; t = 0.12; text = true("P"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Q"; pos = (0, 0); dynamic = false; collision = false; text = true("Q") }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; text = true("T"); active = act > 0.5 }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; text = true("T′"); active = act > 0.5 }
new Line { name = "mp"; pos = (M, P); color = #3b82f6; thickness = 3; interact = false; layer = 5 }
new Line { name = "mq"; pos = (M, Q); color = #f59e0b; thickness = 3; interact = false; layer = 4 }
new Line { name = "mt1"; pos = (M, T1); color = #22c55e; thickness = 2; interact = false; active = act > 0.5 }
new Line { name = "mt2"; pos = (M, T2); color = #22c55e; thickness = 2; interact = false; active = act > 0.5 }

new UI { type = slider; label = "радиус r"; variable = r; min = 1.5; max = 5; step = 0.1; default = 3 }

float r = 3; float act = 0; string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float d2 = M.pos.x * M.pos.x + M.pos.y * M.pos.y;
  float pw = d2 - r * r;
  float dx = P.pos.x - M.pos.x; float dy = P.pos.y - M.pos.y;
  float l2 = dx * dx + dy * dy;
  float tq = 0;
  if (l2 > 0.000001) { tq = pw / l2; }
  float qx = M.pos.x + tq * dx; float qy = M.pos.y + tq * dy;
  if (abs(Q.pos.x - qx) + abs(Q.pos.y - qy) > 0.00001) { Q.pos.x = qx; Q.pos.y = qy; }
  float mpl = sqrt(l2); float mql = abs(tq) * mpl;
  act = 0;
  if (pw > 0.02) {
    act = 1;
    float k = r * r / d2; float h = r * sqrt(pw) / d2;
    float t1x = k * M.pos.x - h * M.pos.y; float t1y = k * M.pos.y + h * M.pos.x;
    float t2x = k * M.pos.x + h * M.pos.y; float t2y = k * M.pos.y - h * M.pos.x;
    if (abs(T1.pos.x - t1x) + abs(T1.pos.y - t1y) + abs(T2.pos.x - t2x) + abs(T2.pos.y - t2y) > 0.00001) {
      T1.pos.x = t1x; T1.pos.y = t1y; T2.pos.x = t2x; T2.pos.y = t2y;
    }
  }
  info = "**Степень точки M** относительно окружности с центром O и радиусом r = " + format(r, 1) + ": p = OM² − r² = " + format(sqrt(d2), 2) + "² − " + format(r, 1) + "² = " + num(pw, 2) + ".\n\n";
  if (pw > 0.02) {
    info = info + "**M вне окружности, p > 0.** Произведение отрезков секущей MP · MQ = " + format(mpl, 2) + " · " + format(mql, 2) + " = " + format(mpl * mql, 2) + " равно p и не зависит от выбора секущей; оно же равно квадрату касательной: MT² = " + format(pw, 2) + ", MT = " + format(sqrt(pw), 2) + ".";
  } else if (pw < -0.02) {
    info = info + "**M внутри окружности, p < 0.** Произведение отрезков хорды PQ, проходящей через M: MP · MQ = " + format(mpl, 2) + " · " + format(mql, 2) + " = " + format(mpl * mql, 2) + " = |p|.";
  } else {
    info = info + "**M на окружности, p = 0:** один из отрезков секущей нулевой, и произведение MP · MQ = 0.";
  }
}
]
