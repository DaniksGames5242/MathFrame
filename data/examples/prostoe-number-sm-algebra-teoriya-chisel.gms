[
description = "{info}"

field width = 18;
field height = 11;
camera type = fixed;

// ---- Выбор числа n: точка на оси внизу (вкладки 1 и 2) ----
new Point { name = "G1"; pos = (-7.5, -4.3); dynamic = false; active = false }
new Point { name = "G2"; pos = (7.5, -4.3); dynamic = false; active = false }
new Line { name = "guide"; pos = (G1, G2); interact = false; thickness = 2 }
new Point { name = "P"; line = "guide"; t = 0.3; pauseOnDrag = false; collideWithPoints = false }
draw Text { name = "lblN"; pos = (P.pos.x, -3.5); text = "n = " + format(n, 0) }
draw Text { name = "lb2"; pos = (-7.5, -4.95); text = "2" }
draw Text { name = "lb60"; pos = (7.5, -4.95); text = "60" }
new Claster { name = "axisC"; elements = (G1, G2, guide, P, lblN, lb2, lb60); active = true }

// ---- Вкладка 1: n точек: простое число в прямоугольник из двух рядов не укладывается ----
draw Graph { name = "gDots"; graph = "gd"; nodeRadius = 5; labels = false; interactive = false; showWeights = false; edgeWidth = 0; nodeColor = #3b82f6; layer = 10 }
draw Graph { name = "gDotsP"; graph = "gdp"; nodeRadius = 5; labels = false; interactive = false; showWeights = false; edgeWidth = 0; nodeColor = #22c55e; layer = 10 }
new Claster { name = "tabDiv"; elements = (gDots, gDotsP); active = true }

// ---- Вкладка 2: разложение на простые множители (простые — зелёные «кирпичи») ----
draw Graph { name = "gTree"; graph = "gt"; nodeRadius = 20; labels = true; interactive = false; showWeights = false; edgeWidth = 2; layer = 10 }
draw Graph { name = "gTreeP"; graph = "gtp"; nodeRadius = 20; labels = true; interactive = false; showWeights = false; nodeColor = #22c55e; layer = 11 }
new Claster { name = "tabFac"; elements = (gTree, gTreeP); active = false }

// ---- Вкладка 3: решето Эратосфена ----
draw Graph { name = "gS0"; graph = "gs0"; nodeRadius = 17; labels = true; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gSx"; graph = "gsx"; nodeRadius = 17; labels = true; interactive = false; showWeights = false; nodeColor = #6b728055; layer = 9 }
draw Graph { name = "gSp"; graph = "gsp"; nodeRadius = 17; labels = true; interactive = false; showWeights = false; nodeColor = #22c55e; layer = 11 }
draw Graph { name = "gSc"; graph = "gsc"; nodeRadius = 17; labels = true; interactive = false; showWeights = false; nodeColor = #f59e0b; layer = 12 }
new Claster { name = "tabSieve"; elements = (gS0, gSx, gSp, gSc); active = false }

// ---- Вкладка 4: теорема Евклида ----
draw Graph { name = "gE"; graph = "ge"; nodeRadius = 22; labels = true; interactive = false; showWeights = false; edgeWidth = 2; layer = 10 }
draw Graph { name = "gEp"; graph = "gep"; nodeRadius = 22; labels = true; interactive = false; showWeights = false; nodeColor = #22c55e; layer = 11 }
draw Graph { name = "gEN"; graph = "gen"; nodeRadius = 34; labels = true; interactive = false; showWeights = false; nodeColor = #f59e0b; layer = 11 }
draw Graph { name = "gEq"; graph = "geq"; nodeRadius = 28; labels = true; interactive = false; showWeights = false; nodeColor = #3b82f6; layer = 12 }
new Claster { name = "tabEuclid"; elements = (gE, gEp, gEN, gEq); active = false }

new UI { name = "btnDiv"; type = button; label = "Делители"; action = "tab = 1; axisC.active = true; tabDiv.active = true; tabFac.active = false; tabSieve.active = false; tabEuclid.active = false" }
new UI { name = "btnFac"; type = button; label = "Разложение на простые"; action = "tab = 2; axisC.active = true; tabDiv.active = false; tabFac.active = true; tabSieve.active = false; tabEuclid.active = false" }
new UI { name = "btnSieve"; type = button; label = "Решето Эратосфена"; action = "tab = 3; axisC.active = false; tabDiv.active = false; tabFac.active = false; tabSieve.active = true; tabEuclid.active = false" }
new UI { name = "btnEuclid"; type = button; label = "Простых бесконечно много"; action = "tab = 4; axisC.active = false; tabDiv.active = false; tabFac.active = false; tabSieve.active = false; tabEuclid.active = true" }

float tab = 1;
float n = 24;
float stepS = 1;
float kE = 3;
new UI { name = "sStep"; type = slider; label = "вычеркнуто кратных простых"; variable = stepS; min = 0; max = 4; step = 1; default = 1; active = tab == 3 }
new UI { name = "sK"; type = slider; label = "простых в списке"; variable = kE; min = 1; max = 6; step = 1; default = 3; active = tab == 4 }

string info = "";
float key = -1;

// Наименьший делитель m, больший 1 (для простого m — само m)
Function spf(m) {
  float d = 2;
  repeat (200) { if (d * d <= m && m % d != 0) { d = d + 1; } }
  if (d * d > m) { return m; }
  return d;
}
Function isPrime(m) { if (m < 2) { return false; } return spf(m) == m; }
// Самый «квадратный» делитель a ≤ √m: m = a · (m / a)
Function sq(m) {
  float a = 1;
  repeat (8) { float d = i + 2; if (d * d <= m && m % d == 0) { a = d; } }
  return a;
}
Function nthPrime(j) {
  if (j == 1) { return 2; } if (j == 2) { return 3; } if (j == 3) { return 5; }
  if (j == 4) { return 7; } if (j == 5) { return 11; } return 13;
}
func gx(m) = -6.9 + 1.5333 * ((m - 1) % 10);
func gy(m) = 4.3 - 0.95 * floor((m - 1) / 10);
Function factors(m) {
  string s = "";
  float r = m;
  repeat (6) {
    if (r > 1) {
      float p = spf(r);
      if (s != "") { s = s + " · "; }
      s = s + format(p, 0);
      r = r / p;
    }
  }
  return s;
}
Function divisors(m) {
  string s = "";
  repeat (60) { float d = i + 1; if (d <= m && m % d == 0) { if (s != "") { s = s + ", "; } s = s + format(d, 0); } }
  return s;
}
Function primesUpTo(m) {
  string s = "";
  repeat (8) { float d = i + 2; if (d * d <= m && isPrime(d)) { if (s != "") { s = s + ", "; } s = s + format(d, 0); } }
  return s;
}

Update {
  n = 2 + round(P.t * 58);
  float s2 = round(stepS);
  float k2 = round(kE);

  float k3 = tab * 1000000 + n * 1000 + s2 * 10 + k2;
  if (k3 != key) {
    key = k3;
    gd = newGraph(); gdp = newGraph(); gt = newGraph(); gtp = newGraph();
    gs0 = newGraph(); gsx = newGraph(); gsp = newGraph(); gsc = newGraph();
    ge = newGraph(); gep = newGraph(); gen = newGraph(); geq = newGraph();

    if (tab == 1) {
      float a = sq(n);
      float cols = n / a;
      float sp = min(0.8, 14.5 / cols);
      repeat (60) {
        if (i < n) {
          float row = floor(i / cols);
          float col = i - row * cols;
          float x = (col - (cols - 1) / 2) * sp;
          float y = 0.8 - (row - (a - 1) / 2) * sp;
          if (a == 1) { addNode(gdp, "d" + format(i, 0), [x, y]); } else { addNode(gd, "d" + format(i, 0), [x, y]); }
        }
      }
    }
    if (tab == 2) {
      float r = n;
      float y = 3.8;
      float j = 0;
      if (isPrime(n)) { addNode(gtp, "r0", [0, y], format(n, 0)); }
      else {
        addNode(gt, "r0", [1.4, y], format(n, 0));
        repeat (6) {
          if (r > 1 && !isPrime(r)) {
            float p = spf(r);
            float nr = r / p;
            string pk = "p" + format(j, 0);
            string rk = "r" + format(j + 1, 0);
            addNode(gt, pk, [-1.4, y - 1.5], format(p, 0));
            addNode(gtp, pk, [-1.4, y - 1.5], format(p, 0));
            addNode(gt, rk, [1.4, y - 1.5], format(nr, 0));
            if (isPrime(nr)) { addNode(gtp, rk, [1.4, y - 1.5], format(nr, 0)); }
            addEdge(gt, "r" + format(j, 0), pk, 2);
            addEdge(gt, "r" + format(j, 0), rk, 2);
            r = nr; y = y - 1.5; j = j + 1;
          }
        }
      }
    }
    if (tab == 3) {
      repeat (100) {
        float m = i + 1;
        string lbl = format(m, 0);
        float pr = 0;
        float cur = 0;
        float crossed = 0;
        // кратные первых s2 простых из 2, 3, 5, 7 уже вычеркнуты
        if (m == 1) { crossed = 1; }
        if (s2 >= 1 && m > 2 && m % 2 == 0) { crossed = 1; }
        if (s2 >= 2 && m > 3 && m % 3 == 0) { crossed = 1; }
        if (s2 >= 3 && m > 5 && m % 5 == 0) { crossed = 1; }
        if (s2 >= 4 && m > 7 && m % 7 == 0) { crossed = 1; }
        if (m == 2 && s2 >= 1) { pr = 1; }
        if (m == 3 && s2 >= 2) { pr = 1; }
        if (m == 5 && s2 >= 3) { pr = 1; }
        if (m == 7 && s2 >= 4) { pr = 1; }
        if (m == 2 && s2 == 1) { cur = 1; }
        if (m == 3 && s2 == 2) { cur = 1; }
        if (m == 5 && s2 == 3) { cur = 1; }
        if (m == 7 && s2 == 4) { cur = 1; }
        if (crossed == 1) { addNode(gsx, lbl, [gx(m), gy(m)], lbl); }
        else if (cur == 1) { addNode(gsc, lbl, [gx(m), gy(m)], lbl); }
        else if (pr == 1) { addNode(gsp, lbl, [gx(m), gy(m)], lbl); }
        else if (s2 == 4) { addNode(gsp, lbl, [gx(m), gy(m)], lbl); }
        else { addNode(gs0, lbl, [gx(m), gy(m)], lbl); }
      }
    }
    if (tab == 4) {
      float prod = 1;
      repeat (6) {
        if (i < k2) {
          float p = nthPrime(i + 1);
          prod = prod * p;
          addNode(ge, "p" + format(i, 0), [-6.5 + 2.6 * i, 3], format(p, 0));
          addNode(gep, "p" + format(i, 0), [-6.5 + 2.6 * i, 3], format(p, 0));
          addEdge(ge, "p" + format(i, 0), "N", 1);
        }
      }
      addNode(ge, "N", [0, 0.2], format(prod + 1, 0));
      addNode(gen, "N", [0, 0.2], format(prod + 1, 0));
      float q = spf(prod + 1);
      addNode(ge, "q", [0, -3], format(q, 0));
      addNode(geq, "q", [0, -3], format(q, 0));
      addEdge(ge, "N", "q", 2);
    }
  }

  if (tab == 1) {
    string head = "";
    if (isPrime(n)) {
      info = "**" + format(n, 0) + " — простое число:** его единственные делители — 1 и " + format(n, 0) + ", поэтому \\(" + format(n, 0) + "\\) точек нельзя выложить прямоугольником с обеими сторонами больше единицы — получается один ряд.\n\nДостаточно проверить простые числа, не превосходящие \\(\\sqrt{" + format(n, 0) + "} \\approx " + format(sqrt(n), 1) + "\\)";
      if (primesUpTo(n) != "") { info = info + " (" + primesUpTo(n) + "): ни одно из них не делит число."; } else { info = info + ": таких нет."; }
    } else {
      float a2 = sq(n);
      info = "**" + format(n, 0) + " — составное число:** оно раскладывается в произведение двух меньших натуральных чисел, например \\(" + format(n, 0) + " = " + format(a2, 0) + " \\cdot " + format(n / a2, 0) + "\\), и точки выкладываются прямоугольником. Делители: " + divisors(n) + ".\n\nНаименьший делитель, больший единицы, — " + format(spf(n), 0) + " (простое число, не превосходящее \\(\\sqrt{" + format(n, 0) + "} \\approx " + format(sqrt(n), 1) + "\\)).";
    }
    if (n == 2) { info = info + "\n\n**2** — единственное чётное простое число: любое другое чётное число делится на 2 и потому составное."; }
  } else if (tab == 2) {
    if (isPrime(n)) {
      info = "**" + format(n, 0) + "** — простое число: оно само уже «кирпич» и дальше не раскладывается.\n\nКаждое натуральное число, большее единицы, раскладывается в произведение простых единственным образом (с точностью до порядка множителей) — основная теорема арифметики.";
    } else {
      info = "**Разложение на простые множители:** \\(" + format(n, 0) + " = " + factors(n) + "\\) (простые — зелёные).\n\nСколько бы раз ни делили число на его простые делители в любом порядке, набор простых множителей получится один и тот же — это основная теорема арифметики.";
    }
  } else if (tab == 3) {
    if (s2 == 0) {
      info = "**Решето Эратосфена** находит все простые числа до заданной границы. Выписаны числа от 1 до 100; единица не простая и не составная — её вычёркиваем сразу.\n\nДалее вычёркивают кратные каждому найденному простому: сначала кратные 2, потом 3, 5, 7.";
    } else if (s2 == 1) {
      info = "Первое невычеркнутое число — **2**: оно простое. Вычёркиваем все чётные числа, кроме самой двойки.";
    } else if (s2 == 2) {
      info = "Первое невычеркнутое число после 2 — **3**: оно простое. Вычёркиваем кратные трём (6, 9, 12, …).";
    } else if (s2 == 3) {
      info = "Следующее невычеркнутое число — **5**. Вычёркиваем кратные пяти (10, 15, 20, …).";
    } else {
      info = "Следующее простое — **7**: вычёркиваем кратные семи.\n\nДальше вычёркивать не нужно: любое составное число до 100 имеет простой делитель, не превосходящий \\(\\sqrt{100} = 10\\), то есть 2, 3, 5 или 7. Все оставшиеся числа — простые: **25 простых чисел** до 100.";
    }
  } else {
    float prod2 = 1;
    string lst = "";
    repeat (6) { if (i < k2) { prod2 = prod2 * nthPrime(i + 1); if (lst != "") { lst = lst + " · "; } lst = lst + format(nthPrime(i + 1), 0); } }
    float q2 = spf(prod2 + 1);
    string verdict = "число \\(" + format(prod2 + 1, 0) + "\\) простое, и его нет в списке";
    if (!isPrime(prod2 + 1)) { verdict = "у числа \\(" + format(prod2 + 1, 0) + "\\) есть простой делитель " + format(q2, 0) + ", которого нет в списке"; }
    info = "**Простых чисел бесконечно много.** Возьмём первые " + format(k2, 0) + " простых и составим число \\(" + lst + " + 1 = " + format(prod2 + 1, 0) + "\\). При делении на каждое простое из списка оно даёт остаток 1, поэтому ни одно из них его не делит. Значит, " + verdict + ".\n\nВ любом конечном списке простых найдётся пропущенное — так рассуждал Евклид.";
  }
}
]
