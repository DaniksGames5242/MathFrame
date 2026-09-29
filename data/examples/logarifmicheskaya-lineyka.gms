[
description = "{info}"

field width = 20;
field height = 5.6;
camera type = fixed;

// ---- Шкала D неподвижна, шкала C (движок) сдвигается; отрезок от 1 до числа на шкале пропорционален его логарифму.
// Оранжевый бегунок — визир. ----
draw Graph { name = "gD"; graph = "gd"; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gC"; graph = "gc"; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gV"; graph = "gv"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "d1"; pos = (px(1), -1.5); text = "1"; size = 0.95 }
draw Text { name = "d2"; pos = (px(2), -1.5); text = "2"; size = 0.95 }
draw Text { name = "d3"; pos = (px(3), -1.5); text = "3"; size = 0.95 }
draw Text { name = "d4"; pos = (px(4), -1.5); text = "4"; size = 0.95 }
draw Text { name = "d5"; pos = (px(5), -1.5); text = "5"; size = 0.95 }
draw Text { name = "d6"; pos = (px(6), -1.5); text = "6"; size = 0.95 }
draw Text { name = "d7"; pos = (px(7), -1.5); text = "7"; size = 0.95 }
draw Text { name = "d8"; pos = (px(8), -1.5); text = "8"; size = 0.95 }
draw Text { name = "d9"; pos = (px(9), -1.5); text = "9"; size = 0.95 }
draw Text { name = "d10"; pos = (px(10), -1.5); text = "10"; size = 0.95 }
draw Text { name = "c1"; pos = (px(1) + sh, 1.3); text = "1"; size = 0.95; active = abs(px(1) + sh) < 9.5 }
draw Text { name = "c2"; pos = (px(2) + sh, 1.3); text = "2"; size = 0.95; active = abs(px(2) + sh) < 9.5 }
draw Text { name = "c3"; pos = (px(3) + sh, 1.3); text = "3"; size = 0.95; active = abs(px(3) + sh) < 9.5 }
draw Text { name = "c4"; pos = (px(4) + sh, 1.3); text = "4"; size = 0.95; active = abs(px(4) + sh) < 9.5 }
draw Text { name = "c5"; pos = (px(5) + sh, 1.3); text = "5"; size = 0.95; active = abs(px(5) + sh) < 9.5 }
draw Text { name = "c6"; pos = (px(6) + sh, 1.3); text = "6"; size = 0.95; active = abs(px(6) + sh) < 9.5 }
draw Text { name = "c7"; pos = (px(7) + sh, 1.3); text = "7"; size = 0.95; active = abs(px(7) + sh) < 9.5 }
draw Text { name = "c8"; pos = (px(8) + sh, 1.3); text = "8"; size = 0.95; active = abs(px(8) + sh) < 9.5 }
draw Text { name = "c9"; pos = (px(9) + sh, 1.3); text = "9"; size = 0.95; active = abs(px(9) + sh) < 9.5 }
draw Text { name = "c10"; pos = (px(10) + sh, 1.3); text = "10"; size = 0.95; active = abs(px(10) + sh) < 9.5 }
draw Text { name = "nD"; pos = (-9.4, -1.5); text = "D"; size = 1.1; align = left }
draw Text { name = "nC"; pos = (-9.4, 1.3); text = "C"; size = 1.1; align = left }

new UI { name = "sO"; type = select; label = "действие"; variable = op; options = ("mul", "div"); labels = ("x · y", "x : y"); default = "mul" }
new UI { name = "sX"; type = slider; label = "x"; variable = X; min = 1; max = 9.95; step = 0.05; default = 2 }
new UI { name = "sY"; type = slider; label = "y"; variable = Y; min = 1; max = 9.95; step = 0.05; default = 3.5 }

// ---- Логика ----
string op = "mul"; float X = 2; float Y = 3.5; float sh = 0; float key = -1; string info = ""; float ln10 = 2.302585093;

Function lg(v) { return log(v) / ln10; }
Function px(v) { return -8 + 16 * lg(v); }
Function tk(k) { if (k - 10 * floor(k / 10) == 0) { return 0.6; } if (k - 5 * floor(k / 5) == 0) { return 0.42; } return 0.26; }
Function fmt(v) { if (v >= 100) { return format(v, 0); } if (v >= 10) { return format(v, 1); } return format(v, 2); }

Update {
  float oc = 0; if (op == "div") { oc = 1; }
  if (key != oc + 2 * (X + 20 * Y)) {
    // сдвиг движка и результат
    float res = X * Y; float rp = 0;
    if (op == "mul") { sh = 16 * lg(X); if (X * Y > 10) { sh = sh - 16; } res = X * Y; }
    else { sh = 16 * (lg(X) - lg(Y)); res = X / Y; }
    gd = newGraph(); gc = newGraph(); gv = newGraph();
    addNode(gd, "d0", [-8, -0.6]); addNode(gd, "d1", [8, -0.6]); addEdge(gd, "d0", "d1");
    float cl = -8 + sh; float cr = 8 + sh; if (cl < -9.8) { cl = -9.8; } if (cr > 9.8) { cr = 9.8; }
    addNode(gc, "c0", [cl, 0.6]); addNode(gc, "c1", [cr, 0.6]); addEdge(gc, "c0", "c1");
    repeat (91) { float v = 1 + i / 10; float h = tk(i); float x = px(v);
      addNode(gd, "u" + format(i, 0), [x, -0.6]); addNode(gd, "w" + format(i, 0), [x, -0.6 + h]); addEdge(gd, "u" + format(i, 0), "w" + format(i, 0));
      if (abs(x + sh) < 9.8) { addNode(gc, "u" + format(i, 0), [x + sh, 0.6]); addNode(gc, "w" + format(i, 0), [x + sh, 0.6 - h]); addEdge(gc, "u" + format(i, 0), "w" + format(i, 0)); } }
    // визир: при умножении стоит на y (шкала C), при делении — на x (шкала D), результат под индексом
    float vp = px(Y) + sh; if (op == "div") { vp = px(X); }
    addNode(gv, "v0", [vp, 1.9]); addNode(gv, "v1", [vp, -1.9]); addEdge(gv, "v0", "v1");
    float ip = -8 + sh; if (ip < -8) { ip = 8 + sh; }
    if (op == "div") { addNode(gv, "i0", [ip, 1.9]); addNode(gv, "i1", [ip, -1.9]); addEdge(gv, "i0", "i1"); }
    if (op == "mul") { info = "**" + format(X, 2) + " · " + format(Y, 2) + " = " + fmt(res) + ".** Индекс шкалы C поставлен над " + format(X, 2) + " на шкале D. Длина от 1 до x на D равна lg x, поэтому добавленный отрезок lg y приводит визир к lg x + lg y = lg(xy). Под визиром на D читаем цифры результата; порядок числа находим прикидкой."; if (X * Y > 10) { info = info + "\n\nПроизведение больше 10, поэтому в дело идёт правый индекс шкалы C (его метка 10)."; } }
    else { info = "**" + format(X, 2) + " : " + format(Y, 2) + " = " + fmt(res) + ".** Число " + format(Y, 2) + " на шкале C подведено под " + format(X, 2) + " на шкале D: отрезок от индекса до визира — разность lg x − lg y = lg(x : y). Результат читается на D под индексом шкалы C."; if (X < Y) { info = info + "\n\nЧастное меньше 1, поэтому индекс — правый (метка 10), результат читается с множителем 10⁻¹."; } }
    key = oc + 2 * (X + 20 * Y);
  }
}
]
