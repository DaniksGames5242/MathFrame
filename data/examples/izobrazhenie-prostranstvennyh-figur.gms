[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Изображение куба ABCDA₁B₁C₁D₁ при параллельном проектировании на плоскость грани ABCD:
// эта грань изображается без искажения, а рёбра, перпендикулярные ей, — равными
// параллельными отрезками длины k·a под углом α. Точка A₁ задаёт и α, и k. Невидимые
// рёбра — тонкие жёлтые. ----
new Point { name = "A"; pos = (-2, -3.5); text = true("A"); dynamic = false; collision = false }
new Point { name = "B"; pos = (2, -3.5); text = true("B"); dynamic = false; collision = false }
new Point { name = "C"; pos = (2, 0.5); text = true("C"); dynamic = false; collision = false }
new Point { name = "D"; pos = (-2, 0.5); text = true("D"); dynamic = false; collision = false }
new Point { name = "T"; pos = (0.83, -0.67); text = true("A₁"); color = #3b82f6; pauseOnDrag = false; collideWithPoints = false }
draw Graph { name = "gV"; graph = "gv"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gH"; graph = "gh"; edgeColor = #f59e0b; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }

string info = "";
float ptx = 0; float pty = 0; float built = 0;

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
// Ребро (x1, y1) — (x2, y2) в граф g.
Function seg(g, i, x1, y1, x2, y2) {
  addNode(g, "a" + format(i, 0), [x1, y1]); addNode(g, "b" + format(i, 0), [x2, y2]);
  addEdge(g, "a" + format(i, 0), "b" + format(i, 0));
}

Start { ptx = T.pos.x; pty = T.pos.y; }

Update {
  // Допустимая область A₁: длина AA₁ от 1,2 до 4 (k от 0,3 до 1), угол α от 15° до 165°, но не в 80°…100°.
  float ex = T.pos.x - A.pos.x; float ey = T.pos.y - A.pos.y;
  float r = sqrt(ex * ex + ey * ey);
  float al = degrees(atan2(ey, ex));
  float bad = 0;
  if (r < 1.2 || r > 4 || al < 15 || al > 165 || (al > 80 && al < 100)) { bad = 1; }
  if (bad > 0.5) {
    float r2 = max(1.2, min(4, r));
    float a2 = max(15, min(165, al));
    if (a2 > 80 && a2 < 100) { if (a2 < 90) { a2 = 80; } else { a2 = 100; } }
    T.pos.x = A.pos.x + r2 * cos(radians(a2)); T.pos.y = A.pos.y + r2 * sin(radians(a2));
    ex = T.pos.x - A.pos.x; ey = T.pos.y - A.pos.y;
    r = r2; al = a2;
  }
  if (built < 0.5 || abs(T.pos.x - ptx) + abs(T.pos.y - pty) > 0.000001) {
    ptx = T.pos.x; pty = T.pos.y; built = 1;
    gv = newGraph(); gh = newGraph();
    // Скрытая вершина задней грани — сдвиг нижнего угла, «закрытого» передней гранью: при ex > 0 левого, иначе правого.
    float hl = 0; if (ex > 0) { hl = 1; }
    seg(gv, 0, -2, -3.5, 2, -3.5); seg(gv, 1, 2, -3.5, 2, 0.5); seg(gv, 2, 2, 0.5, -2, 0.5); seg(gv, 3, -2, 0.5, -2, -3.5);
    seg(gv, 4, -2 + ex, 0.5 + ey, 2 + ex, 0.5 + ey); seg(gv, 5, -2, 0.5, -2 + ex, 0.5 + ey); seg(gv, 6, 2, 0.5, 2 + ex, 0.5 + ey);
    seg(gh, 7, -2 + ex, -3.5 + ey, 2 + ex, -3.5 + ey);
    if (hl > 0.5) {
      seg(gh, 8, -2 + ex, -3.5 + ey, -2 + ex, 0.5 + ey); seg(gh, 9, -2, -3.5, -2 + ex, -3.5 + ey);
      seg(gv, 10, 2 + ex, -3.5 + ey, 2 + ex, 0.5 + ey); seg(gv, 11, 2, -3.5, 2 + ex, -3.5 + ey);
    } else {
      seg(gv, 8, -2 + ex, -3.5 + ey, -2 + ex, 0.5 + ey); seg(gv, 9, -2, -3.5, -2 + ex, -3.5 + ey);
      seg(gh, 10, 2 + ex, -3.5 + ey, 2 + ex, 0.5 + ey); seg(gh, 11, 2, -3.5, 2 + ex, -3.5 + ey);
    }
  }
  float k = r / 4;
  info = "**Изображение пространственной фигуры.** Куб ABCDA₁B₁C₁D₁ проектируется параллельными лучами на плоскость грани ABCD (наклонное проектирование). Параллельные рёбра куба остаются параллельными на изображении: AA₁, BB₁, CC₁, DD₁ изображаются равными параллельными отрезками, а невидимые рёбра показаны тонкими жёлтыми линиями.\n\n";
  info = info + "Грань ABCD параллельна плоскости изображения и изображается без искажения: AB = BC = a. Ребро AA₁, перпендикулярное ей, изображается отрезком длины k·a, k = **" + num(k, 2) + "**, под углом α = **" + num(al, 0) + "°** к AB; прямой угол BAA₁ на рисунке равен " + num(al, 0) + "°.\n\n";
  if (abs(k - 1) < 0.04 && abs(al - 45) < 3) {
    info = info + "Это **кавальерная** проекция (k = 1, α = 45°).";
  } else if (abs(k - 0.5) < 0.04 && (abs(al - 45) < 3 || abs(al - 63) < 3)) {
    info = info + "Это **кабинетная** проекция (k = ½, α = 45° или 63°).";
  } else {
    info = info + "Меняя α и k, получаем разные наклонные проекции; частные случаи: кавальерная (k = 1, α = 45°) и кабинетная (k = ½).";
  }
}
]
