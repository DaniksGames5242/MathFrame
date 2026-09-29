[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Вверху — числовая прямая 0…16 с точками всех представимых положительных чисел ±1,f × 2ᵉ (порядки
// e = −2…3 чередуют синий и оранжевый цвет). Внизу — столбики шага 2ᵉ⁻ᵖ до следующего числа. Точка x
// перетаскивается; зелёная — ближайшее к ней представимое число. ----
new Point { name = "L"; pos = (-7.2, 3.2); dynamic = false; collision = false; active = false }
new Point { name = "R"; pos = (7.2, 3.2); dynamic = false; collision = false; active = false }
new Line { name = "ax"; pos = (L, R); thickness = 1.5; interact = false }
draw Graph { name = "gB0"; graph = "gb0"; edgeWidth = 7; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gB1"; graph = "gb1"; edgeWidth = 7; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gD0"; graph = "gd0"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gD1"; graph = "gd1"; nodeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gBase"; graph = "gbs"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
new Point { name = "Y"; pos = (0, 3.2); dynamic = false; collision = false; collideWithPoints = false; size = 0.7; color = #22c55e; layer = 40 }
new Point { name = "X"; line = "ax"; t = 0.33; pauseOnDrag = false; collideWithPoints = false; layer = 50 }
draw Text { name = "tx"; pos = (X.pos.x, 3.8); text = "x"; size = 1 }
draw Text { name = "ty"; pos = (Y.pos.x, 2.5); text = "fl(x)"; size = 0.85; color = #22c55e }
draw Text { name = "t0"; pos = (-7.2, 2.5); text = "0"; size = 0.85; color = #3b82f6 }
draw Text { name = "t4"; pos = (-3.6, 2.5); text = "4"; size = 0.85; color = #3b82f6 }
draw Text { name = "t8"; pos = (0, 2.5); text = "8"; size = 0.85; color = #3b82f6 }
draw Text { name = "t12"; pos = (3.6, 2.5); text = "12"; size = 0.85; color = #3b82f6 }
draw Text { name = "t16"; pos = (7.2, 2.5); text = "16"; size = 0.85; color = #3b82f6 }
draw Text { name = "ts"; pos = (-7.6, -1.3); text = "шаг до следующего числа"; size = 0.85; color = #3b82f6; align = left }

new UI { name = "sP"; type = slider; label = "бит мантиссы p"; variable = p; min = 1; max = 4; step = 1; default = 3 }

// ---- Логика ----
float p = 3; float key = -1; string info = "";

Function sx(v) { return 0.9 * v - 7.2; }
Function sup(k) {
  string s = ""; if (k < 0) { s = "⁻"; } float a = round(abs(k));
  if (a == 0) { return s + "⁰"; } if (a == 1) { return s + "¹"; } if (a == 2) { return s + "²"; } if (a == 3) { return s + "³"; }
  if (a == 4) { return s + "⁴"; } if (a == 5) { return s + "⁵"; } if (a == 6) { return s + "⁶"; } return s + "⁷";
}
Function bin(m) {
  string s = "";
  repeat (p) { float k = p - 1 - i; s = s + format(floor(m / pow(2, k)) - 2 * floor(m / pow(2, k + 1)), 0); }
  return s;
}

Update {
  if (key != p) {
    key = p;
    gb0 = newGraph(); gb1 = newGraph(); gd0 = newGraph(); gd1 = newGraph(); gbs = newGraph();
    addNode(gbs, "a", [-7.2, -4]); addNode(gbs, "b", [7.2, -4]); addEdge(gbs, "a", "b");
    addNode(gd0, "zero", [sx(0), 3.2]);
    repeat (6) {
      float e = i - 2; float q = pow(2, p);
      repeat (q) {
        float v = (1 + i / q) * pow(2, e);
        string k = format(e, 0) + "_" + format(i, 0);
        float h = 1.5 * pow(2, e - p);
        if (e - 2 * floor(e / 2) == 0) {
          addNode(gd0, k, [sx(v), 3.2]); addNode(gb0, k + "a", [sx(v), -4]); addNode(gb0, k + "b", [sx(v), -4 + h]); addEdge(gb0, k + "a", k + "b", 1, "#3b82f6");
        } else {
          addNode(gd1, k, [sx(v), 3.2]); addNode(gb1, k + "a", [sx(v), -4]); addNode(gb1, k + "b", [sx(v), -4 + h]); addEdge(gb1, k + "a", k + "b", 1, "#f59e0b");
        }
      }
    }
  }
  float v = 16 * X.t;
  float e = floor(log2(max(v, 0.0001))); if (e > 3) { e = 3; }
  float st = pow(2, e - p); float f = 0; float ov = 0; float un = 0;
  if (v < 0.25) { un = 1; f = 0; if (v > 0.125) { f = 0.25; } }
  else { f = round(v / st) * st; if (f > 16 - pow(2, 3 - p)) { ov = 1; f = 16 - pow(2, 3 - p); } }
  if (Y.pos.x != sx(f)) { Y.pos.x = sx(f); Y.pos.y = 3.2; }
  float fe = floor(log2(max(f, 0.0001)));
  float mm = round((f / pow(2, fe) - 1) * pow(2, p));
  info = "**Число с плавающей точкой** записывается в нормализованном виде 1,f × 2ᵉ: мантисса 1,f с p = " + format(p, 0) + " битами дроби и порядок e = −2…3 (у нуля отдельный код). Положительных чисел всего 6 · 2ᵖ = " + format(6 * pow(2, p), 0) + ".\n\n";
  if (ov > 0.5) { info = info + "**x = " + format(v, 3) + "** больше наибольшего представимого числа " + format(16 - pow(2, 3 - p), 3) + " — переполнение (в реальном формате получилась бы ∞)."; }
  else if (un > 0.5) { info = info + "**x = " + format(v, 3) + "** меньше наименьшего нормализованного числа 2⁻² = 0.25 — округляется до " + format(f, 2) + " (потеря значимости)."; }
  else { info = info + "**x = " + format(v, 3) + "** лежит в [2" + sup(e) + "; 2" + sup(e + 1) + ") — шаг здесь 2" + sup(e - p) + " = " + format(st, 4) + ". Ближайшее представимое число fl(x) = 1," + bin(mm) + "₂ × 2" + sup(fe) + " = **" + format(f, 4) + "**. Абсолютная погрешность " + format(abs(f - v), 4) + " ≤ шаг/2 = " + format(st / 2, 4) + ", относительная " + format(100 * abs(f - v) / v, 2) + " % ≤ 2" + sup(-p - 1) + " = " + format(100 / pow(2, p + 1), 2) + " %."; }
  info = info + "\n\nШаг удваивается с каждым порядком: у нуля числа расположены густо, вдали от нуля — редко.";
}
]
