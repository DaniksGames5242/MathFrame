[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Синий график — подынтегральная функция f, жёлтый — одна из первообразных G = F + C (C сдвигает её
// вверх-вниз), зелёная короткая прямая — касательная к G в точке x₀: её наклон равен f(x₀).
// По x одна единица поля = 0,5 (t = X/2), по y — ky. ----
draw Function { name = "gF"; f = "fl"; xmin = -8; xmax = 8; color = #3b82f6; thickness = 3; layer = 5 }
draw Function { name = "gG"; f = "gl"; xmin = -8; xmax = 8; color = #f59e0b; thickness = 3; layer = 6 }
draw Graph { name = "gT"; graph = "gt"; edgeColor = #22c55e; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #3b82f6; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #f59e0b; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 10 }

new UI { name = "sM"; type = select; label = "метод"; variable = cs; options = ("1", "2", "3", "4", "5"); labels = ("замена переменной", "по частям", "рациональная дробь", "тригонометрия", "не берётся"); default = "1" }
new UI { name = "sP"; type = slider; label = "p"; variable = p; min = 0.5; max = 3; step = 0.1; default = 1 }
new UI { name = "sC"; type = slider; label = "C"; variable = cc; min = -2; max = 2; step = 0.1; default = 0 }
new UI { name = "sX"; type = slider; label = "x₀"; variable = x0; min = -3.8; max = 3.8; step = 0.05; default = 1 }

// ---- Логика ----
string cs = "1"; float p = 1; float cc = 0; float x0 = 1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function erf(z) {
  float s = 1; float a = z;
  if (z < 0) { s = -1; a = -z; }
  float u = 1 / (1 + 0.3275911 * a);
  float q = u * (0.254829592 + u * (-0.284496736 + u * (1.421413741 + u * (-1.453152027 + u * 1.061405429))));
  return s * (1 - q * exp(-a * a));
}
Function ky() { if (cs == "1") { return 1; } if (cs == "2") { return 1; } if (cs == "3") { return 1.5; } if (cs == "4") { return 0.6; } return 0.4; }
Function f(t) {
  if (cs == "1") { return 2 * p * t / (1 + t * t); }
  if (cs == "2") { return t * sin(p * t); }
  if (cs == "3") { return (3 * t + 1) / (t * t + p * p); }
  if (cs == "4") { return sin(p * t) * sin(p * t); }
  return exp(-p * t * t);
}
Function F(t) {
  if (cs == "1") { return p * log(1 + t * t); }
  if (cs == "2") { return sin(p * t) / (p * p) - t * cos(p * t) / p; }
  if (cs == "3") { return 1.5 * log(t * t + p * p) + atan(t / p) / p; }
  if (cs == "4") { return t / 2 - sin(2 * p * t) / (4 * p); }
  return 0.886227 / sqrt(p) * erf(sqrt(p) * t);
}
Function fl(X) { return f(X / 2) / ky(); }
Function gl(X) { return (F(X / 2) + cc) / ky(); }

Update {
  float fx = f(x0); float gx = F(x0) + cc;
  float h = 0.001;
  float dg = (F(x0 + h) - F(x0 - h)) / (2 * h);
  float sl = fx / (2 * ky());
  gt = newGraph(); ga = newGraph(); gb = newGraph();
  addNode(ga, "a", [2 * x0, fx / ky()]);
  addNode(gb, "b", [2 * x0, gx / ky()]);
  addNode(gt, "t1", [2 * x0 - 1.5, gx / ky() - 1.5 * sl]); addNode(gt, "t2", [2 * x0 + 1.5, gx / ky() + 1.5 * sl]); addEdge(gt, "t1", "t2");
  info = "**Методы интегрирования** сводят ∫ f(x) dx к табличному виду или строят первообразную явно; результат проверяется дифференцированием: G′ = f. Синий график — f, жёлтый — первообразная G = F + C: постоянная C только сдвигает её по вертикали, а касательная (зелёная) в любой точке имеет наклон f(x₀).\n\n";
  if (cs == "1") { info = info + "**Замена переменной.** ∫ 2p·x/(1 + x²) dx, p = " + num(p, 1) + ". Множитель 2x — производная внутренней функции 1 + x², поэтому t = 1 + x², dt = 2x dx: ∫ p dt/t = p ln|t| + C = p ln(1 + x²) + C."; }
  if (cs == "2") { info = info + "**Интегрирование по частям.** ∫ x·sin(" + num(p, 1) + "x) dx. Дифференцируем то, что упрощается: u = x, dv = sin(" + num(p, 1) + "x) dx, v = −cos(" + num(p, 1) + "x)/" + num(p, 1) + ". Тогда ∫ u dv = uv − ∫ v du = −x cos(" + num(p, 1) + "x)/" + num(p, 1) + " + sin(" + num(p, 1) + "x)/" + num(p * p, 2) + " + C."; }
  if (cs == "3") { info = info + "**Рациональная дробь.** ∫ (3x + 1)/(x² + " + num(p * p, 2) + ") dx: знаменатель неприводим, дробь раскладывается на два слагаемых: 3x/(x² + " + num(p * p, 2) + ") даёт логарифм, 1/(x² + " + num(p * p, 2) + ") — арктангенс. Итог: (3/2) ln(x² + " + num(p * p, 2) + ") + (1/" + num(p, 1) + ") arctg(x/" + num(p, 1) + ") + C."; }
  if (cs == "4") { info = info + "**Тригонометрия.** ∫ sin²(" + num(p, 1) + "x) dx: чётная степень, применяем формулу понижения sin² α = (1 − cos 2α)/2. Итог: x/2 − sin(" + num(2 * p, 1) + "x)/" + num(4 * p, 1) + " + C."; }
  if (cs == "5") { info = info + "**Неберущийся интеграл.** ∫ e^(−" + num(p, 1) + "x²) dx: подынтегральная функция элементарна, а первообразная через элементарные функции не выражается (график G построен через функцию ошибок, а не формулой). Методы не образуют исчерпывающего алгоритма."; }
  info = info + "\n\n**x₀ = " + num(x0, 2) + ":** f(x₀) = " + num(fx, 4) + ", G(x₀) = " + num(gx, 4) + ", разностное G′(x₀) = " + num(dg, 4) + " — совпадает с f(x₀).";
}
]
