[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Вкладки 1–3: график f (синий) в координатах поля; вкладка 3 — кривая (g(t), f(t)). Вкладка 4 — окно
// t = X/2, y = Y/2. Оранжевое — касательная / хорда / многочлен Тейлора, зелёное — точки c и касательные в них. ----
draw Function { name = "gF1"; f = "fx"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 3 }
draw Function { name = "gTn"; f = "tn1"; xmin = -8; xmax = 8; color = #f59e0b; thickness = 2 }
draw Graph { name = "gSg"; graph = "sg"; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Graph { name = "gSo"; graph = "so"; nodeColor = #f59e0b; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Graph { name = "gP1"; graph = "p1"; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
new Claster { name = "tab1"; elements = (gF1, gTn, gSg, gSo, gP1); active = true }

draw Function { name = "gF2"; f = "fx"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 3 }
draw Graph { name = "gCh"; graph = "ch"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gTg"; graph = "tg"; edgeColor = #22c55e; edgeWidth = 2; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Text { name = "lA2"; pos = (ax, ay - 0.7); text = "a"; size = 1 }
draw Text { name = "lB2"; pos = (bx, by - 0.7); text = "b"; size = 1 }
new Claster { name = "tab2"; elements = (gF2, gCh, gTg, lA2, lB2); active = false }

draw Graph { name = "gCv"; graph = "cv"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gCh3"; graph = "ch3"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gTg3"; graph = "tg3"; edgeColor = #22c55e; edgeWidth = 2; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 9 }
draw Text { name = "lA3"; pos = (ax, ay - 0.7); text = "a"; size = 1 }
draw Text { name = "lB3"; pos = (bx, by - 0.7); text = "b"; size = 1 }
new Claster { name = "tab3"; elements = (gCv, gCh3, gTg3, lA3, lB3); active = false }

draw Function { name = "gF4"; f = "ft"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 3 }
draw Function { name = "gPn"; f = "pn"; xmin = -8; xmax = 8; color = #f59e0b; thickness = 2 }
draw Graph { name = "gP4"; graph = "p4"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
new Claster { name = "tab4"; elements = (gF4, gPn, gP4); active = false }

new UI { name = "b1"; type = button; label = "Ферма"; action = "tab = 1; tab1.active = true; tab2.active = false; tab3.active = false; tab4.active = false" }
new UI { name = "b2"; type = button; label = "Ролль и Лагранж"; action = "tab = 2; tab1.active = false; tab2.active = true; tab3.active = false; tab4.active = false" }
new UI { name = "b3"; type = button; label = "Коши"; action = "tab = 3; tab1.active = false; tab2.active = false; tab3.active = true; tab4.active = false" }
new UI { name = "b4"; type = button; label = "Тейлор"; action = "tab = 4; tab1.active = false; tab2.active = false; tab3.active = false; tab4.active = true" }
new UI { name = "sV"; type = select; label = "f"; variable = fv; options = ("w", "c"); labels = ("2,2·sin 0,55x + 0,12x", "x³/100"); default = "w"; active = tab < 4 }
new UI { name = "sX"; type = slider; label = "x₀"; variable = x0; min = -6; max = 6; step = 0.05; default = 1; active = tab == 1 }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = -6; max = 5.5; step = 0.05; default = -4; active = tab == 2 || tab == 3 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = a + 0.4; max = 6; step = 0.05; default = 4; active = (tab == 2 && !ro) || tab == 3 }
new UI { name = "sR"; type = toggle; label = "Ролль: f(b) = f(a)"; variable = ro; default = false; active = tab == 2 }
new UI { name = "sT"; type = select; label = "f"; variable = tf; options = ("sin", "exp", "ln"); labels = ("sin x", "eˣ", "ln(1 + x)"); default = "sin"; active = tab == 4 }
new UI { name = "sTa"; type = slider; label = "центр a"; variable = ta; min = amin(); max = 3; step = 0.1; default = 0; active = tab == 4 }
new UI { name = "sTn"; type = slider; label = "степень n"; variable = tn; min = 0; max = 8; step = 1; default = 3; active = tab == 4 }
new UI { name = "sTx"; type = slider; label = "точка x"; variable = tx; min = amin(); max = 4; step = 0.05; default = 2; active = tab == 4 }

// ---- Логика ----
float tab = 1; string fv = "w"; string tf = "sin"; bool ro = false;
float x0 = 1; float a = -4; float b = 4; float ta = 0; float tn = 3; float tx = 2;
float ax = 0; float ay = 0; float bx = 0; float by = 0;
float c0 = 0; float c1 = 0; float c2 = 0; float c3 = 0; float c4 = 0; float c5 = 0; float c6 = 0; float c7 = 0; float c8 = 0;
string key = ""; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function amin() { if (tf == "ln") { return -0.5; } return -3; }
Function fx(x) { if (fv == "w") { return 2.2 * sin(0.55 * x) + 0.12 * x; } return 0.01 * x * x * x; }
Function f1(x) { if (fv == "w") { return 1.21 * cos(0.55 * x) + 0.12; } return 0.03 * x * x; }
Function gx(t) { return 1.1 * t + 0.4 * sin(0.9 * t); }
Function g1(t) { return 1.1 + 0.36 * cos(0.9 * t); }
Function tn1(x) { return fx(x0) + f1(x0) * (x - x0); }
// вкладка 4: t = X/2, y = Y/2
Function fT(t) { if (tf == "sin") { return sin(t); } if (tf == "exp") { return exp(t); } if (t < -0.98) { return -50; } return log(1 + t); }
Function ft(X) { return 2 * fT(X / 2); }
Function coef(k) {
  float fk = 1; repeat (k) { fk = fk * (i + 1); }
  if (tf == "sin") { return sin(ta + k * 1.5707963) / fk; }
  if (tf == "exp") { return exp(ta) / fk; }
  if (k == 0) { return log(1 + ta); }
  return (2 * (k - 2 * floor(k / 2)) - 1) / (k * pow(1 + ta, k));
}
Function pn(X) {
  float u = X / 2 - ta; float s = c0;
  if (tn >= 1) { s = s + c1 * u; } if (tn >= 2) { s = s + c2 * u * u; } if (tn >= 3) { s = s + c3 * pow(u, 3); }
  if (tn >= 4) { s = s + c4 * pow(u, 4); } if (tn >= 5) { s = s + c5 * pow(u, 5); } if (tn >= 6) { s = s + c6 * pow(u, 6); }
  if (tn >= 7) { s = s + c7 * pow(u, 7); } if (tn >= 8) { s = s + c8 * pow(u, 8); }
  return 2 * s;
}
// корни h(t) = f′(t) − K·g′(t) на (a; b) (для Лагранжа g′ = 1); до трёх корней в c1..c3 → r1..r3
float r1 = 0; float r2 = 0; float r3 = 0; float nr = 0; float K = 0;
Function hh(t, mode) { if (mode == 1) { return f1(t) - K; } return f1(t) - K * g1(t); }
Function findRoots(mode) {
  nr = 0; float xp = a; float gp = hh(a, mode);
  repeat (240) {
    float xn = a + (b - a) * (i + 1) / 240; float gn = hh(xn, mode);
    if (gp * gn < 0) {
      float l = xp; float r = xn;
      repeat (30) { float m = (l + r) / 2; if (hh(l, mode) * hh(m, mode) <= 0) { r = m; } if (hh(l, mode) * hh(m, mode) > 0) { l = m; } }
      if (nr == 0) { r1 = (l + r) / 2; } if (nr == 1) { r2 = (l + r) / 2; } if (nr == 2) { r3 = (l + r) / 2; }
      nr = nr + 1;
    }
    xp = xn; gp = gn;
  }
  return nr;
}
Function seg(g, n, px, py, sl, hl) { addNode(g, n + "1", [px - hl, py - sl * hl]); addNode(g, n + "2", [px + hl, py + sl * hl]); addEdge(g, n + "1", n + "2"); return 0; }
Function rootsText(mode) {
  string s = "";
  if (nr == 0) { return "не найдено"; }
  s = "c₁ = " + num(r1, 3); if (nr > 1) { s = s + ", c₂ = " + num(r2, 3); } if (nr > 2) { s = s + ", c₃ = " + num(r3, 3); }
  return s;
}

Update {
  if (ro && tab == 2) {
    float fa = fx(a); float st = a + 0.3; float prev = fx(st) - fa; float found = 0;
    repeat (240) {
      float xn = a + 0.3 + 0.05 * (i + 1);
      if (found == 0 && xn <= 6) {
        float cur = fx(xn) - fa;
        if (prev * cur < 0) {
          float l = xn - 0.05; float r = xn;
          repeat (30) { float m = (l + r) / 2; if ((fx(l) - fa) * (fx(m) - fa) <= 0) { r = m; } if ((fx(l) - fa) * (fx(m) - fa) > 0) { l = m; } }
          b = (l + r) / 2; found = 1;
        }
        prev = cur;
      }
    }
  }
  string nk = format(tab, 0) + fv + tf + format(x0, 3) + format(a, 3) + format(b, 3) + format(ta, 3) + format(tn, 0) + format(tx, 3) + format(ro, 0);
  if (nk != key) {
    key = nk;
    if (tab == 1) {
      p1 = newGraph(); sg = newGraph(); so = newGraph();
      addNode(p1, "p", [x0, fx(x0)]);
      if (fv == "w") { addNode(sg, "e1", [3.0367, fx(3.0367)]); addNode(sg, "e2", [-3.0367, fx(-3.0367)]); }
      if (fv == "c") { addNode(so, "z", [0, 0]); }
      info = "**Теорема Ферма.** Если функция дифференцируема в точке x₀ и x₀ — точка локального экстремума, то f′(x₀) = 0: касательная в ней горизонтальна.\n\n";
      info = info + "**x₀ = " + num(x0, 2) + ":** f(x₀) = " + num(fx(x0), 3) + ", f′(x₀) = " + num(f1(x0), 3) + ".\n\n";
      if (fv == "w") { info = info + "Зелёные точки — локальные экстремумы функции (максимум в x ≈ 3,04, минимум в x ≈ −3,04). В них касательная горизонтальна; в остальных точках f′ ≠ 0, и экстремума нет."; }
      if (fv == "c") { info = info + "Для f(x) = x³/100 производная f′(x) = 3x²/100 обращается в нуль при x = 0 (оранжевая точка), но экстремума там нет — функция возрастает. Обратное к теореме Ферма неверно: f′(x₀) = 0 необходимо, но не достаточно."; }
    }
    if (tab == 2) {
      ch = newGraph(); tg = newGraph();
      ax = a; ay = fx(a); bx = b; by = fx(b);
      K = (fx(b) - fx(a)) / (b - a);
      addNode(ch, "A", [ax, ay]); addNode(ch, "B", [bx, by]); addEdge(ch, "A", "B");
      findRoots(1);
      if (nr > 0) { seg(tg, "s1", r1, fx(r1), K, 1.5); }
      if (nr > 1) { seg(tg, "s2", r2, fx(r2), K, 1.5); }
      if (nr > 2) { seg(tg, "s3", r3, fx(r3), K, 1.5); }
      info = "**Теорема Лагранжа.** Если f непрерывна на отрезке [a; b] и дифференцируема на (a; b), то существует c ∈ (a; b), для которого f(b) − f(a) = f′(c)·(b − a): касательная в точке c параллельна хорде (оранжевая линия). При f(a) = f(b) это **теорема Ролля**: хорда горизонтальна, f′(c) = 0.\n\n";
      info = info + "**a = " + num(a, 2) + ", b = " + num(b, 2) + ":** f(a) = " + num(fx(a), 3) + ", f(b) = " + num(fx(b) , 3) + ", (f(b) − f(a))/(b − a) = " + num(K, 4) + ". Точки c (f′(c) = " + num(K, 3) + "): " + rootsText(1) + ".";
      if (abs(fx(b) - fx(a)) < 0.03) { info = info + "\n\nЗдесь f(b) ≈ f(a) — случай теоремы Ролля: в точках c производная равна нулю."; }
      if (ro && fv == "c") { info = info + "\n\nФункция x³/100 монотонна, поэтому f(b) = f(a) при b > a невозможно — условие теоремы Ролля не выполнено (рассматривается последнее b)."; }
    }
    if (tab == 3) {
      cv = newGraph(); ch3 = newGraph(); tg3 = newGraph();
      repeat (61) { addNode(cv, "v" + format(i, 0), [gx(-6 + 0.2 * i), fx(-6 + 0.2 * i)]); }
      repeat (60) { addEdge(cv, "v" + format(i, 0), "v" + format(i + 1, 0)); }
      ax = gx(a); ay = fx(a); bx = gx(b); by = fx(b);
      K = (fx(b) - fx(a)) / (gx(b) - gx(a));
      addNode(ch3, "A", [ax, ay]); addNode(ch3, "B", [bx, by]); addEdge(ch3, "A", "B");
      findRoots(2);
      if (nr > 0) { seg(tg3, "s1", gx(r1), fx(r1), K, 1.5); }
      if (nr > 1) { seg(tg3, "s2", gx(r2), fx(r2), K, 1.5); }
      if (nr > 2) { seg(tg3, "s3", gx(r3), fx(r3), K, 1.5); }
      info = "**Теорема Коши.** Если f и g непрерывны на [a; b], дифференцируемы на (a; b) и g′ ≠ 0 на (a; b), то существует c ∈ (a; b): (f(b) − f(a))/(g(b) − g(a)) = f′(c)/g′(c). Здесь g(t) = 1,1t + 0,4·sin 0,9t, а кривая — точки (g(t), f(t)): касательная в точке c параллельна хорде.\n\n";
      info = info + "**a = " + num(a, 2) + ", b = " + num(b, 2) + ":** (f(b) − f(a))/(g(b) − g(a)) = " + num(K, 4) + ". Точки c, где f′(c)/g′(c) равно этому числу: " + rootsText(2) + ".";
    }
    if (tab == 4) {
      p4 = newGraph();
      c0 = coef(0); c1 = coef(1); c2 = coef(2); c3 = coef(3); c4 = coef(4); c5 = coef(5); c6 = coef(6); c7 = coef(7); c8 = coef(8);
      float pv = pn(2 * tx) / 2; float fv2 = fT(tx);
      addNode(p4, "f", [2 * tx, 2 * fv2]); addNode(p4, "p", [2 * tx, 2 * pv]); addEdge(p4, "f", "p");
      float h = abs(tx - ta); float fact = 1; repeat (tn + 1) { fact = fact * (i + 1); }
      float bound = 1; string M = "1";
      if (tf == "sin") { bound = pow(h, tn + 1) / fact; }
      if (tf == "exp") { bound = exp(max(ta, tx)) * pow(h, tn + 1) / fact; M = "e^" + num(max(ta, tx), 2); }
      if (tf == "ln") { bound = pow(h, tn + 1) / ((tn + 1) * pow(1 + min(ta, tx), tn + 1)); M = "n!/(1 + " + num(min(ta, tx), 2) + ")ⁿ⁺¹"; }
      string nm = "sin x"; if (tf == "exp") { nm = "eˣ"; } if (tf == "ln") { nm = "ln(1 + x)"; }
      info = "**Формула Тейлора.** f(x) = Σₖ₌₀ⁿ f⁽ᵏ⁾(a)/k!·(x − a)ᵏ + f⁽ⁿ⁺¹⁾(ξ)/(n + 1)!·(x − a)ⁿ⁺¹, ξ между a и x. Синий график — f(x) = " + nm + ", оранжевый — многочлен Тейлора Pₙ степени n = " + format(tn, 0) + " с центром a = " + num(ta, 1) + ".\n\n";
      info = info + "**Коэффициенты** f⁽ᵏ⁾(a)/k!: " + num(c0, 4);
      if (tn >= 1) { info = info + "; " + num(c1, 4); } if (tn >= 2) { info = info + "; " + num(c2, 4); } if (tn >= 3) { info = info + "; " + num(c3, 4); }
      if (tn >= 4) { info = info + "; " + num(c4, 4); } if (tn >= 5) { info = info + "; " + num(c5, 4); } if (tn >= 6) { info = info + "; " + num(c6, 4); }
      if (tn >= 7) { info = info + "; " + num(c7, 4); } if (tn >= 8) { info = info + "; " + num(c8, 4); }
      info = info + ".\n\n**x = " + num(tx, 2) + ":** f(x) = " + num(fv2, 5) + ", Pₙ(x) = " + num(pv, 5) + ", остаток Rₙ = " + num(fv2 - pv, 6) + ". Оценка Лагранжа |Rₙ| ≤ M·|x − a|ⁿ⁺¹/(n + 1)! = " + format(bound, 6) + " (M = " + M + ").";
      if (tf == "ln" && h > 1 + ta) { info = info + " Точка x дальше от центра, чем радиус сходимости 1 + a, — с ростом n многочлены удаляются от функции."; }
    }
  }
}
]
