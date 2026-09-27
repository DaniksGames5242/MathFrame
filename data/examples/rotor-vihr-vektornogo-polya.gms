[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true;

// ---- Векторное поле F = (P, Q) и «колёсико» W, помещённое в поток: оно вращается
// с угловой скоростью rot F / 2 в точке W (против часовой стрелки при rot F > 0) ----
draw Field { name = "fld"; P = "fp(x, y)"; Q = "fq(x, y)"; xmin = -8; xmax = 8; ymin = -5; ymax = 5; grid = 25; scale = 1.3; color = #6b7280 }
// Частицы, переносимые потоком: по их скорости видно, где поле сильнее
draw Graph { name = "gPart"; graph = "gpt"; nodeColor = #3b82f6; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 30 }
new Point { name = "W"; pos = (2.5, 1.5); text = true("W"); pauseOnDrag = false; color = #f59e0b; size = 0.8; layer = 60 }
new Point { name = "S1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "S2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "S3"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "S4"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "k1"; pos = (S1, S3); color = #f59e0b; thickness = 4; interact = false; layer = 55 }
new Line { name = "k2"; pos = (S2, S4); color = #f59e0b; thickness = 4; interact = false; layer = 55 }
new Point { name = "RR"; pos = (3.5, 1.5); dynamic = false; collision = false; active = false }
new Circle { name = "rim"; center = W; radius = RR; color = #f59e0b; thickness = 2 }

new UI { name = "sF"; type = select; label = "поле F"; variable = fn; options = ("vort", "shear", "free", "saddle"); labels = ("(−y, x)/3 — вращение", "(y/2, 0) — сдвиг", "(−y, x)/(x² + y²) — вихрь в 0", "(x, −y)/3 — седло"); default = "shear" }

// ---- Логика ----
string fn = "shear";
float ang = 0;
float rho = 1;
string info = "";
float NP = 60;
list qx = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list qy = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list qa = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
float seeded = 0;
Function reseed(k) { qx[k] = -7.8 + 15.6 * random(); qy[k] = -4.8 + 9.6 * random(); qa[k] = floor(random() * 120); return 0; }

Function fp(x, y) {
  if (fn == "vort") { return -y / 3; }
  if (fn == "shear") { return y / 2; }
  if (fn == "free") { return -y / (x * x + y * y + 0.0001); }
  return x / 3;
}
Function fq(x, y) {
  if (fn == "vort") { return x / 3; }
  if (fn == "shear") { return 0; }
  if (fn == "free") { return x / (x * x + y * y + 0.0001); }
  return -y / 3;
}
Function num(v) { if (abs(v) < 0.005) { return "0"; } if (v < 0) { return "−" + format(abs(v), 2); } return format(v, 2); }

Update {
  // Частицы: шаг Эйлера по полю, старые и вылетевшие — заново в случайное место
  if (seeded == 0) { repeat (NP) { reseed(i); } seeded = 1; }
  gpt = newGraph();
  repeat (NP) {
    float vx = fp(qx[i], qy[i]); float vy = fq(qx[i], qy[i]);
    float sp = sqrt(vx * vx + vy * vy); if (sp > 3) { vx = vx * 3 / sp; vy = vy * 3 / sp; }
    qx[i] = qx[i] + vx * 0.04; qy[i] = qy[i] + vy * 0.04; qa[i] = qa[i] + 1;
    if (abs(qx[i]) > 7.9 || abs(qy[i]) > 4.9 || qa[i] > 160) { reseed(i); }
    addNode(gpt, "q" + format(i, 0), [qx[i], qy[i]]);
  }
  // Колёсико целиком в поле; в поле вихря — не накрывает особую точку 0
  W.pos.x = max(-6.8, min(6.8, W.pos.x)); W.pos.y = max(-3.8, min(3.8, W.pos.y));
  if (fn == "free") { float d = sqrt(W.pos.x ^ 2 + W.pos.y ^ 2); if (d < rho + 0.3) { if (d < 0.001) { W.pos.x = 1; d = 1; } W.pos.x = W.pos.x * (rho + 0.3) / d; W.pos.y = W.pos.y * (rho + 0.3) / d; } }
  float x = W.pos.x; float y = W.pos.y;
  // rot F = ∂Q/∂x − ∂P/∂y (численно)
  float h = 0.001;
  float rot = (fq(x + h, y) - fq(x - h, y)) / (2 * h) - (fp(x, y + h) - fp(x, y - h)) / (2 * h);
  // Циркуляция по окружности радиуса ρ вокруг W
  float circ = 0;
  repeat (360) {
    float t = 2 * pi * (i + 0.5) / 360;
    float cx = x + rho * cos(t); float cy = y + rho * sin(t);
    circ = circ + (fp(cx, cy) * (-sin(t)) + fq(cx, cy) * cos(t)) * rho * 2 * pi / 360;
  }
  ang = ang + rot / 2 * 0.05;
  S1.pos.x = x + rho * cos(ang); S1.pos.y = y + rho * sin(ang);
  S3.pos.x = x - rho * cos(ang); S3.pos.y = y - rho * sin(ang);
  S2.pos.x = x - rho * sin(ang); S2.pos.y = y + rho * cos(ang);
  S4.pos.x = x + rho * sin(ang); S4.pos.y = y - rho * cos(ang);
  RR.pos.x = x + rho; RR.pos.y = y;

  info = "**Ротор (вихрь)** векторного поля показывает, насколько поле «закручивает» окрестность точки. Для плоского поля F = (P, Q): rot F = ∂Q/∂x − ∂P/∂y. Физически: маленькое колёсико, помещённое в поток, вращается с угловой скоростью rot F / 2. Ротор — это циркуляция поля по маленькому контуру, делённая на площадь, которую контур ограничивает: ∮ F·dr ≈ rot F · πρ².\n\nВ точке W:  rot F = " + num(rot) + ";  циркуляция по окружности радиуса 1 — " + num(circ) + ", rot F · π = " + num(rot * pi) + ".  ";
  if (fn == "shear") { info = info + "Поток прямолинейный, но колёсико всё равно крутится: сверху его толкают сильнее, чем снизу."; }
  if (fn == "free") { info = info + "Всё поле кружит вокруг нуля, но rot F = 0 везде, кроме самого нуля: колёсико обходит центр, не вращаясь вокруг своей оси (скорость убывает как 1/r)."; }
  if (fn == "vort") { info = info + "Поле вращается как твёрдое тело: rot F одинаков во всех точках."; }
  if (fn == "saddle") { info = info + "Поле растягивает и сжимает, но не закручивает: rot F = 0."; }
}
]
