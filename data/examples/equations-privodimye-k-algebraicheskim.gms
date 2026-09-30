[
description = "{info}"

field width = 10;
field height = 8;
camera type = fixed;

// ---- Три уравнения, сводящиеся к квадратному заменой t: биквадратное (t = x²), показательное
// (t = 2ˣ) и возвратное (t = x + 1/x). Синяя кривая — левая часть f(x); зелёные точки — корни
// исходного уравнения, полученные обратной заменой (посторонние t отбрасываются по ОДЗ). ----
string kd = "bi"; float p = 5; float q = 4; float key = -1; string info = "";
Function f(x) {
  if (kd == "bi") { return pow(x, 4) - p * x * x + q; }
  if (kd == "exp") { return exp(2 * x * log(2)) - p * exp(x * log(2)) + q; }
  if (abs(x) < 0.0001) { return 1000; }
  return x * x + 1 / (x * x) - p * (x + 1 / x) + q;
}
draw Function { name = "gr"; f = "f"; xmin = -5; xmax = 5; grid = true; color = #3b82f6; thickness = 3 }
draw Graph { name = "gRoot"; graph = "groot"; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 8 }
new UI { type = select; label = "уравнение"; variable = kd; options = ("bi", "exp", "rec"); labels = ("x⁴ − px² + q = 0", "4ˣ − p·2ˣ + q = 0", "x² + 1/x² − p(x + 1/x) + q = 0"); default = "bi" }
new UI { type = slider; label = "p"; variable = p; min = -6; max = 6; step = 0.5; default = 5 }
new UI { type = slider; label = "q"; variable = q; min = -4; max = 6; step = 0.5; default = 4 }

Function num(x, d) { if (abs(x) < 0.5 * pow(10, -d)) { return format(0, d); } if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function term(c, m) { if (abs(c) < 0.005) { return ""; } if (c < 0) { return " − " + format(-c, 2) + m; } return " + " + format(c, 2) + m; }
Function nrt(t) {
  if (kd == "bi") { if (t < -0.0001) { return 0; } if (t < 0.0001) { return 1; } return 2; }
  if (kd == "exp") { if (t > 0.0001) { return 1; } return 0; }
  if (abs(t) < 1.9999) { return 0; } if (abs(t) < 2.0001) { return 1; } return 2;
}
Function xr(t, j) {
  if (kd == "bi") { if (j < 0.5) { return sqrt(max(t, 0)); } return -sqrt(max(t, 0)); }
  if (kd == "exp") { return log(t) / log(2); }
  float s = sqrt(max(t * t - 4, 0));
  if (j < 0.5) { return (t + s) / 2; } return (t - s) / 2;
}
Function why(t) {
  if (kd == "bi") { return "t < 0: x² = t корней не имеет"; }
  if (kd == "exp") { return "t ≤ 0: 2ˣ > 0, посторонний корень"; }
  return "|t| < 2: x + 1/x = t корней не имеет";
}

Update {
  float kk = p * 100 + q * 7 + 1000;
  if (kd == "exp") { kk = kk + 1; } if (kd == "rec") { kk = kk + 2; }
  float q2 = q; if (kd == "rec") { q2 = q - 2; }
  float D = p * p - 4 * q2;
  string tl = ""; float cnt = 0;
  if (key != kk) { groot = newGraph(); }
  string eq = "";
  if (kd == "bi") { eq = "x⁴" + term(-p, "x²") + term(q, "") + " = 0"; }
  if (kd == "exp") { eq = "4ˣ" + term(-p, "·2ˣ") + term(q, "") + " = 0"; }
  if (kd == "rec") { eq = "x² + 1/x²" + term(-p, "(x + 1/x)") + term(q, "") + " = 0"; }
  string sub = "t = x² (t ≥ 0), x⁴ = t²";
  if (kd == "exp") { sub = "t = 2ˣ (t > 0), 4ˣ = t²"; }
  if (kd == "rec") { sub = "t = x + 1/x (|t| ≥ 2), x² + 1/x² = t² − 2"; }
  string head = "**Уравнение, приводимое к алгебраическому:** " + eq + ". Замена " + sub + " даёт квадратное t² " + term(-p, "t") + term(q2, "") + " = 0, D = " + num(D, 2) + ".\n\n";
  if (D < 0) { tl = "**D < 0:** квадратное уравнение корней не имеет, значит, и исходное тоже."; }
  else {
    float s = sqrt(D);
    repeat (2) {
      float ii = i;
      float t = (p + (2 * ii - 1) * s) / 2;
      if (!(ii > 0.5 && s < 0.0001)) {
        float m = nrt(t);
        string sx = "";
        repeat (m) { float x = xr(t, i); sx = sx + "x = " + num(x, 3) + "; "; if (key != kk) { addNode(groot, "r" + format(ii, 0) + "_" + format(i, 0), [x, 0]); } cnt = cnt + 1; }
        if (m < 0.5) { sx = why(t); }
        tl = tl + "**t = " + num(t, 3) + ":** " + sx + "\n\n";
      }
    }
  }
  key = kk;
  info = head + tl + "Число корней исходного уравнения: **" + format(cnt, 0) + "**. Каждый подходящий корень t даёт по обратной замене нуль, один или два значения x, а проверка ОДЗ отсекает посторонние корни.";
}
]
