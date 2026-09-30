[
description = "{info}"

field width = 8;
field height = 6;
camera type = fixed;

// ---- График aᵗ (a > 0). Точка Q — показатель x. Зелёные точки — рациональные приближения rₖ = x,
// обрезанного до k десятичных знаков: степени aʳᵏ сходятся к aˣ. ----
float a = 2; float d = 2; float y = 1; float key = -1; string info = "";
Function pw(t) { return exp(t * log(a)); }
draw Function { name = "gr"; f = "pw"; xmin = -4; xmax = 4; grid = true; color = #3b82f6; thickness = 3 }
draw Graph { name = "gApp"; graph = "gapp"; nodeColor = #22c55e; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 8 }
new Point { name = "Q"; pos = (1.4142, 2.6651); pauseOnDrag = false; text = true("x") }
new UI { type = slider; label = "основание a"; variable = a; min = 0.3; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "знаков"; variable = d; min = 0; max = 4; step = 1; default = 2 }
new UI { type = slider; label = "показатель y"; variable = y; min = -2; max = 2; step = 0.1; default = 1 }

Function num(x, k) { if (abs(x) < 0.5 * pow(10, -k)) { return format(0, k); } if (x < 0) { return "−" + format(-x, k); } return format(x, k); }
Function tr(x, k) { float s = pow(10, k); if (x < 0) { return -floor(-x * s) / s; } return floor(x * s) / s; }

Update {
  if (abs(Q.pos.x) > 3.85) { Q.pos.x = 3.85 * sign(Q.pos.x); }
  float x = Q.pos.x;
  if (abs(Q.pos.y - pw(x)) > 0.0001) { Q.pos.y = pw(x); }
  float kk = x * 1000 + a * 7 + d;
  if (key != kk) {
    gapp = newGraph();
    repeat (d + 1) { addNode(gapp, "r" + format(i, 0), [tr(x, i), pw(tr(x, i))]); }
    key = kk;
  }
  float r = tr(x, d);
  info = "**Степень с действительным показателем:** при a > 0 значение aˣ — предел aʳⁿ, где rₙ — рациональные числа, rₙ → x. Здесь a = " + format(a, 1) + ", x = " + num(x, 4) + ", и aˣ = " + num(pw(x), 5) + ".\n\n";
  string t = "";
  repeat (d + 1) { float k = i; t = t + "r" + format(k, 0) + " = " + num(tr(x, k), k) + ", aʳ = " + num(pw(tr(x, k)), 5) + "; "; }
  info = info + "**Приближения (обрезание до k знаков):** " + t + "погрешность |aˣ − aʳ| = " + num(abs(pw(x) - pw(r)), 5) + " убывает с ростом k.\n\n";
  info = info + "**Свойства:** aˣ·aʸ = aˣ⁺ʸ: " + num(pw(x), 4) + " · " + num(pw(y), 4) + " = " + num(pw(x + y), 4) + "; (aˣ)ʸ = aˣʸ: " + num(pow(pw(x), y), 4) + " = " + num(pw(x * y), 4) + ".";
}
]
