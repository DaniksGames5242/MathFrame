[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Кривая xⁿ + yⁿ = 1 в первой четверти (масштаб: 1 = 7.6 клетки). Решение aⁿ + bⁿ = cⁿ
// в натуральных числах — это рациональная точка (a/c, b/c) на ней. Зелёные — точные
// рациональные точки со знаменателем c ≤ N, красные кружки — «почти решения». ----
new Point { name = "O"; pos = (-3.8, -4.2); dynamic = false; collision = false; size = 0.5 }
new Point { name = "XE"; pos = (4.4, -4.2); dynamic = false; collision = false; active = false }
new Point { name = "YE"; pos = (-3.8, 4.4); dynamic = false; collision = false; active = false }
new Line { name = "ax"; pos = (O, XE); thickness = 1.5; interact = false }
new Line { name = "ay"; pos = (O, YE); thickness = 1.5; interact = false }
draw Vector { name = "vax"; edge = "ax"; pos = 1 }
draw Vector { name = "vay"; edge = "ay"; pos = 1 }
draw Text { name = "one1"; pos = (3.8, -4.65); text = "1"; size = 1 }
draw Text { name = "one2"; pos = (-4.15, 3.4); text = "1"; size = 1 }
new Curve { name = "fc"; type = parametric; x = "-3.8 + 7.6 * pow(cos(pi / 2 * t), 2 / n)"; y = "-4.2 + 7.6 * pow(sin(pi / 2 * t), 2 / n)"; segments = 300; color = #3b82f6; thickness = 3 }
draw Graph { name = "gEx"; graph = "gx"; nodeColor = #22c55e; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 30 }
draw Graph { name = "gNear"; graph = "gm"; nodeColor = #ef4444; nodeRadius = 7; labels = false; interactive = false; showWeights = false; layer = 29 }
new Point { name = "P"; curve = "fc"; t = 0.35; text = true("P"); pauseOnDrag = false; color = #f59e0b; layer = 60 }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 2; max = 7; step = 1; default = 3 }
new UI { name = "sC"; type = slider; label = "знаменатели до N"; variable = N; min = 10; max = 120; step = 1; default = 60 }

// ---- Логика ----
float n = 3; float N = 60;
float key = -1;
float found = 0;
string ex = ""; string near = "";
string info = "";

Function sup(e) { if (e == 3) { return "³"; } if (e == 4) { return "⁴"; } if (e == 5) { return "⁵"; } if (e == 6) { return "⁶"; } return "⁷"; }
Function sx(x) { return -3.8 + 7.6 * x; }
Function sy(y) { return -4.2 + 7.6 * y; }

Update {
  if (n * 1000 + N != key) {
    gx = newGraph(); gm = newGraph(); found = 0; ex = ""; near = "";
    float best1 = 1; float best2 = 1; float best3 = 1;
    string s1 = ""; string s2 = ""; string s3 = "";
    float x1 = 0; float y1 = 0; float x2 = 0; float y2 = 0; float x3 = 0; float y3 = 0;
    // Для каждой пары a < c ищем b с aⁿ + bⁿ = cⁿ (b ≥ a — чтобы не считать пары дважды)
    repeat (N - 1) {
      float c = i + 2;
      repeat (c - 1) {
        float a = i + 1;
        float r = pow(c, n) - pow(a, n);
        float b = round(pow(r, 1 / n));
        if (b >= a && b < c) {
          float d = pow(a, n) + pow(b, n) - pow(c, n);
          if (d == 0) {
            found = found + 1;
            addNode(gx, format(a, 0) + "/" + format(c, 0) + "a", [sx(a / c), sy(b / c)]);
            addNode(gx, format(a, 0) + "/" + format(c, 0) + "b", [sx(b / c), sy(a / c)]);
            if (found <= 5) { ex = ex + format(a, 0) + "² + " + format(b, 0) + "² = " + format(c, 0) + "²;  "; }
          }
          else {
            // «почти решение»: относительная ошибка |d| / cⁿ
            float e = abs(d) / pow(c, n);
            string t = format(a, 0) + sup(n) + " + " + format(b, 0) + sup(n) + " = " + format(c, 0) + sup(n);
            if (d > 0) { t = t + " + " + format(d, 0); } else { t = t + " − " + format(-d, 0); }
            if (e < best1) { best3 = best2; s3 = s2; x3 = x2; y3 = y2; best2 = best1; s2 = s1; x2 = x1; y2 = y1; best1 = e; s1 = t; x1 = a / c; y1 = b / c; }
            else { if (e < best2) { best3 = best2; s3 = s2; x3 = x2; y3 = y2; best2 = e; s2 = t; x2 = a / c; y2 = b / c; } else { if (e < best3) { best3 = e; s3 = t; x3 = a / c; y3 = b / c; } } }
          }
        }
      }
    }
    if (n > 2) { addNode(gm, "m1", [sx(x1), sy(y1)]); addNode(gm, "m2", [sx(x2), sy(y2)]); addNode(gm, "m3", [sx(x3), sy(y3)]); }
    near = s1; if (s2 != "") { near = near + ";  " + s2; } if (s3 != "") { near = near + ";  " + s3; }
    key = n * 1000 + N;
  }
  float px = (P.pos.x + 3.8) / 7.6; float py = (P.pos.y + 4.2) / 7.6;

  info = "**Великая теорема Ферма:** при n > 2 уравнение xⁿ + yⁿ = zⁿ не имеет решений в натуральных числах (доказана Э. Уайлсом в 1994 году). Поделив на zⁿ, получаем равносильную формулировку: на кривой xⁿ + yⁿ = 1 нет рациональных точек, кроме (1; 0) и (0; 1). Решение aⁿ + bⁿ = cⁿ — это рациональная точка (a/c; b/c).\n\nn = " + format(n, 0) + ", знаменатели c ≤ " + format(N, 0) + ": ";
  if (n == 2) { info = info + "рациональных точек много (зелёные) — это пифагоровы тройки: " + ex + "…  Всего найдено " + format(found, 0) + " троек (a ≤ b); на окружности рациональные точки всюду плотны."; }
  else { info = info + "ни одной рациональной точки. Ближе всего к кривой подходят (красные кружки): " + near + "."; }
  info = info + "\n\nТочка P на кривой: (" + format(px, 4) + "; " + format(py, 4) + ").";
}
]
