[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Открытое множество U на плоскости — объединение двух открытых кругов (центры перетаскиваются).
// Его покрывают двоичные квадраты: стороны 2, 1, 1/2, …, вершины в точках с рациональными
// координатами. Берём квадрат, если он целиком в U, а его «родитель» — нет. Точка x ∈ U —
// оранжевый квадрат базы, содержащий x и лежащий в U. ----
draw Region { name = "rU"; f = "fu"; op = "<"; level = 0; color = #3b82f6; opacity = 0.18; quality = 3 }
draw Graph { name = "gSq"; graph = "gq"; edgeWidth = 1.2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gHit"; graph = "gh"; edgeColor = #f59e0b; edgeWidth = 3.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 12 }
new Point { name = "C1"; pos = (-2.4, 0.4); text = true("O₁"); pauseOnDrag = false; color = #3b82f6; size = 0.7; layer = 60 }
new Point { name = "C2"; pos = (2.2, -0.6); text = true("O₂"); pauseOnDrag = false; color = #3b82f6; size = 0.7; layer = 60 }
new Point { name = "X"; pos = (0.1, 0.2); text = true("x"); pauseOnDrag = false; color = #f59e0b; layer = 60 }

new UI { name = "sK"; type = slider; label = "уровней"; variable = K; min = 1; max = 6; step = 1; default = 4 }

// ---- Логика ----
float K = 4; float r1 = 3.2; float r2 = 2.6;
float key = -1; float hitKey = -1; float cnt = 0; float hitSide = 0;
string info = "";

Function fu(x, y) { return min((x - C1.pos.x) ^ 2 + (y - C1.pos.y) ^ 2 - r1 * r1, (x - C2.pos.x) ^ 2 + (y - C2.pos.y) ^ 2 - r2 * r2); }
// Квадрат [x; x + s] × [y; y + s] лежит в U? (проверка по сетке 5 × 5 точек, включая границу)
Function inside(x, y, s) {
  float ok = 1;
  repeat (5) { float a = x + s * i / 4; repeat (5) { if (fu(a, y + s * i / 4) >= 0) { ok = 0; } } }
  return ok;
}
Function sq(x, y, s, c) {
  string k = format(x * 64, 0) + "_" + format(y * 64, 0) + "_" + format(s * 64, 0);
  addNode(gq, k + "a", [x, y]); addNode(gq, k + "b", [x + s, y]); addNode(gq, k + "c", [x + s, y + s]); addNode(gq, k + "d", [x, y + s]);
  addEdge(gq, k + "a", k + "b", 1, c); addEdge(gq, k + "b", k + "c", 1, c); addEdge(gq, k + "c", k + "d", 1, c); addEdge(gq, k + "d", k + "a", 1, c);
  return 0;
}
Function col(l) { if (l == 0) { return "#22c55e"; } if (l == 1) { return "#14b8a6"; } if (l == 2) { return "#3b82f6"; } if (l == 3) { return "#8b5cf6"; } if (l == 4) { return "#ec4899"; } return "#6b7280"; }

Update {
  // присваиваем только при выходе за пределы — иначе сцена каждый кадр считается изменённой
  if (abs(C1.pos.x) > 4.5) { C1.pos.x = max(-4.5, min(4.5, C1.pos.x)); } if (abs(C1.pos.y) > 1.6) { C1.pos.y = max(-1.6, min(1.6, C1.pos.y)); }
  if (abs(C2.pos.x) > 4.5) { C2.pos.x = max(-4.5, min(4.5, C2.pos.x)); } if (abs(C2.pos.y) > 2.2) { C2.pos.y = max(-2.2, min(2.2, C2.pos.y)); }
  float kk = K * 1000000 + round(C1.pos.x * 100) * 1000 + round(C1.pos.y * 100) + round(C2.pos.x * 37) * 7 + round(C2.pos.y * 53) * 11;
  if (kk != key) {
    gq = newGraph(); cnt = 0;
    // уровень l: квадраты стороны 2/2^l на сетке с шагом той же длины
    repeat (K) { float l = i; float s = 2 / pow(2, l);
      float nx = 16 / s; float ny = 10 / s;
      repeat (nx) { float x = -8 + s * i; repeat (ny) { float y = -5 + s * i;
        if (inside(x, y, s) == 1) {
          // родитель (вдвое больше) не целиком в U — иначе квадрат уже покрыт
          float par = 0;
          if (l > 0) { float ps = 2 * s; float px = -8 + ps * floor((x + 8) / ps); float py = -5 + ps * floor((y + 5) / ps); par = inside(px, py, ps); }
          if (par == 0) { sq(x, y, s, col(l)); cnt = cnt + 1; }
        }
      } }
    }
    key = kk;
  }
  // квадрат базы, содержащий x: самый крупный уровень, где x попадает в квадрат, лежащий в U
  float hk = kk + round(X.pos.x * 1000) * 3 + round(X.pos.y * 1000) * 5;
  if (hk != hitKey) { hitKey = hk;
  gh = newGraph(); hitSide = 0;
  if (fu(X.pos.x, X.pos.y) < 0) {
    float found = 0;
    repeat (8) { if (found == 0) { float s = 2 / pow(2, i);
      float x0 = -8 + s * floor((X.pos.x + 8) / s); float y0 = -5 + s * floor((X.pos.y + 5) / s);
      if (inside(x0, y0, s) == 1) { found = 1; hitSide = s;
        addNode(gh, "a", [x0, y0]); addNode(gh, "b", [x0 + s, y0]); addNode(gh, "c", [x0 + s, y0 + s]); addNode(gh, "d", [x0, y0 + s]);
        addEdge(gh, "a", "b"); addEdge(gh, "b", "c"); addEdge(gh, "c", "d"); addEdge(gh, "d", "a"); }
    } }
  }
  }

  info = "**Вторая аксиома счётности:** у топологии есть **счётная база** — такое счётное семейство открытых множеств, что любое открытое множество является объединением некоторых из них (равносильно: для любого открытого U и точки x ∈ U найдётся элемент базы B с x ∈ B ⊂ U). Плоскость ей удовлетворяет: база — квадраты (или круги) с рациональными вершинами (центрами и радиусами), а их счётное число.\n\nДля показанного U: " + format(cnt, 0) + " квадратов " + format(K, 0) + " уровней; с ростом числа уровней они покрывают всё U, но ни один квадрат не нужен дважды, и на каждом уровне их конечно — всего счётно.  ";
  if (hitSide > 0) { info = info + "Для точки x нашёлся квадрат базы со стороной " + format(hitSide, 4) + ": x ∈ B ⊂ U."; }
  else { if (fu(X.pos.x, X.pos.y) < 0) { info = info + "Точка x у самой границы U — квадрат найдётся на более мелком уровне."; } else { info = info + "Точка x вне U."; } }
  info = info + " Прямая с дискретной топологией на несчётном множестве точек этой аксиоме не удовлетворяет: каждая точка должна быть отдельным элементом базы.";
}
]
