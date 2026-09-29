[
description = "{info}"

field width = 20;
field height = 9;
camera type = fixed;

// Члены ограниченной последовательности xₙ ∈ [−2; 2] и метод деления отрезка пополам: на каждом шаге остаётся половина,
// в которой членов больше. Зелёные точки — подпоследовательность: первый член после предыдущего внутри очередного отрезка.
float N = 120; float s = 4; string sq = "sin"; string info = "";
draw Graph { name = "gO"; graph = "go"; nodeColor = #3b82f6; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gI"; graph = "gi"; nodeColor = #f59e0b; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gG"; graph = "gg"; nodeColor = #22c55e; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gL"; graph = "gl"; nodeRadius = 0; edgeWidth = 1.5; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Text { name = "y2"; pos = (-9.7, 3.2); text = "2"; size = 0.9; align = left }
draw Text { name = "y0"; pos = (-9.7, 0); text = "0"; size = 0.9; align = left }
draw Text { name = "ym"; pos = (-9.7, -3.2); text = "−2"; size = 0.9; align = left }
new UI { type = select; label = "последовательность"; variable = sq; options = ("sin", "alt", "frac"); labels = ("xₙ = sin n", "xₙ = (−1)ⁿ(1 + 1/n)", "xₙ = {n√2}"); default = "sin" }
new UI { type = slider; label = "членов на рисунке"; variable = N; min = 20; max = 200; step = 10; default = 120 }
new UI { type = slider; label = "шагов деления"; variable = s; min = 0; max = 8; step = 1; default = 4 }

Function xv(n) {
  if (sq == "sin") { return sin(n); }
  if (sq == "alt") { return (1 - 2 * (n - 2 * floor(n / 2))) * (1 + 1 / n) * -1; }
  return n * sqrt(2) - floor(n * sqrt(2));
}
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function cntin(a, b) {
  float c = 0;
  repeat (N) { float v = xv(i + 1); if (v >= a && v <= b) { c = c + 1; } }
  return c;
}
Function firstin(a, b, from) {
  float r = -1;
  repeat (N) { float v = xv(i + 1); if (r < 0 && i + 1 > from && v >= a && v <= b) { r = i + 1; } }
  return r;
}
Update {
  N = round(N); s = round(s);
  go = newGraph(); gi = newGraph(); gg = newGraph(); gl = newGraph();
  list la = [-2]; list lb = [2];
  addNode(gl, "t0", [-9.6, -3.2]); addNode(gl, "t1", [9.6, -3.2]); addEdge(gl, "t0", "t1", 1, "#3b82f699");
  addNode(gl, "u0", [-9.6, 3.2]); addNode(gl, "u1", [9.6, 3.2]); addEdge(gl, "u0", "u1", 1, "#3b82f699");
  float a = -2; float b = 2;
  repeat (s) {
    float j = i + 1; float mid = (a + b) / 2;
    if (cntin(a, mid) < cntin(mid, b)) { a = mid; } else { b = mid; }
    push(la, a); push(lb, b);
    string col = "#3b82f699"; if (j == s) { col = "#f59e0b"; }
    string id = format(j, 0);
    addNode(gl, "a" + id + "0", [-9.6, 1.6 * a]); addNode(gl, "a" + id + "1", [9.6, 1.6 * a]); addEdge(gl, "a" + id + "0", "a" + id + "1", 1, col);
    addNode(gl, "b" + id + "0", [-9.6, 1.6 * b]); addNode(gl, "b" + id + "1", [9.6, 1.6 * b]); addEdge(gl, "b" + id + "0", "b" + id + "1", 1, col);
  }
  repeat (N) {
    float v = xv(i + 1); string id = "n" + format(i, 0); float px = -9 + 18 * (i + 0.5) / N;
    if (v >= a && v <= b) { addNode(gi, id, [px, 1.6 * v]); } else { addNode(go, id, [px, 1.6 * v]); }
  }
  float prev = 0; string ids = ""; float got = 0;
  repeat (s) {
    float f = firstin(la[i + 1], lb[i + 1], prev);
    if (f > 0) {
      got = got + 1; prev = f;
      addNode(gg, "g" + format(i, 0), [-9 + 18 * (f - 0.5) / N, 1.6 * xv(f)]);
      if (i < 6) { ids = ids + "n" + format(i + 1, 0) + " = " + format(f, 0) + ", "; }
    }
  }
  string nm = "sin n"; if (sq == "alt") { nm = "(−1)ⁿ(1 + 1/n)"; } if (sq == "frac") { nm = "{n√2} (дробная часть)"; }
  info = "**Теорема Больцано — Вейерштрасса:** из любой ограниченной последовательности можно выделить сходящуюся подпоследовательность. Здесь xₙ = " + nm + ", все члены лежат в отрезке [−2; 2] (показаны первые " + format(N, 0) + ").\n\n";
  info = info + "Делим отрезок пополам и оставляем половину с большим числом членов (в бесконечной последовательности хотя бы в одной половине их бесконечно много). После **" + format(s, 0) + "** шагов остался отрезок [" + num(a, 3) + "; " + num(b, 3) + "] длины " + format(b - a, 3) + " — в нём " + format(cntin(a, b), 0) + " из " + format(N, 0) + " членов (жёлтые).";
  if (got > 0) { info = info + " Подпоследовательность (зелёные): " + ids + "… — её k-й член лежит в k-м отрезке, а отрезки вложены и стягиваются в точку, поэтому она сходится."; }
}
]
