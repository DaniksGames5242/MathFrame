[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Открытое множество U на плоскости — объединение двух открытых кругов (центры перетаскиваются).
// Его покрывают двоичные квадраты: стороны 2, 1, 1/2, …, вершины в точках с рациональными
// координатами. Берём квадрат, если он целиком в одном из кругов; квадраты у границы делим на четыре. Точка x ∈ U —
// оранжевый квадрат базы, содержащий x и лежащий в U. ----
draw Region { name = "rU"; f = "fu"; op = "<"; level = 0; color = #3b82f6; opacity = 0.18; quality = 3 }
draw Graph { name = "gSq"; graph = "gq"; edgeWidth = 1.2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gHit"; graph = "gh"; edgeColor = #f59e0b; edgeWidth = 3.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 12 }
new Point { name = "C1"; pos = (-2.4, 0.4); text = true("O₁"); pauseOnDrag = false; color = #3b82f6; size = 0.7; layer = 60 }
new Point { name = "C2"; pos = (2.2, -0.6); text = true("O₂"); pauseOnDrag = false; color = #3b82f6; size = 0.7; layer = 60 }
new Point { name = "X"; pos = (0.1, 0.2); text = true("x"); pauseOnDrag = false; color = #f59e0b; layer = 60 }

new UI { name = "sK"; type = slider; label = "уровней"; variable = K; min = 1; max = 6; step = 1; default = 4 }

// ---- Логика ----
list QX = [0]; list QY = [0]; list NX = [0]; list NY = [0];
float K = 4; float r1 = 3.2; float r2 = 2.6;
float key = -1; float hitKey = -1; float cnt = 0; float hitSide = 0;
string info = "";

Function fu(x, y) { return min((x - C1.pos.x) ^ 2 + (y - C1.pos.y) ^ 2 - r1 * r1, (x - C2.pos.x) ^ 2 + (y - C2.pos.y) ^ 2 - r2 * r2); }
// Квадрат [x; x + s] × [y; y + s] целиком в одном из кругов (круг выпуклый — достаточно четырёх вершин)
Function inDisk(x, y, s, cx, cy, r) { float r2 = r * r;
  if ((x - cx) ^ 2 + (y - cy) ^ 2 >= r2) { return 0; } if ((x + s - cx) ^ 2 + (y - cy) ^ 2 >= r2) { return 0; }
  if ((x - cx) ^ 2 + (y + s - cy) ^ 2 >= r2) { return 0; } if ((x + s - cx) ^ 2 + (y + s - cy) ^ 2 >= r2) { return 0; }
  return 1; }
Function inside(x, y, s) { if (inDisk(x, y, s, C1.pos.x, C1.pos.y, r1) == 1) { return 1; } return inDisk(x, y, s, C2.pos.x, C2.pos.y, r2); }
// Квадрат задевает круг: расстояние от центра до квадрата меньше радиуса
Function meetsDisk(x, y, s, cx, cy, r) { float dx = max(x - cx, max(0, cx - x - s)); float dy = max(y - cy, max(0, cy - y - s)); if (dx * dx + dy * dy < r * r) { return 1; } return 0; }
Function meets(x, y, s) { if (meetsDisk(x, y, s, C1.pos.x, C1.pos.y, r1) == 1) { return 1; } return meetsDisk(x, y, s, C2.pos.x, C2.pos.y, r2); }
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
    // Квадродерево: квадрат целиком в U — элемент покрытия; задевает U, но не лежит в нём —
    // делим на 4 (до уровня K − 1); не задевает — отбрасываем. Так перебираются только
    // квадраты у границы U, а не вся сетка уровня (на 6 уровнях это 40 тыс. клеток).
    QX = [0]; QY = [0]; float nq = 0;
    repeat (8) { float x = -8 + 2 * i; repeat (5) { float y = -5 + 2 * i; if (nq == 0) { QX[0] = x; QY[0] = y; } else { push(QX, x); push(QY, y); } nq = nq + 1; } }
    repeat (K) { float l = i; float s = 2 / pow(2, l);
      NX = [0]; NY = [0]; float nn = 0;
      repeat (nq) { float x = QX[i]; float y = QY[i];
        if (inside(x, y, s) == 1) { sq(x, y, s, col(l)); cnt = cnt + 1; }
        else { if (l < K - 1 && meets(x, y, s) == 1) { float h = s / 2;
          if (nn == 0) { NX[0] = x; NY[0] = y; } else { push(NX, x); push(NY, y); }
          push(NX, x + h); push(NY, y); push(NX, x); push(NY, y + h); push(NX, x + h); push(NY, y + h); nn = nn + 4; } }
      }
      QX = NX; QY = NY; nq = nn;
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
