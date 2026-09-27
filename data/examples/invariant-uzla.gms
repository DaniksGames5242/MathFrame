[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Диаграмма узла: дуги — куски кривой между проходами «снизу» (разрывы). Клик по дуге
// меняет её цвет (красный → синий → зелёный). Серый кружок — перекрёсток, где нарушено
// правило раскраски. ----
draw Graph { name = "gBad"; graph = "gb"; nodeColor = #6b7280; nodeRadius = 24; labels = false; interactive = false; showWeights = false; layer = 5 }
new Curve { name = "k0"; type = parametric; x = "kx(0, t)"; y = "ky(0, t)"; segments = 160; color = cc(0); thickness = 6; layer = 20 }
new Curve { name = "k1"; type = parametric; x = "kx(1, t)"; y = "ky(1, t)"; segments = 160; color = cc(1); thickness = 6; layer = 20; active = nA > 1 }
new Curve { name = "k2"; type = parametric; x = "kx(2, t)"; y = "ky(2, t)"; segments = 160; color = cc(2); thickness = 6; layer = 20; active = nA > 2 }
new Curve { name = "k3"; type = parametric; x = "kx(3, t)"; y = "ky(3, t)"; segments = 160; color = cc(3); thickness = 6; layer = 20; active = nA > 3 }

new UI { name = "sK"; type = select; label = "диаграмма"; variable = kn; options = ("tre", "fig", "unk"); labels = ("трилистник", "восьмёрка", "тривиальный узел с петлёй"); default = "tre" }
new UI { name = "bR"; type = button; label = "Все дуги красные"; action = "resetCol = 1" }

// ---- Логика ----
string kn = "tre";
string lastKn = "";
float nA = 3; float nC = 3;
float S = 1.3;
float dl = 0.13;
float clicks = 0;
float resetCol = 0;
float bad = 0; float used = 0;
// дуги: параметры начала и конца; перекрёстки: верхняя дуга, две нижние, координаты
list as = (0, 0, 0, 0); list ae = (0, 0, 0, 0); list col = (0, 0, 0, 0);
list co = (0, 0, 0, 0); list cu = (0, 0, 0, 0); list cv = (0, 0, 0, 0); list cx = (0, 0, 0, 0); list cy = (0, 0, 0, 0);
string info = "";

Function X(t) {
  if (kn == "tre") { return sin(t) + 2 * sin(2 * t); }
  if (kn == "fig") { return (2 + cos(2 * t)) * cos(3 * t); }
  return 2.2 * sin(t);
}
Function Y(t) {
  if (kn == "tre") { return cos(t) - 2 * cos(2 * t); }
  if (kn == "fig") { return (2 + cos(2 * t)) * sin(3 * t); }
  return 1.3 * sin(2 * t);
}
Function par(k, t) { return as[k] + dl + (ae[k] - as[k] - 2 * dl) * t; }
Function kx(k, t) { return S * X(par(k, t)); }
Function ky(k, t) { return S * Y(par(k, t)); }
Function cc(k) { if (col[k] == 0) { return "#ef4444"; } if (col[k] == 1) { return "#3b82f6"; } return "#22c55e"; }
Function setArc(k, s, e) { as[k] = s; ae[k] = e; return 0; }
Function setCr(k, o, u, v, x, y) { co[k] = o; cu[k] = u; cv[k] = v; cx[k] = x * S; cy[k] = y * S; return 0; }

Update {
  if (kn != lastKn || resetCol == 1) {
    if (kn == "tre") { nA = 3; nC = 3;
      setArc(0, 0.2709, 2.3653); setArc(1, 2.3653, 4.4597); setArc(2, 4.4597, 6.5541);
      setCr(0, 1, 2, 0, 1.3, -0.75); setCr(1, 0, 1, 2, 0, 1.5); setCr(2, 2, 0, 1, -1.3, -0.75); }
    if (kn == "fig") { nA = 4; nC = 4;
      setArc(0, 1.0472, 2.618); setArc(1, 2.618, 4.1888); setArc(2, 4.1888, 5.7596); setArc(3, 5.7596, 7.3304);
      setCr(0, 3, 0, 1, 0, 2.5); setCr(1, 2, 3, 0, -1.5, 0); setCr(2, 0, 1, 2, 1.5, 0); setCr(3, 1, 2, 3, 0, -2.5); }
    if (kn == "unk") { nA = 1; nC = 1;
      setArc(0, pi, 3 * pi); setCr(0, 0, 0, 0, 0, 0); }
    repeat (4) { col[i] = 0; }
    lastKn = kn; resetCol = 0;
  }
  // Клик — ближайшая дуга меняет цвет
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    float best = 0.5; float bk = -1;
    repeat (nA) { float k = i; repeat (41) {
      float d = sqrt((kx(k, i / 40) - mouseClickX) ^ 2 + (ky(k, i / 40) - mouseClickY) ^ 2);
      if (d < best) { best = d; bk = k; }
    } }
    if (bk >= 0) { col[bk] = col[bk] + 1; if (col[bk] > 2) { col[bk] = 0; } }
  }
  // Правило: в каждом перекрёстке три конца дуг — либо одного цвета, либо всех трёх разных
  gb = newGraph(); bad = 0;
  repeat (nC) {
    float a = col[co[i]]; float b = col[cu[i]]; float c = col[cv[i]];
    float ok = 0;
    if (a == b && b == c) { ok = 1; }
    if (a != b && b != c && a != c) { ok = 1; }
    if (ok == 0) { bad = bad + 1; addNode(gb, "x" + format(i, 0), [cx[i], cy[i]]); }
  }
  float u0 = 0; float u1 = 0; float u2 = 0;
  repeat (nA) { if (col[i] == 0) { u0 = 1; } if (col[i] == 1) { u1 = 1; } if (col[i] == 2) { u2 = 1; } }
  used = u0 + u1 + u2;

  info = "**Инвариант узла** — величина, которая не меняется при движениях Рейдемейстера, то есть одинакова для всех диаграмм одного узла. Простой пример — **раскрашиваемость в три цвета**: дуги диаграммы красятся так, чтобы в каждом перекрёстке сходились либо один цвет, либо все три, и хотя бы два цвета использованы. Тривиальный узел так раскрасить нельзя; значит, узел, который можно, — нетривиален. Число всех раскрасок (вместе с одноцветными) тоже инвариант: 3 у тривиального узла, 9 у трилистника, 3 у восьмёрки.\n\n";
  if (bad > 0) { info = info + "Нарушено правило в перекрёстках (серые кружки): " + format(bad, 0) + "."; }
  else {
    if (used >= 2) { info = info + "**Правильная раскраска в " + format(used, 0) + " цвета** — узел нетривиален."; }
    else { info = info + "Одноцветная раскраска правильна всегда и ничего не доказывает."; }
  }
  if (kn == "fig") { info = info + " Восьмёрка нетривиальна, но в три цвета не раскрашивается: этот инвариант её не отличает от тривиального узла."; }
  if (kn == "unk") { info = info + " У диаграммы одна дуга — раскраска только одноцветная. Петлю убирает первое движение Рейдемейстера."; }
  info = info + "\n\nКлик по дуге меняет её цвет.";
}
]
