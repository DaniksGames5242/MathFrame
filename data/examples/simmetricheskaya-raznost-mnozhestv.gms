[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Универсум U — рамка, в нём 18 элементов (числа 1…18). Множества A и B — круги:
// центр и точка на окружности перетаскиваются; элемент принадлежит кругу, если он внутри. ----
draw Graph { name = "gU"; graph = "gu"; nodeRadius = 0; labels = false; interactive = false; showWeights = false; edgeWidth = 2; layer = 3 }
draw Text { name = "lblU"; pos = (-8.75, 4.55); text = "U"; size = 1.3 }
new Point { name = "A"; pos = (-2.2, 0.3); text = true("A"); color = #3b82f6; layer = 60 }
new Point { name = "AR"; pos = (1.2, 0.3); color = #3b82f6; size = 0.7; layer = 60 }
new Point { name = "B"; pos = (2.0, -0.2); text = true("B"); color = #22c55e; layer = 60 }
new Point { name = "BR"; pos = (5.2, -0.2); color = #22c55e; size = 0.7; layer = 60 }
new Circle { name = "cA"; center = A; radius = AR; color = #3b82f6; thickness = 2.5 }
new Circle { name = "cB"; center = B; radius = BR; color = #22c55e; thickness = 2.5 }
draw Graph { name = "gEl"; graph = "ge"; nodeRadius = 12; labels = true; interactive = false; showWeights = false; layer = 50 }
draw Graph { name = "gHi"; graph = "gh"; nodeRadius = 12; labels = true; interactive = false; showWeights = false; nodeColor = #f59e0b; layer = 51 }
draw Region { name = "rg1_1"; f = "frg1_1"; op = "<"; level = 0; color = #f59e0b; opacity = 0.5; quality = 3 }
new Claster { name = "tab1"; elements = (rg1_1); active = true }
draw Region { name = "rg2_1"; f = "frg2_1"; op = "<"; level = 0; color = #3b82f6; opacity = 0.45; quality = 3 }
draw Region { name = "rg2_2"; f = "frg2_2"; op = "<"; level = 0; color = #22c55e; opacity = 0.45; quality = 3 }
new Claster { name = "tab2"; elements = (rg2_1, rg2_2); active = false }
new UI { name = "btn1"; type = button; label = "Ровно в одном"; action = "tab = 1; tab1.active = true; tab2.active = false" }
new UI { name = "btn2"; type = button; label = "Две разности"; action = "tab = 2; tab1.active = false; tab2.active = true" }

// ---- Логика ----
float tab = 1;
float nEl = 18;
string info = "";
string key = "";
float ax = -2.2; float ay = 0.3; float ra = 3.4;
float bx = 2; float by = -0.2; float rb = 3.2;
float kSub = 2;
float nSubMax = 18;
list ex = [-8.0, -5.2, -2.6, 0.2, 3.4, 7.8, -8.2, -4.8, -3.2, -0.1, 0.4, 3.0, 4.6, 7.6, -7.4, -1.9, 2.0, 6.2];
list ey = [3.6, 3.3, 2.4, 3.9, 3.3, 3.6, 0.0, 0.9, -1.2, 1.3, -1.2, 0.9, -1.4, 0.2, -3.4, -2.5, -4.0, -3.7];
float UX = 9.2; float UY = 5;

func fa(x, y) = (x - ax) * (x - ax) + (y - ay) * (y - ay) - ra * ra;
func fb(x, y) = (x - bx) * (x - bx) + (y - by) * (y - by) - rb * rb;
func outU(x, y) = abs(x) > UX || abs(y) > UY;
Function frg1_1(x, y) { if (outU(x, y)) { return 1; } float p = fa(x, y); float q = fb(x, y); return p * q; }
Function frg2_1(x, y) { if (outU(x, y)) { return 1; } float p = fa(x, y); float q = fb(x, y); return max(p, -q); }
Function frg2_2(x, y) { if (outU(x, y)) { return 1; } float p = fa(x, y); float q = fb(x, y); return max(q, -p); }

// Круг целиком внутри U; положения правим только при нарушении
Function keep(C, Rp) {
  float r0 = sqrt((Rp.pos.x - C.pos.x) * (Rp.pos.x - C.pos.x) + (Rp.pos.y - C.pos.y) * (Rp.pos.y - C.pos.y));
  float r = max(1, min(4, r0));
  if (C.pos.x < -UX + r) { C.pos.x = -UX + r; } if (C.pos.x > UX - r) { C.pos.x = UX - r; }
  if (C.pos.y < -UY + r) { C.pos.y = -UY + r; } if (C.pos.y > UY - r) { C.pos.y = UY - r; }
  float dx = Rp.pos.x - C.pos.x; float dy = Rp.pos.y - C.pos.y; float d = sqrt(dx * dx + dy * dy) + 0.000001;
  if (abs(d - r) > 0.001) { Rp.pos.x = C.pos.x + r * dx / d; Rp.pos.y = C.pos.y + r * dy / d; }
  return r;
}
Function bs(s) { if (s == "") { return "∅"; } return "{" + s + "}"; }
// Как расположены A и B (по элементам универсума)
Function relText(nA, nB, nAB) {
  if (nAB == 0) { return "Множества не пересекаются (дизъюнктны)."; }
  if (nAB == nA && nAB == nB) { return "Множества состоят из одних и тех же элементов: A = B."; }
  if (nAB == nA) { return "A содержится в B: A ⊆ B."; }
  if (nAB == nB) { return "B содержится в A: B ⊆ A."; }
  return "";
}
func cnt(n) = format(n, 0);
Function binomN(n, k) {
  float v = 1;
  repeat (18) { if (i < k) { v = v * (n - i) / (i + 1); } }
  return round(v);
}

Update {
  ra = keep(A, AR); rb = keep(B, BR);
  ax = A.pos.x; ay = A.pos.y; bx = B.pos.x; by = B.pos.y;
  string ks = "";
  string sA = ""; string sB = ""; string sAB = ""; string sAnB = ""; string sBnA = ""; string sUn = ""; string sX = ""; string sNA = ""; string sNU = ""; string sNI = ""; string sNN = "";
  string sSub = "";
  float nA = 0; float nB = 0; float nAB = 0; float nUn = 0; float c = 0;
  repeat (18) {
    float a = 0; float b = 0;
    if ((ex[i] - ax) * (ex[i] - ax) + (ey[i] - ay) * (ey[i] - ay) < ra * ra) { a = 1; }
    if ((ex[i] - bx) * (ex[i] - bx) + (ey[i] - by) * (ey[i] - by) < rb * rb) { b = 1; }
    string e = cnt(i + 1);
    string sep = ", ";
    if (a == 1) { nA = nA + 1; if (sA == "") { sep = ""; } sA = sA + sep + e; }
    sep = ", ";
    if (b == 1) { nB = nB + 1; if (sB == "") { sep = ""; } sB = sB + sep + e; }
    sep = ", ";
    if (a * b == 1) { nAB = nAB + 1; if (sAB == "") { sep = ""; } sAB = sAB + sep + e; }
    sep = ", ";
    if (a * (1 - b) == 1) { if (sAnB == "") { sep = ""; } sAnB = sAnB + sep + e; }
    sep = ", ";
    if (b * (1 - a) == 1) { if (sBnA == "") { sep = ""; } sBnA = sBnA + sep + e; }
    sep = ", ";
    if (max(a, b) == 1) { nUn = nUn + 1; if (sUn == "") { sep = ""; } sUn = sUn + sep + e; }
    sep = ", ";
    if (a + b == 1) { if (sX == "") { sep = ""; } sX = sX + sep + e; }
    sep = ", ";
    if (a == 0) { if (sNA == "") { sep = ""; } sNA = sNA + sep + e; }
    sep = ", ";
    if (max(a, b) == 0) { if (sNU == "") { sep = ""; } sNU = sNU + sep + e; }
    sep = ", ";
    if (a * b == 0) { if (sNI == "") { sep = ""; } sNI = sNI + sep + e; }
    float r = (tab == 1 ? a + b - 2 * a * b : (tab == 2 ? a + b - 2 * a * b : 0));
    ks = ks + cnt(a + 2 * b + 4 * r);
    if (a == 1) { c = c + 1; }
  }
  string k2 = ks + "_" + cnt(tab) + "_" + cnt(kSub);
  if (k2 != key) {
    key = k2;
    gu = newGraph(); ge = newGraph(); gh = newGraph();
    addNode(gu, "a", [-UX, -UY]); addNode(gu, "b", [UX, -UY]); addNode(gu, "c", [UX, UY]); addNode(gu, "d", [-UX, UY]);
    addEdge(gu, "a", "b"); addEdge(gu, "b", "c"); addEdge(gu, "c", "d"); addEdge(gu, "d", "a");
    float c = 0;
    repeat (18) {
      float a = 0; float b = 0;
      if ((ex[i] - ax) * (ex[i] - ax) + (ey[i] - ay) * (ey[i] - ay) < ra * ra) { a = 1; }
      if ((ex[i] - bx) * (ex[i] - bx) + (ey[i] - by) * (ey[i] - by) < rb * rb) { b = 1; }
      float r = (tab == 1 ? a + b - 2 * a * b : (tab == 2 ? a + b - 2 * a * b : 0));
      if (a == 1) { c = c + 1; }
      string nm = "e" + cnt(i + 1);
      addNode(ge, nm, [ex[i], ey[i]], cnt(i + 1));
      if (r == 1) { addNode(gh, nm, [ex[i], ey[i]], cnt(i + 1)); }
    }
  }
  float nU = 18;
  nSubMax = nA;
  string eA = bs(sA); string eB = bs(sB);
  float nAnB = nA - nAB; float nBnA = nB - nAB;
  if (tab == 1) {
    info = "**Симметрическая разность** \\(A \\triangle B\\) — элементы, принадлежащие ровно одному из множеств: \\(A \\triangle B = (A \\cup B) \\setminus (A \\cap B)\\).\n\nA = " + eA + ", B = " + eB + ", \\(A \\triangle B\\) = " + bs(sX) + " (выделено).\n\nМощность: \\(|A \\triangle B| = |A| + |B| - 2|A \\cap B| = " + cnt(nA) + " + " + cnt(nB) + " - 2 \\cdot " + cnt(nAB) + " = " + cnt(nA + nB - 2 * nAB) + "\\)." + (nA + nB - 2 * nAB == 0 ? " Множества совпадают: \\(A \\triangle A = \\varnothing\\)." : "");
  }
  else if (tab == 2) {
    info = "**Через обычные разности:** \\(A \\triangle B = (A \\setminus B) \\cup (B \\setminus A)\\) — синяя часть " + bs(sAnB) + " и зелёная " + bs(sBnA) + ". Они не пересекаются, поэтому мощности складываются: " + cnt(nAnB) + " + " + cnt(nBnA) + " = " + cnt(nAnB + nBnA) + ".\n\nНет выделенного «уменьшаемого»: от перестановки A и B результат не меняется, операция коммутативна. Пустое множество — нейтральный элемент, а каждое множество обратно самому себе.";
  }

}
]
