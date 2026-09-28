[
description = "{info}"

field width = 14; field height = 14;
camera type = fixed;

// ---- Угол AOB: вершина O в центре, сторона OA неподвижна (вправо), сторона OB
// вращается вокруг O — точка B перетаскивается по окружности вокруг O. Величина угла
// меняется от 0° до 360°, проходя все виды классификации. ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "A"; pos = (5, 0); dynamic = false; collision = false; text = true("A") }
new Circle { name = "circw"; center = O; radius = 5; active = false; interact = false }
new Point { name = "B"; circle = "circw"; t = 0.12; text = true("B") }

new Line { name = "oa"; pos = (O, A); interact = false }
new Line { name = "ob"; pos = (O, B); interact = false }
new Angle { name = "angAOB"; lines = (oa, ob) }
draw Angle { name = "arc"; angle = "angAOB" }

// ---- Логика: величина угла — только по положению точки B на окружности ----
float deg = 0;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float bx = B.pos.x - O.pos.x; float by = B.pos.y - O.pos.y;
  float rd = atan2(by, bx);
  if (rd < 0) { rd = rd + 6.2831853; }
  deg = rd * 180 / 3.14159265;

  string vid = "";
  if (deg < 0.5 || deg > 359.5) { vid = "**нулевой** — стороны совпадают, начало отсчёта поворота"; }
  else if (deg < 90) { vid = "**острый** — меньше прямого"; }
  else if (deg < 90.5 && deg > 89.5) { vid = "**прямой** — ровно половина развёрнутого"; }
  else if (deg < 180) { vid = "**тупой** — больше прямого, меньше развёрнутого"; }
  else if (deg < 180.5 && deg > 179.5) { vid = "**развёрнутый** — стороны OA и OB стали противоположными лучами"; }
  else { vid = "**выпуклый** — больше развёрнутого, меньше полного"; }

  info = "**Угол AOB = " + num(deg, 0) + "°.** Вид: " + vid + ".\n\n0° < острый < 90° < тупой < 180° < выпуклый < 360°; 90° — прямой, 180° — развёрнутый, 360° — полный (совпадает с нулевым по положению сторон, но получен полным оборотом).";
}
]
