[
description = "{info}"

field width = 16;
field height = 8;
camera type = fixed;

// ---- Вещественная прямая. Чёрточки — корни всех многочленов a·x² + b·x + c с целыми
// коэффициентами |a|, |b|, |c| ≤ H: алгебраические числа. X — любое вещественное число. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f6; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gAl"; graph = "gl"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3; edgeCap = butt }
draw Text { name = "tPi"; pos = (3.14159265, 1.9); text = "π"; size = 1.1; color = #f59e0b }
draw Text { name = "tE"; pos = (2.71828183, -1.9); text = "e"; size = 1.1; color = #f59e0b }
new Point { name = "Pp"; pos = (3.14159265, 1.3); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "Pe"; pos = (2.71828183, -1.3); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "X"; pos = (1.6, 0); color = #22c55e; pauseOnDrag = false; collideWithPoints = false }

new UI { name = "sH"; type = slider; label = "H"; variable = H; min = 1; max = 6; step = 1; default = 2 }
new UI { name = "sP"; type = select; label = "число X"; variable = pre; options = ("free", "pi", "e", "phi", "sqrt2"); labels = ("любая точка", "π", "e", "(1 + √5)/2", "√2"); default = "pi" }

float H = 2; string pre = "pi"; string prevPre = "";
float key = -1; float kx = 0; float kh = -1;
float nRoots = 0; float bestD = 0; float bestX = 0; string info = "";

Function num(x, d) { if (x < -0.00001) { return "−" + format(-x, d); } return format(abs(x), d); }

Update {
  if (key < 0) {
    gx = newGraph();
    addNode(gx, "a1", [-7.9, 0]); addNode(gx, "a2", [7.9, 0]); addEdge(gx, "a1", "a2");
    repeat (15) { addNode(gx, "x" + format(i, 0), [i - 7, -0.25]); addNode(gx, "X" + format(i, 0), [i - 7, 0.25]); addEdge(gx, "x" + format(i, 0), "X" + format(i, 0)); }
    key = 0;
  }
  if (pre != prevPre) {
    prevPre = pre;
    if (pre == "pi") { X.pos.x = 3.14159265; X.pos.y = 0; }
    if (pre == "e") { X.pos.x = 2.71828183; X.pos.y = 0; }
    if (pre == "phi") { X.pos.x = 1.61803399; X.pos.y = 0; }
    if (pre == "sqrt2") { X.pos.x = 1.41421356; X.pos.y = 0; }
  }
  if (abs(X.pos.y) > 0.0001) { X.pos.y = 0; }
  if (kh != H) {
    kh = H; kx = 99;
    gl = newGraph(); nRoots = 0;
    repeat (H) {
      float a = i + 1;
      repeat (2 * H + 1) {
        float b = i - H;
        float b2 = i;
        repeat (2 * H + 1) {
          float c = i - H;
          float D = b * b - 4 * a * c;
          if (D >= 0) {
            float r1 = (-b - sqrt(D)) / (2 * a); float r2 = (-b + sqrt(D)) / (2 * a);
            if (abs(r1) < 7.8) { nRoots = nRoots + 1; addNode(gl, "u" + format(nRoots, 0), [r1, -0.5]); addNode(gl, "v" + format(nRoots, 0), [r1, 0.5]); addEdge(gl, "u" + format(nRoots, 0), "v" + format(nRoots, 0), 1, "#3b82f6"); }
            if (abs(r2) < 7.8 && D > 0) { nRoots = nRoots + 1; addNode(gl, "u" + format(nRoots, 0), [r2, -0.5]); addNode(gl, "v" + format(nRoots, 0), [r2, 0.5]); addEdge(gl, "u" + format(nRoots, 0), "v" + format(nRoots, 0), 1, "#3b82f6"); }
          }
        }
      }
    }
  }
  if (kx != X.pos.x || kh != H + 1000 * 0) {
    if (kx != X.pos.x) {
      kx = X.pos.x;
      bestD = 99; bestX = 0;
      float xx = X.pos.x;
      repeat (H) {
        float a = i + 1;
        repeat (2 * H + 1) {
          float b = i - H;
          repeat (2 * H + 1) {
            float c = i - H;
            float D = b * b - 4 * a * c;
            if (D >= 0) {
              float r1 = (-b - sqrt(D)) / (2 * a); float r2 = (-b + sqrt(D)) / (2 * a);
              if (abs(r1 - xx) < bestD) { bestD = abs(r1 - xx); bestX = r1; }
              if (abs(r2 - xx) < bestD) { bestD = abs(r2 - xx); bestX = r2; }
            }
          }
        }
      }
    }
  }
  string s = "**Трансцендентное число** — вещественное число, не являющееся корнем ни одного ненулевого многочлена с рациональными коэффициентами. Алгебраических чисел счётное множество, вещественных — континуум, поэтому трансцендентных «почти все».\n\n";
  s = s + "Синие чёрточки — корни всех многочленов ax² + bx + c с целыми коэффициентами, |a|, |b|, |c| ≤ " + format(H, 0) + " (" + format(nRoots, 0) + " корней на отрезке).\n\n";
  s = s + "X = " + num(X.pos.x, 6) + ". Ближайший из отмеченных корней " + num(bestX, 6) + ", расстояние " + num(bestD, 6) + ". ";
  if (bestD < 0.0000001) { s = s + "**X — корень многочлена такого вида, значит, алгебраическое число.**"; }
  if (bestD >= 0.0000001) { s = s + "X не является корнем ни одного из этих многочленов. Увеличение H (и степени многочленов) сближает корни с X сколь угодно тесно, но каждое число остаётся либо алгебраическим, либо **трансцендентным**; для π и e трансцендентность доказана."; }
  info = s;
}
]
