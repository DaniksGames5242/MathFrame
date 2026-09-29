[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Диаграмма «положение — время»: по горизонтали расстояние, вверх — время. Синие линии — два поезда,
// идущих навстречу друг другу, оранжевая ломаная — птица, летающая между ними туда и обратно. Показано n
// первых перелётов; вся бесконечная ломаная заканчивается в точке встречи поездов. ----
draw Graph { name = "gT"; graph = "gt"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gW"; graph = "gw"; edgeColor = #f59e0b; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gX"; graph = "gx"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "lA"; pos = (-6.8, -4.6); text = "поезд 1"; size = 0.95 }
draw Text { name = "lB"; pos = (6.8, -4.6); text = "поезд 2"; size = 0.95 }
draw Text { name = "lM"; pos = (mx, 4.5); text = "встреча"; size = 0.95 }

new UI { type = slider; label = "расстояние D, км"; variable = D; min = 60; max = 300; step = 10; default = 180 }
new UI { type = slider; label = "поезд 1, км/ч"; variable = v1; min = 10; max = 25; step = 1; default = 20 }
new UI { type = slider; label = "поезд 2, км/ч"; variable = v2; min = 10; max = 25; step = 1; default = 10 }
new UI { type = slider; label = "птица, км/ч"; variable = w; min = 30; max = 100; step = 5; default = 60 }
new UI { type = slider; label = "перелётов n"; variable = n; min = 1; max = 12; step = 1; default = 4 }

// ---- Логика ----
float D = 180; float v1 = 20; float v2 = 10; float w = 60; float n = 4; float mx = 0; string info = "";
Function fs(v) { return format(v, 0); }
Function px(x) { return -7.5 + 15 * x / D; }
Function py(t, T) { return -4 + 8 * t / T; }

Update {
  float T = D / (v1 + v2); mx = px(v1 * T);
  gt = newGraph(); gw = newGraph(); gx = newGraph();
  addNode(gx, "a", [-7.5, -4]); addNode(gx, "b", [7.5, -4]); addEdge(gx, "a", "b");
  addNode(gx, "c", [-7.5, 4]); addNode(gx, "d", [7.5, 4]); addEdge(gx, "c", "d");
  addNode(gt, "a0", [px(0), -4]); addNode(gt, "a1", [px(v1 * T), 4]); addEdge(gt, "a0", "a1");
  addNode(gt, "b0", [px(D), -4]); addNode(gt, "b1", [px(D - v2 * T), 4]); addEdge(gt, "b0", "b1");
  float t = 0; float xb = 0; float dir = 1; float fl = 0;
  addNode(gw, "p0", [px(0), -4]);
  repeat (n) {
    float gap = D - v2 * t - v1 * t; float dt = 0;
    if (dir > 0) { dt = gap / (w + v2); } else { dt = gap / (w + v1); }
    t = t + dt; xb = xb + dir * w * dt; fl = fl + w * dt; dir = -dir;
    addNode(gw, "p" + fs(i + 1), [px(xb), py(t, T)]); addEdge(gw, "p" + fs(i), "p" + fs(i + 1));
  }
  info = "**Задача.** Два поезда выходят одновременно навстречу друг другу из пунктов, расстояние между которыми " + fs(D) + " км, со скоростями " + fs(v1) + " и " + fs(v2) + " км/ч. Птица летит со скоростью " + fs(w) + " км/ч от первого поезда ко второму, затем обратно, и так до встречи. Сколько километров она пролетит?\n\n";
  info = info + "**Прямой путь** — считать перелёты один за другим: за " + fs(n) + " перелётов птица пролетела " + format(fl, 2) + " км, и это лишь часть пути — перелётов бесконечно много.\n\n";
  info = info + "**Смекалка:** птица летит всё время, пока поезда сближаются. Скорость сближения " + fs(v1) + " + " + fs(v2) + " = " + fs(v1 + v2) + " км/ч, до встречи " + fs(D) + " : " + fs(v1 + v2) + " = " + format(T, 2) + " ч, за это время птица пролетит " + fs(w) + " · " + format(T, 2) + " = **" + format(w * T, 2) + " км**.";
}
]
