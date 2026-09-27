[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Параллельные прямые на расстоянии d = 2 друг от друга ----
new Point { name = "a1"; pos = (-20, -4); dynamic = false; active = false; collision = false }
new Point { name = "a2"; pos = (20, -4); dynamic = false; active = false; collision = false }
new Point { name = "b1"; pos = (-20, -2); dynamic = false; active = false; collision = false }
new Point { name = "b2"; pos = (20, -2); dynamic = false; active = false; collision = false }
new Point { name = "c1"; pos = (-20, 0); dynamic = false; active = false; collision = false }
new Point { name = "c2"; pos = (20, 0); dynamic = false; active = false; collision = false }
new Point { name = "d1"; pos = (-20, 2); dynamic = false; active = false; collision = false }
new Point { name = "d2"; pos = (20, 2); dynamic = false; active = false; collision = false }
new Point { name = "e1"; pos = (-20, 4); dynamic = false; active = false; collision = false }
new Point { name = "e2"; pos = (20, 4); dynamic = false; active = false; collision = false }
new Line { name = "la"; pos = (a1, a2); interact = false; thickness = 1.5 }
new Line { name = "lb"; pos = (b1, b2); interact = false; thickness = 1.5 }
new Line { name = "lc"; pos = (c1, c2); interact = false; thickness = 1.5 }
new Line { name = "ld"; pos = (d1, d2); interact = false; thickness = 1.5 }
new Line { name = "le"; pos = (e1, e2); interact = false; thickness = 1.5 }

// ---- Брошенные иглы: пересёкшие прямую — оранжевые, остальные — синие ----
draw Graph { name = "gHit"; graph = "hits"; edgeColor = #f59e0b; nodeRadius = 0; labels = false; showWeights = false; interactive = false; layer = 30 }
draw Graph { name = "gMiss"; graph = "miss"; edgeColor = #3b82f6; nodeRadius = 0; labels = false; showWeights = false; interactive = false; layer = 30 }

// ---- Своя игла: середина M перетаскивается, конец N задаёт направление ----
new Point { name = "M"; pos = (-5, 1); text = true("M"); pauseOnDrag = false }
new Point { name = "N"; pos = (-4.3, 1.7); pauseOnDrag = false; size = 0.8 }
new Point { name = "N0"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "needle"; pos = (N0, N); thickness = 5; interact = false; color = myColor; layer = 60 }

new UI { name = "sL"; type = slider; label = "длина иглы l"; variable = len; min = 0.4; max = 2; step = 0.1; default = 1.6 }
new UI { name = "b10"; type = button; label = "Бросить 10"; action = "toThrow = toThrow + 10" }
new UI { name = "b100"; type = button; label = "Бросить 100"; action = "toThrow = toThrow + 100" }
new UI { name = "bClr"; type = button; label = "Убрать иглы"; action = "clearAll = 1" }

// ---- Логика ----
float len = 1.6;
float d = 2;
float toThrow = 0;
float clearAll = 0;
float total = 0;
float crossed = 0;
float lastLen = 1.6;
string myColor = "#3b82f6";
string info = "";

// Пересекает ли отрезок с концами на высотах y1, y2 одну из прямых y = 2k
Function crosses(y1, y2) {
  return floor(y1 / d) != floor(y2 / d);
}

Start { hits = newGraph(); miss = newGraph(); }

Update {
  // Длина иглы поменялась — прежняя статистика к новой длине не относится
  if (len != lastLen || clearAll == 1) { hits = newGraph(); miss = newGraph(); total = 0; crossed = 0; clearAll = 0; lastLen = len; }
  // Бросаем порциями по 10 за кадр — видно, как иглы «сыплются»
  repeat (min(toThrow, 10)) {
    float cx = random(-7.5, 7.5); float cy = random(-4.5, 4.5); float ang = random(0, pi);
    float x1 = cx - len / 2 * cos(ang); float y1 = cy - len / 2 * sin(ang);
    float x2 = cx + len / 2 * cos(ang); float y2 = cy + len / 2 * sin(ang);
    string k1 = "p" + total; string k2 = "q" + total;
    if (crosses(y1, y2)) { addNode(hits, k1, [x1, y1]); addNode(hits, k2, [x2, y2]); addEdge(hits, k1, k2); crossed = crossed + 1; }
    else { addNode(miss, k1, [x1, y1]); addNode(miss, k2, [x2, y2]); addEdge(miss, k1, k2); }
    total = total + 1;
  }
  toThrow = max(0, toThrow - 10);

  // Своя игла: N удерживается на расстоянии l/2 от M, игла симметрична относительно M
  float vx = N.pos.x - M.pos.x; float vy = N.pos.y - M.pos.y; float vl = sqrt(vx * vx + vy * vy) + 0.000001;
  N.pos.x = M.pos.x + vx / vl * len / 2; N.pos.y = M.pos.y + vy / vl * len / 2;
  N0.pos.x = 2 * M.pos.x - N.pos.x; N0.pos.y = 2 * M.pos.y - N.pos.y;
  myColor = "#3b82f6";
  if (crosses(N0.pos.y, N.pos.y)) { myColor = "#f59e0b"; }

  float p = 2 * len / (pi * d);
  info = "**Задача Бюффона:** игла длины l ≤ d бросается наудачу на плоскость, расчерченную параллельными прямыми на расстоянии d. Вероятность, что она пересечёт прямую, P = 2l / (πd) = " + format(p, 3) + ".";
  if (total > 0) {
    info = info + "\n\nБрошено " + format(total, 0) + ", пересекли " + format(crossed, 0) + ": частота " + format(crossed / total, 3) + ".";
    if (crossed > 0) { info = info + " Отсюда оценка числа π ≈ 2l·n / (d·k) = " + format(2 * len * total / (d * crossed), 3) + "."; }
  }
}
]
