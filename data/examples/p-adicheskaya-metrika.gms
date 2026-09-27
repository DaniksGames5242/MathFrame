[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Дерево остатков: на уровне ℓ — остатки по модулю p^ℓ, у каждого p потомков.
// Внизу — числа 0 … p^D − 1. Два числа тем ближе p-адически, чем глубже их общий предок. ----
draw Graph { name = "gEdge"; graph = "ge"; edgeColor = #6b7280; edgeWidth = 1.2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gPath"; graph = "gp"; edgeColor = #f59e0b; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "gNode"; graph = "gn"; nodeColor = #6b7280; nodeRadius = 12; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gMeet"; graph = "gm"; nodeColor = #f59e0b; nodeRadius = 14; interactive = false; showWeights = false; layer = 22 }
draw Graph { name = "gX"; graph = "gx"; nodeColor = #3b82f6; nodeRadius = 14; interactive = false; showWeights = false; layer = 24 }
draw Graph { name = "gY"; graph = "gy"; nodeColor = #22c55e; nodeRadius = 14; interactive = false; showWeights = false; layer = 24 }
draw Text { name = "lvl0"; pos = (-7.4, 3.9); text = "mod 1"; size = 0.9 }
draw Text { name = "lvl1"; pos = (-7.4, ly(1)); text = "mod " + format(p, 0); size = 0.9 }
draw Text { name = "lvl2"; pos = (-7.4, ly(2)); text = "mod " + format(p * p, 0); size = 0.9 }
draw Text { name = "lvl3"; pos = (-7.4, ly(3)); text = "mod " + format(p ^ 3, 0); size = 0.9; active = D >= 3 }
draw Text { name = "lvl4"; pos = (-7.4, ly(4)); text = "mod " + format(p ^ 4, 0); size = 0.9; active = D >= 4 }

new UI { name = "sP"; type = select; label = "p"; variable = p; options = (2, 3, 5); default = 3 }
new UI { name = "sX"; type = slider; label = "x"; variable = x; min = 0; max = N - 1; step = 1; default = 5 }
new UI { name = "sY"; type = slider; label = "y"; variable = y; min = 0; max = N - 1; step = 1; default = 23 }

// ---- Логика ----
float p = 3;
float D = 3;
float N = 27;
float x = 5; float y = 23;
float lastKey = -1;
float k = 0;
string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
Function ly(l) { return 3.9 - l * 7.4 / D; }
// Цифры a (ℓ младших разрядов по основанию p) в обратном порядке — номер поддерева
Function rev(a, l) { float r = 0; float b = a; repeat (l) { r = r * p + md(b, p); b = floor(b / p); } return r; }
Function lx(a, l) { float w = p ^ (D - l); return -6.4 + 13.6 * ((rev(a, l) + 0.5) * w - 0.5) / (N - 1); }
Function key(a, l) { return format(l, 0) + ":" + format(a, 0); }
// Запись числа по основанию p (D разрядов)
Function digits(a) { string s = ""; float b = a; repeat (D) { s = format(md(b, p), 0) + s; b = floor(b / p); } return s; }
// p-адическая оценка: наибольшее k ≤ D, при котором p^k делит a
Function val(a) { float v = 0; repeat (D) { if (a != 0 && md(a, p ^ (v + 1)) == 0) { v = v + 1; } } if (a == 0) { return D; } return v; }
Function sup(e) { if (e == 0) { return "⁰"; } if (e == 1) { return "¹"; } if (e == 2) { return "²"; } if (e == 3) { return "³"; } if (e == 4) { return "⁴"; } return "⁵"; }
Function sb() { if (p == 2) { return "₂"; } if (p == 3) { return "₃"; } return "₅"; }
Function sgnum(v) { if (v < 0) { return "−" + format(abs(v), 0); } return format(v, 0); }
Function dist(a, b) { if (a == b) { return "0"; } float v = val(abs(a - b)); if (v == 0) { return "1"; } return "1/" + format(p ^ v, 0); }
Function distNum(a, b) { if (a == b) { return 0; } return p ^ (-val(abs(a - b))); }

Update {
  if (p == 2) { D = 4; } if (p == 3) { D = 3; } if (p == 5) { D = 2; }
  N = p ^ D;
  x = min(x, N - 1); y = min(y, N - 1);
  if (p * 10000 + x * 100 + y != lastKey) {
    ge = newGraph(); gn = newGraph(); gp = newGraph(); gm = newGraph(); gx = newGraph(); gy = newGraph();
    repeat (D + 1) {
      float l = i;
      repeat (p ^ l) {
        float a = i;
        addNode(ge, key(a, l), [lx(a, l), ly(l)]); addNode(gp, key(a, l), [lx(a, l), ly(l)]);
        addNode(gn, key(a, l), [lx(a, l), ly(l)], format(a, 0));
        if (l > 0) { addEdge(ge, key(md(a, p ^ (l - 1)), l - 1), key(a, l)); }
      }
    }
    // Пути от корня к x и к y; общий предок — остаток по модулю p^k, k = v_p(x − y)
    k = val(abs(x - y)); if (x == y) { k = D; }
    repeat (D) {
      float l = i + 1;
      addEdge(gp, key(md(x, p ^ (l - 1)), l - 1), key(md(x, p ^ l), l));
      if (l > k) { addEdge(gp, key(md(y, p ^ (l - 1)), l - 1), key(md(y, p ^ l), l)); }
    }
    addNode(gm, format(md(x, p ^ k), 0), [lx(md(x, p ^ k), k), ly(k)]);
    addNode(gx, format(x, 0), [lx(x, D), ly(D)]);
    addNode(gy, format(y, 0), [lx(y, D), ly(D)]);
    lastKey = p * 10000 + x * 100 + y;
  }
  info = "**p-адическая метрика:** d(x, y) = |x − y|ₚ = p⁻ᵏ, где pᵏ — наибольшая степень p, делящая x − y. Числа тем ближе, чем больше у них общих **младших** цифр в записи по основанию p — на дереве остатков это глубина их общего предка (оранжевый).\n\np = " + format(p, 0) + ":   x = " + format(x, 0) + " = " + digits(x) + sb() + ",   y = " + format(y, 0) + " = " + digits(y) + sb() + ";   x − y = " + sgnum(x - y);
  if (x == y) { info = info + ", d(x, y) = 0."; }
  else { if (k == 0) { info = info + " не делится на " + format(p, 0) + ", поэтому d(x, y) = 1."; } else { info = info + " делится на " + format(p, 0) + sup(k) + " и не делится на " + format(p, 0) + sup(k + 1) + ", поэтому d(x, y) = " + dist(x, y) + "."; } }
  info = info + "\n\nСильное неравенство треугольника d(x, z) ≤ max(d(x, y), d(y, z)): у любых трёх чисел два наибольших расстояния равны — все треугольники равнобедренные. Например, для z = 0: d(x, 0) = " + dist(x, 0) + ", d(y, 0) = " + dist(y, 0) + ", d(x, y) = " + dist(x, y) + ".";
}
]
