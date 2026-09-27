[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true;

// ---- Векторное поле F = (P, Q), частицы, переносимые потоком, и окружность (центр K и
// точка на ней перетаскиваются), через которую считается поток поля наружу ----
draw Field { name = "fld"; P = "fp(x, y)"; Q = "fq(x, y)"; xmin = -8; xmax = 8; ymin = -5; ymax = 5; grid = 25; scale = 1.3; color = #6b7280 }
// Частицы, переносимые потоком: видно, где они разбегаются и где сбегаются
draw Graph { name = "gPart"; graph = "gpt"; nodeColor = #3b82f6; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 30 }
new Point { name = "K"; pos = (2.5, 1); text = true("K"); pauseOnDrag = false; color = #f59e0b; size = 0.8; layer = 60 }
new Point { name = "RP"; pos = (3.8, 1); pauseOnDrag = false; color = #f59e0b; size = 0.7; layer = 60 }
new Circle { name = "rim"; center = K; radius = RP; color = #f59e0b; thickness = 3 }

new UI { name = "sF"; type = select; label = "поле F"; variable = fn; options = ("src", "rot", "var", "point"); labels = ("(x, y)/3 — источник", "(−y, x)/3 — вращение", "(x²/4, 0) — переменная", "(x, y)/(x² + y²) — точечный источник"); default = "var" }

// ---- Логика ----
string fn = "var";
string lastFn = "";
float lastKey = -1;
float dv = 0; float flux = 0; float integ = 0;
string info = "";
float NP = 60;
list qx = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list qy = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list qa = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
float seeded = 0;
Function reseed(k) { qx[k] = -7.8 + 15.6 * random(); qy[k] = -4.8 + 9.6 * random(); qa[k] = floor(random() * 120); return 0; }

Function fp(x, y) {
  if (fn == "src") { return x / 3; }
  if (fn == "rot") { return -y / 3; }
  if (fn == "var") { return x * x / 4; }
  return x / (x * x + y * y + 0.0001);
}
Function fq(x, y) {
  if (fn == "src") { return y / 3; }
  if (fn == "rot") { return x / 3; }
  if (fn == "var") { return 0; }
  return y / (x * x + y * y + 0.0001);
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
  float R = sqrt((RP.pos.x - K.pos.x) ^ 2 + (RP.pos.y - K.pos.y) ^ 2);
  if (R < 0.4) { RP.pos.x = K.pos.x + 0.4; RP.pos.y = K.pos.y; R = 0.4; }
  float x = K.pos.x; float y = K.pos.y;
  // div F = ∂P/∂x + ∂Q/∂y в центре K
  float h = 0.001;
  float key = x * 1000 + y * 10 + R;
  if (key != lastKey || fn != lastFn) {
  lastKey = key; lastFn = fn;
  dv = (fp(x + h, y) - fp(x - h, y)) / (2 * h) + (fq(x, y + h) - fq(x, y - h)) / (2 * h);
  // Поток через окружность наружу: ∮ F·n ds, n = (cos t, sin t)
  flux = 0;
  repeat (720) {
    float t = 2 * pi * (i + 0.5) / 720;
    float cx = x + R * cos(t); float cy = y + R * sin(t);
    flux = flux + (fp(cx, cy) * cos(t) + fq(cx, cy) * sin(t)) * R * 2 * pi / 720;
  }
  // ∬ div F dA по кругу (численно, по кольцам)
  integ = 0;
  repeat (40) {
    float rr = R * (i + 0.5) / 40;
    repeat (48) {
      float t = 2 * pi * (i + 0.5) / 48;
      float ux = x + rr * cos(t); float uy = y + rr * sin(t);
      float d = (fp(ux + h, uy) - fp(ux - h, uy)) / (2 * h) + (fq(ux, uy + h) - fq(ux, uy - h)) / (2 * h);
      integ = integ + d * rr * (R / 40) * (2 * pi / 48);
    }
  }
  }
  float inside = 0; if (x * x + y * y < R * R) { inside = 1; }

  info = "**Дивергенция** векторного поля показывает, сколько «вещества» рождается (div > 0, источник) или исчезает (div < 0, сток) в точке. Для плоского поля F = (P, Q): div F = ∂P/∂x + ∂Q/∂y. Это поток поля через маленький контур, делённый на площадь, которую он ограничивает; по теореме Гаусса — Остроградского поток через границу области равен интегралу дивергенции по ней: ∮ F·n ds = ∬ div F dA.\n\ndiv F в точке K = " + num(dv) + ".   Поток через окружность наружу: " + num(flux);
  if (fn == "point") {
    if (inside == 1) { info = info + " = 2π: внутри контура точечный источник в нуле — вся «жидкость» рождается там, хотя вне нуля div F = 0."; }
    else { info = info + ": источник в нуле снаружи, а в круге div F = 0 — сколько втекает, столько и вытекает."; }
  }
  else { info = info + ",  ∬ div F dA по кругу = " + num(integ) + "."; }
  if (fn == "rot") { info = info + " Поле только вращает: частицы не сгущаются и не разрежаются, div F = 0."; }
  if (fn == "var") { info = info + " div F = x/2: справа от оси частицы разбегаются (поток разгоняется), слева — сбегаются."; }
}
]
