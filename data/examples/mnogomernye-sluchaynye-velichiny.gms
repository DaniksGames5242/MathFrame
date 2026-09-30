[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Каждая точка облака — значение вектора X = (X₁, X₂) на одном исходе. Синяя точка M — вектор
// средних E X (двигается), столбики сверху и справа — маргинальные распределения компонент. ----
draw Graph { name = "gFr"; graph = "gfr"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gPt"; graph = "gpt"; nodeColor = #3b82f6; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gHx"; graph = "ghx"; edgeColor = #3b82f6; edgeWidth = 17; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gHy"; graph = "ghy"; edgeColor = #22c55e; edgeWidth = 17; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gMk"; graph = "gmk"; edgeColor = #f59e0b; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Text { name = "l1"; pos = (-9.2, 4.6); text = "X₁"; size = 1; align = left }
draw Text { name = "l2"; pos = (6.2, 3.4); text = "X₂"; size = 1; align = left }
new Point { name = "M"; pos = (-2, -1); text = true("M"); pauseOnDrag = false; collision = false; color = #f59e0b }

new UI { name = "sR"; type = slider; label = "ρ"; variable = rho; min = -0.95; max = 0.95; step = 0.05; default = 0.6 }
new UI { name = "sN"; type = slider; label = "исходов"; variable = np; min = 20; max = 300; step = 10; default = 200 }

// ---- Логика ----
float rho = 0.6; float np = 200; float key = -1; string info = "";
float sx = 0; float sy = 0; float cnt = 0; float mx = -2; float my = -1;
list Hx = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
list Hy = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
Function num(x, d) { float v = x; if (abs(v) < 0.5 * pow(10, -d)) { v = 0; } if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function rad(n, b) { float f = 1; float r = 0; float k = n; repeat (9) { f = f / b; r = r + f * (k - b * floor(k / b)); k = floor(k / b); } return r; }

Update {
  if (M.pos.x < -5) { M.pos.x = -5; } if (M.pos.x > 1.5) { M.pos.x = 1.5; }
  if (M.pos.y < -3) { M.pos.y = -3; } if (M.pos.y > 1.2) { M.pos.y = 1.2; }
  if (key != M.pos.x * 1000 + M.pos.y * 77 + rho * 13 + np * 1.7) {
    gfr = newGraph(); gpt = newGraph(); ghx = newGraph(); ghy = newGraph(); gmk = newGraph();
    addNode(gfr, "a", [-9.4, -5]); addNode(gfr, "b", [5.4, -5]); addNode(gfr, "c", [5.4, 3]); addNode(gfr, "d", [-9.4, 3]);
    addEdge(gfr, "a", "b"); addEdge(gfr, "b", "c"); addEdge(gfr, "c", "d"); addEdge(gfr, "d", "a");
    mx = M.pos.x; my = M.pos.y;
    repeat (24) { Hx[i] = 0; } repeat (16) { Hy[i] = 0; }
    float sqr = sqrt(1 - rho * rho); cnt = 0; sx = 0; sy = 0;
    repeat (np) {
      float r = sqrt(-2 * log(rad(i + 1, 2))); float ph = 6.2831853 * rad(i + 1, 3);
      float z1 = r * cos(ph); float z2 = r * sin(ph);
      float x = mx + 1.5 * z1; float y = my + 1.5 * (rho * z1 + sqr * z2);
      if (x > -9.4 && x < 5.4 && y > -5 && y < 3) {
        addNode(gpt, "p" + format(i, 0), [x, y]);
        float bx = floor((x + 9.4) / 14.8 * 24); float by = floor((y + 5) / 8 * 16);
        Hx[bx] = Hx[bx] + 1; Hy[by] = Hy[by] + 1; cnt = cnt + 1; sx = sx + x; sy = sy + y;
      }
    }
    float hm = 1; repeat (24) { hm = max(hm, Hx[i]); }
    float hn = 1; repeat (16) { hn = max(hn, Hy[i]); }
    repeat (24) { if (Hx[i] > 0) { string s = "x" + format(i, 0); float cx = -9.4 + (i + 0.5) * 14.8 / 24; addNode(ghx, "a" + s, [cx, 3.4]); addNode(ghx, "b" + s, [cx, 3.4 + 2.4 * Hx[i] / hm]); addEdge(ghx, "a" + s, "b" + s); } }
    repeat (16) { if (Hy[i] > 0) { string s = "y" + format(i, 0); float cy = -5 + (i + 0.5) * 0.5; addNode(ghy, "a" + s, [5.8, cy]); addNode(ghy, "b" + s, [5.8 + 3.6 * Hy[i] / hn, cy]); addEdge(ghy, "a" + s, "b" + s); } }
    addNode(gmk, "a", [mx, 3.3]); addNode(gmk, "b", [mx, 6]); addEdge(gmk, "a", "b");
    addNode(gmk, "c", [5.7, my]); addNode(gmk, "d", [9.6, my]); addEdge(gmk, "c", "d");
    if (cnt < 1) { cnt = 1; }
    info = "**Многомерная случайная величина** X = (X₁, X₂): каждому исходу ω отвечает не число, а точка (X₁(ω), X₂(ω)) плоскости — вектор, компоненты которого сами случайные величины. Показано " + format(np, 0) + " исходов (внутри рамки — " + format(cnt, 0) + ").\n\n";
    info = info + "**Математическое ожидание — покомпонентно:** E X = (E X₁, E X₂) = (" + num(mx, 2) + "; " + num(my, 2) + "), среднее по облаку — (" + num(sx / cnt, 2) + "; " + num(sy / cnt, 2) + "). Оранжевые черты на столбиках отмечают эти средние.\n\n";
    info = info + "**Маргинальные распределения** компонент — проекции облака на оси (столбики сверху для X₁ и справа для X₂). Коэффициент корреляции ρ = " + num(rho, 2) + " меняет облако — зависимость компонент, — а столбики почти не меняются: по маргиналам совместное распределение не восстановить.";
    key = M.pos.x * 1000 + M.pos.y * 77 + rho * 13 + np * 1.7;
  }
}
]
