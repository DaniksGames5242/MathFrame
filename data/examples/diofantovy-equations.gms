[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;
show axes = true;

// ---- Целочисленная решётка окна −10…10 × −6…6 (серые точки). Зелёные — целые решения
// выбранного уравнения. ----
draw Graph { name = "gL"; graph = "gl"; nodeColor = #3b82f688; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gS"; graph = "gs"; nodeColor = #22c55e; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 10 }

new UI { type = select; label = "уравнение"; variable = tp; options = ("lin", "sum", "dif"); labels = ("ax + by = n", "ax² + by² = n", "ax² − by² = n"); default = "lin" }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 12; step = 1; default = 3 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = 12; step = 1; default = 5 }
new UI { type = slider; label = "n"; variable = n; min = -30; max = 60; step = 1; default = 14 }

string tp = "lin"; float a = 3; float b = 5; float n = 14;
float key = -1; float cnt = 0; string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function gcd(x, y) {
  float u = abs(x); float v = abs(y);
  repeat (30) { if (v > 0) { float t = u - v * floor(u / v); u = v; v = t; } }
  return u;
}
Function hit(x, y) {
  float s = a * x + b * y;
  if (tp == "sum") { s = a * x * x + b * y * y; }
  if (tp == "dif") { s = a * x * x - b * y * y; }
  if (abs(s - n) < 0.5) { return 1; }
  return 0;
}

Update {
  float tk = 0; if (tp == "sum") { tk = 1; } if (tp == "dif") { tk = 2; }
  float kk = ((tk * 13 + a) * 13 + b) * 100 + n + 40;
  if (key != kk) {
    gl = newGraph(); gs = newGraph(); cnt = 0;
    repeat (273) {
      float x = i - 21 * floor(i / 21) - 10; float y = floor(i / 21) - 6;
      addNode(gl, "p" + format(i, 0), [x, y]);
      if (hit(x, y) > 0) { addNode(gs, "s" + format(i, 0), [x, y]); cnt = cnt + 1; }
    }
    key = kk;
  }
  float g = gcd(a, b);
  string eq = "";
  if (tp == "lin") {
    eq = num(a, 0) + "x + " + num(b, 0) + "y = " + num(n, 0);
    info = "**Линейное уравнение " + eq + ".** НОД(" + num(a, 0) + ", " + num(b, 0) + ") = " + num(g, 0) + ". ";
    if (n - g * floor(n / g) == 0) { info = info + "Свободный член " + num(n, 0) + " делится на " + num(g, 0) + " — решения есть, и их бесконечно много: они лежат на одной прямой, а найдя одно, остальные получаем сдвигом на (" + num(b / g, 0) + "t, −" + num(a / g, 0) + "t), t ∈ ℤ."; }
    if (n - g * floor(n / g) != 0) { info = info + "Свободный член " + num(n, 0) + " на " + num(g, 0) + " не делится, а левая часть всегда делится — решений нет."; }
  }
  if (tp == "sum") {
    eq = num(a, 0) + "x² + " + num(b, 0) + "y² = " + num(n, 0);
    info = "**Квадратичное уравнение " + eq + ".** Здесь общей формулы, как для линейного, уже нет: нужно разбираться с каждым случаем. Сумма двух неотрицательных слагаемых равна n, поэтому решений конечное число — они лежат на эллипсе и симметричны относительно осей.";
  }
  if (tp == "dif") {
    eq = num(a, 0) + "x² − " + num(b, 0) + "y² = " + num(n, 0);
    info = "**Квадратичное уравнение " + eq + ".** Кривая — гипербола (при n = 0 — пара прямых). Целых точек на ней может не быть совсем, может быть несколько, а может быть бесконечно много (как у уравнения Пелля x² − Dy² = 1).";
  }
  info = info + "\n\nВ показанном окне (−10 ≤ x ≤ 10, −6 ≤ y ≤ 6) целых решений: **" + format(cnt, 0) + "**. Для уравнений степени выше первой универсального алгоритма, отвечающего «есть ли целые решения», не существует.";
}
]
