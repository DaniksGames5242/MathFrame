[
description = "{info}"

field width = 8;
field height = 6;
camera type = fixed;

// ---- Доказательство переходом к разности: L ≥ R ⇔ L − R ≥ 0. Синяя кривая — левая часть L(a),
// оранжевая — правая R(a), зелёная — разность L − R, которая записана как квадрат и потому
// неотрицательна при любом a. Точка A на оси — значение a; зелёный отрезок — L − R в этой точке. ----
string kd = "sq"; float b = 1; float key = -1; string info = "";
Function L(x) {
  if (kd == "sq") { return x * x + b * b; }
  if (kd == "quad") { return x * x + x + 1; }
  if (kd == "four") { return pow(x, 4) + 1; }
  return (x * x + b * b) / 2;
}
Function R(x) {
  if (kd == "sq") { return 2 * x * b; }
  if (kd == "quad") { return 0; }
  if (kd == "four") { return 2 * x * x; }
  return (x + b) * (x + b) / 4;
}
Function Df(x) { return L(x) - R(x); }
draw Function { name = "gL"; f = "L"; xmin = -4; xmax = 4; grid = true; color = #3b82f6; thickness = 3 }
draw Function { name = "gR"; f = "R"; xmin = -4; xmax = 4; color = #f59e0b; thickness = 3 }
draw Function { name = "gD"; f = "Df"; xmin = -4; xmax = 4; color = #22c55e; thickness = 2 }
draw Graph { name = "gSeg"; graph = "gseg"; edgeColor = #22c55e; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
new Point { name = "A"; pos = (1.5, 0); pauseOnDrag = false; text = true("a") }
new UI { type = select; label = "неравенство"; variable = kd; options = ("sq", "quad", "four", "mean"); labels = ("a² + b² ≥ 2ab", "a² + a + 1 > 0", "a⁴ + 1 ≥ 2a²", "(a² + b²)/2 ≥ ((a + b)/2)²"); default = "sq" }
new UI { type = slider; label = "b"; variable = b; min = -2; max = 2; step = 0.1; default = 1 }

Function num(x, d) { if (abs(x) < 0.5 * pow(10, -d)) { return format(0, d); } if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  if (abs(A.pos.y) > 0.0001) { A.pos.y = 0; }
  if (abs(A.pos.x) > 3.85) { A.pos.x = 3.85 * sign(A.pos.x); }
  float x = A.pos.x;
  float l = L(x); float r = R(x);
  float kk = x * 1000 + b * 13 + 5;
  if (kd == "quad") { kk = kk + 1; } if (kd == "four") { kk = kk + 2; } if (kd == "mean") { kk = kk + 3; }
  if (key != kk) { gseg = newGraph(); addNode(gseg, "u", [x, r]); addNode(gseg, "w", [x, l]); addEdge(gseg, "u", "w"); key = kk; }
  string bs = num(b, 1);
  string t = "";
  if (kd == "sq") { t = "**a² + b² ≥ 2ab.** Переходим к разности: a² + b² − 2ab = (a − b)² ≥ 0. Квадрат неотрицателен, равенство — только при a = b. Здесь b = " + bs + ": L = " + num(l, 3) + ", R = " + num(r, 3) + ", L − R = (" + num(x, 2) + " − " + bs + ")² = " + num(l - r, 3) + "."; }
  if (kd == "quad") { t = "**a² + a + 1 > 0.** Выделяем полный квадрат: a² + a + 1 = (a + ½)² + ¾ ≥ ¾ > 0 при любом a; правая часть R = 0. Здесь L − R = (" + num(x + 0.5, 2) + ")² + 0.75 = " + num(l, 3) + " > 0, а наименьшее значение ¾ достигается при a = −½."; }
  if (kd == "four") { t = "**a⁴ + 1 ≥ 2a².** Разность a⁴ + 1 − 2a² = (a² − 1)² ≥ 0; равенство при a = ±1. Здесь L = " + num(l, 3) + ", R = " + num(r, 3) + ", L − R = (" + num(x * x, 2) + " − 1)² = " + num(l - r, 3) + "."; }
  if (kd == "mean") { t = "**(a² + b²)/2 ≥ ((a + b)/2)².** Разность (a² + b²)/2 − (a + b)²/4 = (a − b)²/4 ≥ 0; равенство при a = b. Здесь b = " + bs + ": L = " + num(l, 3) + ", R = " + num(r, 3) + ", L − R = (" + num(x, 2) + " − " + bs + ")²/4 = " + num(l - r, 3) + "."; }
  info = t + "\n\n**Метод:** чтобы доказать L ≥ R при всех значениях переменных, показывают, что L − R приводится к виду, знак которого очевиден (сумма квадратов); зелёная кривая нигде не уходит под ось, касаясь её только в случае равенства.";
}
]
