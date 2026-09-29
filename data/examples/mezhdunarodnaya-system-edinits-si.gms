[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Семь столбцов — показатели степени семи основных единиц СИ. Любая производная единица — их произведение
// с коэффициентом 1: синие столбцы (показатель > 0) в числителе, оранжевые (< 0) в знаменателе. Вверху —
// получившаяся единица (с десятичной приставкой 10ᵏ) и её название, если у неё есть собственное. ----
draw Graph { name = "gBase"; graph = "gbs"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gBar"; graph = "gbr"; edgeWidth = 34; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "top"; pos = (0, 4.3); text = big; size = 2 }
draw Text { name = "u0"; pos = (-6, -4.4); text = "м"; size = 1.1 }
draw Text { name = "u1"; pos = (-4, -4.4); text = "кг"; size = 1.1 }
draw Text { name = "u2"; pos = (-2, -4.4); text = "с"; size = 1.1 }
draw Text { name = "u3"; pos = (0, -4.4); text = "А"; size = 1.1 }
draw Text { name = "u4"; pos = (2, -4.4); text = "К"; size = 1.1 }
draw Text { name = "u5"; pos = (4, -4.4); text = "моль"; size = 1.1 }
draw Text { name = "u6"; pos = (6, -4.4); text = "кд"; size = 1.1 }

new UI { type = slider; label = "м"; variable = e0; min = -4; max = 4; step = 1; default = 1 }
new UI { type = slider; label = "кг"; variable = e1; min = -4; max = 4; step = 1; default = 1 }
new UI { type = slider; label = "с"; variable = e2; min = -4; max = 4; step = 1; default = -2 }
new UI { type = slider; label = "А"; variable = e3; min = -4; max = 4; step = 1; default = 0 }
new UI { type = slider; label = "К"; variable = e4; min = -4; max = 4; step = 1; default = 0 }
new UI { type = slider; label = "моль"; variable = e5; min = -4; max = 4; step = 1; default = 0 }
new UI { type = slider; label = "кд"; variable = e6; min = -4; max = 4; step = 1; default = 0 }
new UI { type = slider; label = "приставка 10ᵏ"; variable = k; min = -9; max = 9; step = 3; default = 0 }

// ---- Логика ----
float e0 = 1; float e1 = 1; float e2 = -2; float e3 = 0; float e4 = 0; float e5 = 0; float e6 = 0; float k = 0;
string big = ""; string info = "";

Function sup(v) {
  string s = ""; if (v < 0) { s = "⁻"; } float a = round(abs(v));
  if (a == 1) { return ""; }
  if (a == 2) { return s + "²"; } if (a == 3) { return s + "³"; } if (a == 4) { return s + "⁴"; } if (a == 5) { return s + "⁵"; }
  if (a == 6) { return s + "⁶"; } if (a == 7) { return s + "⁷"; } if (a == 8) { return s + "⁸"; } return s + "⁹";
}
Function ev(j) {
  if (j == 0) { return e0; } if (j == 1) { return e1; } if (j == 2) { return e2; } if (j == 3) { return e3; } if (j == 4) { return e4; } if (j == 5) { return e5; } return e6;
}
Function un(j) {
  if (j == 0) { return "м"; } if (j == 1) { return "кг"; } if (j == 2) { return "с"; } if (j == 3) { return "А"; } if (j == 4) { return "К"; } if (j == 5) { return "моль"; } return "кд";
}
Function eq(a, b, c, d) { return e0 == a && e1 == b && e2 == c && e3 == d && e4 == 0 && e5 == 0 && e6 == 0; }
Function sym() {
  if (eq(0, 0, -1, 0)) { return "Гц"; } if (eq(1, 1, -2, 0)) { return "Н"; } if (eq(-1, 1, -2, 0)) { return "Па"; }
  if (eq(2, 1, -2, 0)) { return "Дж"; } if (eq(2, 1, -3, 0)) { return "Вт"; } if (eq(0, 0, 1, 1)) { return "Кл"; }
  if (eq(2, 1, -3, -1)) { return "В"; } if (eq(2, 1, -3, -2)) { return "Ом"; } if (eq(-2, -1, 4, 2)) { return "Ф"; }
  if (eq(-2, -1, 3, 2)) { return "См"; } if (eq(0, 1, -2, -1)) { return "Тл"; } if (eq(2, 1, -2, -1)) { return "Вб"; }
  if (eq(2, 1, -2, -2)) { return "Гн"; }
  return "";
}
Function nam(s) {
  if (s == "Гц") { return "герц (1/с)"; } if (s == "Н") { return "ньютон (сила)"; } if (s == "Па") { return "паскаль (давление)"; }
  if (s == "Дж") { return "джоуль (энергия, работа)"; } if (s == "Вт") { return "ватт (мощность)"; } if (s == "Кл") { return "кулон (заряд)"; }
  if (s == "В") { return "вольт (напряжение)"; } if (s == "Ом") { return "ом (сопротивление)"; } if (s == "Ф") { return "фарад (ёмкость)"; }
  if (s == "См") { return "сименс (проводимость)"; } if (s == "Тл") { return "тесла (магнитная индукция)"; }
  if (s == "Вб") { return "вебер (магнитный поток)"; } return "генри (индуктивность)";
}
Function pre() {
  if (k == -9) { return "н"; } if (k == -6) { return "мк"; } if (k == -3) { return "м"; } if (k == 3) { return "к"; } if (k == 6) { return "М"; } if (k == 9) { return "Г"; }
  return "";
}
Function ksup() {
  string s = ""; if (k < 0) { s = "⁻"; } float a = abs(k);
  if (a == 3) { return s + "³"; } if (a == 6) { return s + "⁶"; } return s + "⁹";
}
Function unit() {
  string nu = ""; string de = ""; float nd = 0;
  repeat (7) {
    float v = ev(i);
    if (v > 0) { if (nu != "") { nu = nu + "·"; } nu = nu + un(i) + sup(v); }
    if (v < 0) { if (de != "") { de = de + "·"; } de = de + un(i) + sup(-v); nd = nd + 1; }
  }
  if (nu == "" && de == "") { return "1"; }
  if (nu == "") { nu = "1"; }
  if (de == "") { return nu; }
  if (nd > 1) { return nu + "/(" + de + ")"; }
  return nu + "/" + de;
}

Update {
  gbs = newGraph(); gbr = newGraph();
  addNode(gbs, "a", [-7.5, 0]); addNode(gbs, "b", [7.5, 0]); addEdge(gbs, "a", "b");
  repeat (7) {
    float v = ev(i); float x = -6 + 2 * i;
    if (v != 0) {
      string c = "#3b82f6"; if (v < 0) { c = "#f59e0b"; }
      addNode(gbr, "p" + format(i, 0), [x, 0]); addNode(gbr, "q" + format(i, 0), [x, 0.9 * v]); addEdge(gbr, "p" + format(i, 0), "q" + format(i, 0), 1, c);
    }
  }
  string u = unit(); string sy = sym();
  string shown = u;
  if (sy != "") { shown = pre() + sy; if (k != 0 && pre() == "") { shown = sy; } }
  if (k != 0 && sy == "") { shown = "10" + ksup() + " · " + u; }
  big = shown;
  info = "**СИ:** семь основных единиц (м, кг, с, А, К, моль, кд) независимы; все остальные — производные, выражаются через основные только умножением и делением **с коэффициентом 1**. Выбрана единица **" + u + "**";
  if (sy != "") { info = info + " = **" + sy + "**, " + nam(sy) + "."; }
  else if (u == "1") { info = info + " — безразмерная величина."; }
  else { info = info + "; собственного названия у неё нет."; }
  if (k != 0) { info = info + "\n\nДесятичная приставка не создаёт новой единицы, а лишь сдвигает порядок: 1 " + big + " = 10" + ksup() + " " + u + "."; }
}
]
