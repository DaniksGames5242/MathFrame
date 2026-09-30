[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// Синяя кривая — плотность F(d₁; d₂), жёлтая — F(d₂; d₁) (плотность величины 1/X). Ось x: 1 единица = 4 поля (x от 0 до 5).
// Точка A задаёт x; вертикаль — значение плотности F(d₁; d₂) в точке x.
float d1 = 5; float d2 = 10; float sx = 4; float y0 = -4.5; float ky = 6;
float key = -99; float xv = 1; float fa = 0; float fb = 0;
string info = "";

Function ff(x, a, b) { return gamma((a + b) / 2) / (gamma(a / 2) * gamma(b / 2)) * pow(a / b, a / 2) * pow(x, a / 2 - 1) * pow(1 + a * x / b, -(a + b) / 2); }
func fd(X) = y0 + min(ky * ff((X + 10) / sx, d1, d2), 10.4);
func fs(X) = y0 + min(ky * ff((X + 10) / sx, d2, d1), 10.4);
draw Function { name = "gd"; f = "fd"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Function { name = "gs"; f = "fs"; xmin = -10; xmax = 10; thickness = 2; color = #f59e0b; layer = 25 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; nodeRadius = 0; edgeWidth = 2; labels = false; interactive = false; showWeights = false; layer = 40 }
new Point { name = "A"; pos = (-6, -4.5); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
draw Text { name = "tX"; pos = (A.pos.x, y0 - 1.1); text = "x"; size = 0.95; color = #3b82f6 }
draw Text { name = "x0"; pos = (-9.6, y0 - 0.55); text = "0"; size = 0.7 }
draw Text { name = "x1"; pos = (-10 + sx, y0 - 0.55); text = "1"; size = 0.7 }
draw Text { name = "x2"; pos = (-10 + 2 * sx, y0 - 0.55); text = "2"; size = 0.7 }
draw Text { name = "x3"; pos = (-10 + 3 * sx, y0 - 0.55); text = "3"; size = 0.7 }
draw Text { name = "x4"; pos = (-10 + 4 * sx, y0 - 0.55); text = "4"; size = 0.7 }
draw Text { name = "x5"; pos = (9.6, y0 - 0.55); text = "5"; size = 0.7 }

new UI { type = slider; label = "d₁ (числитель)"; variable = d1; min = 1; max = 30; step = 1; default = 5 }
new UI { type = slider; label = "d₂ (знаменатель)"; variable = d2; min = 1; max = 30; step = 1; default = 10 }

Function pk(a, b) { if (a > 2) { return ff((a - 2) * b / (a * (b + 2)), a, b); } return 1; }
Update {
  if (abs(A.pos.y - y0) > 0.0001) { A.pos.y = y0; }
  if (A.pos.x < -9.5) { A.pos.x = -9.5; }
  if (A.pos.x > 9.5) { A.pos.x = 9.5; }
  xv = (A.pos.x + 10) / sx;
  ky = 6.5 / max(pk(d1, d2), pk(d2, d1));
  if (key != A.pos.x * 100 + d1 * 0.01 + d2 * 0.0001) {
    ga = newGraph(); gm = newGraph();
    fa = ff(xv, d1, d2);
    addNode(gm, "p", [A.pos.x, y0]); addNode(gm, "q", [A.pos.x, y0 + min(10.4, ky * fa)]); addEdge(gm, "p", "q", 1, "#3b82f6");
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (6) { float tx = -10 + sx * i; addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0)); }
    key = A.pos.x * 100 + d1 * 0.01 + d2 * 0.0001;
  }
  fa = ff(xv, d1, d2); fb = ff(1 / xv, d2, d1) / (xv * xv);
  string m0 = "не существует (d₂ ≤ 2)"; if (d2 > 2) { m0 = "d₂/(d₂ − 2) = " + format(d2 / (d2 - 2), 3); }
  string md = "0"; if (d1 > 2) { md = "(d₁ − 2)d₂/(d₁(d₂ + 2)) = " + format((d1 - 2) * d2 / (d1 * (d2 + 2)), 3); }
  string z0 = "равна 0"; if (d1 == 2) { z0 = "конечна и положительна"; } if (d1 == 1) { z0 = "стремится к +∞"; }
  info = "**Распределение Фишера** F(d₁; d₂) с числами степеней свободы числителя d₁ = **" + format(d1, 0) + "** и знаменателя d₂ = **" + format(d2, 0) + "** — закон отношения (χ²(d₁)/d₁)/(χ²(d₂)/d₂) независимых величин. Носитель — x > 0.\n\n";
  info = info + "**У нуля:** плотность " + z0 + " (при d₁ > 2 нуль, при d₁ = 2 конечное значение, при d₁ = 1 особенность). **Среднее:** " + m0 + ". **Мода:** " + md + ". Правый хвост убывает полиномиально, распределение несимметрично.\n\n";
  info = info + "**Обратная величина:** если X ~ F(d₁; d₂), то 1/X ~ F(d₂; d₁) (жёлтая кривая). При x = **" + format(xv, 2) + "**: плотность F(d₁; d₂) в x равна **" + format(fa, 4) + "**, а плотность F(d₂; d₁) в точке 1/x, делённая на x², — **" + format(fb, 4) + "**: одно и то же число.";
}
]
