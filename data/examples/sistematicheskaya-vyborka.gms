[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- 60 упорядоченных единиц (высота столбика — значение признака); синие — отобраны: r, r + k, r + 2k, …
// Внизу — средние всех k возможных выборок (по одной на каждый старт r) вокруг среднего совокупности (оранжевая линия). ----
draw Graph { name = "gU"; graph = "gu"; edgeColor = #3b82f688; edgeWidth = 8; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gSel"; graph = "gsel"; edgeColor = #3b82f6; edgeWidth = 8; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gSt"; graph = "gst"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gE"; graph = "ge"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gCur"; graph = "gcur"; nodeColor = #f59e0b; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 7 }
draw Graph { name = "gMu"; graph = "gmu"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f655; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "t1"; pos = (-9.5, 5.6); text = "единицы совокупности по порядку"; size = 0.85; align = left }
draw Text { name = "t2"; pos = (-9.5, -2.7); text = "средние всех возможных систематических выборок"; size = 0.85; align = left }

new UI { name = "sN"; type = slider; label = "объём n"; variable = n; min = 4; max = 30; step = 1; default = 10 }
new UI { name = "sR"; type = slider; label = "старт r"; variable = r; min = 1; max = k; step = 1; default = 2 }
new UI { name = "sP"; type = slider; label = "период в данных"; variable = per; min = 1; max = 12; step = 1; default = 5 }

float n = 10; float r = 2; float per = 5; float k = 6;
float key = -1; string info = "";
float mu = 0; float xs = 0; float cnt = 0; float spread = 0;

Function val(j) { return 4 + 0.03 * j + 2 * sin(6.2832 * j / per); }
Function px(j) { return -9.2 + 0.31 * (j - 1); }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
// среднее выборки со стартом s (единицы s, s + k, … не дальше 60)
Function smean(s) {
  float sum = 0; float c = 0;
  repeat (30) { float j = s + i * k; if (j <= 60) { sum = sum + val(j); c = c + 1; } }
  return sum / c;
}
Function ex(v) { return max(-9.3, min(9.3, (v - mu) * 6)); }

Update {
  k = max(1, round(60 / n));
  if (r > k) { r = k; }
  if (key != (n * 100 + r) * 100 + per) {
    gu = newGraph(); gsel = newGraph(); gst = newGraph(); ge = newGraph(); gcur = newGraph(); gmu = newGraph(); gx = newGraph();
    mu = 0; repeat (60) { mu = mu + val(i + 1) / 60; addNode(gu, "a" + format(i, 0), [px(i + 1), -2]); addNode(gu, "b" + format(i, 0), [px(i + 1), -2 + 0.75 * val(i + 1)]); addEdge(gu, "a" + format(i, 0), "b" + format(i, 0)); }
    cnt = 0;
    repeat (30) {
      float j = r + i * k;
      if (j <= 60) {
        cnt = cnt + 1;
        addNode(gsel, "a" + format(i, 0), [px(j), -2]); addNode(gsel, "b" + format(i, 0), [px(j), -2 + 0.75 * val(j)]); addEdge(gsel, "a" + format(i, 0), "b" + format(i, 0));
        addNode(gst, "s" + format(i, 0), [px(j), -2.5]);
      }
    }
    xs = smean(r);
    float lo = 100; float hi = -100;
    repeat (k) {
      float m = smean(i + 1); lo = min(lo, m); hi = max(hi, m);
      float ys = -4.1 - 0.3 * (i - 2 * floor(i / 2));
      if (i + 1 == r) { addNode(gcur, "e" + format(i, 0), [ex(m), ys]); }
      if (i + 1 != r) { addNode(ge, "e" + format(i, 0), [ex(m), ys]); }
    }
    spread = hi - lo;
    addNode(gmu, "m1", [0, -3.2]); addNode(gmu, "m2", [0, -5.0]); addEdge(gmu, "m1", "m2");
    addNode(gx, "x1", [-9.5, -2]); addNode(gx, "x2", [9.5, -2]); addEdge(gx, "x1", "x2");
    key = (n * 100 + r) * 100 + per;
  }
  info = "**Систематическая выборка:** из N = 60 упорядоченных единиц при объёме n = " + format(n, 0) + " шаг отбора k = [N/n] = **" + format(k, 0) + "**. Случайный старт r ∈ {1, …, " + format(k, 0) + "}, затем берётся каждая k-я единица: x_i = x_(r + (i − 1)k). При r = " + format(r, 0) + " отобрано " + format(cnt, 0) + " единиц.\n\n";
  info = info + "Среднее выборки x̄ = **" + num(xs, 2) + "**, среднее совокупности μ = " + num(mu, 2) + ". Всего возможно лишь k = " + format(k, 0) + " различных выборок, а средние по ним отличаются не более чем на " + num(spread, 2) + ".";
  if (per > 1) { if (abs(k / per - round(k / per)) < 0.01) { info = info + " В данных есть период " + format(per, 0) + ", на который делится шаг k: все отобранные единицы лежат в одной и той же фазе периода, поэтому средние выборок сильно расходятся и оценка смещена."; } }
  if (per > 1) { if (abs(k / per - round(k / per)) >= 0.01) { info = info + " Шаг k не делится на период " + format(per, 0) + ", и выборка охватывает разные фазы периода."; } }
}
]
