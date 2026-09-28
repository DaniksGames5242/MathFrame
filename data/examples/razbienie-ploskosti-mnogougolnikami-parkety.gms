[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Суть любого паркета: в каждой вершине углы плиток должны в сумме дать полный угол
// 360°. Собираем конфигурацию вершины из до пяти правильных k-угольников ползунками
// (0 — плитка отсутствует); плитки — правильные n-угольники со стороной 1,8 с общей вершиной V, и
// сумма углов сравнивается с 360°. При точном совпадении — плитки уложены без просвета
// и без наложения, паркет возможен. ----
new Point { name = "V"; pos = (0, 0); text = true("V"); dynamic = false; collision = false }
draw Graph { name = "tiles"; graph = "g"; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
draw Text { name = "sumTxt"; pos = (0, -4.6); text = "Σ = " + format(sumAng, 1) + "° из 360°"; size = 1.05; color = tcol }

new UI { name = "s1"; type = slider; label = "n₁"; variable = k1; min = 0; max = 12; step = 1; default = 3 }
new UI { name = "s2"; type = slider; label = "n₂"; variable = k2; min = 0; max = 12; step = 1; default = 3 }
new UI { name = "s3"; type = slider; label = "n₃"; variable = k3; min = 0; max = 12; step = 1; default = 3 }
new UI { name = "s4"; type = slider; label = "n₄"; variable = k4; min = 0; max = 12; step = 1; default = 3 }
new UI { name = "s5"; type = slider; label = "n₅"; variable = k5; min = 0; max = 12; step = 1; default = 3 }

// ---- Логика: n = 0 означает «плитки нет» — соответствующий сектор пропускается. ----
float k1 = 3; float k2 = 3; float k3 = 3; float k4 = 3; float k5 = 3;
float sumAng = 0;
string tcol = "";
string info = "";
float key = -1;

Function interior(n) { if (n < 3) { return 0; } return (n - 2) * 180 / n; }

Update {
  if (key != k1 * 1e8 + k2 * 1e6 + k3 * 1e4 + k4 * 1e2 + k5) {
    g = newGraph();
    float start = 90;
    float a1 = interior(k1); float a2 = interior(k2); float a3 = interior(k3); float a4 = interior(k4); float a5 = interior(k5);
    float cur = start;
    repeat (5) {
      float kk = k1; float aa = a1;
      if (i == 1) { kk = k2; aa = a2; }
      if (i == 2) { kk = k3; aa = a3; }
      if (i == 3) { kk = k4; aa = a4; }
      if (i == 4) { kk = k5; aa = a5; }
      if (kk >= 3) {
        float rr = 1.8 / (2 * sin(3.14159265358979 / kk));
        float bis = (cur + aa / 2) * 0.0174532925;
        float ocx = rr * cos(bis); float ocy = rr * sin(bis);
        float a0 = atan2(0 - ocy, 0 - ocx);
        string tag = "t" + format(i, 0);
        repeat (12) {
          if (i < kk) {
            float ai = a0 + 2 * 3.14159265358979 * i / kk;
            addNode(g, tag + "_" + format(i, 0), [ocx + rr * cos(ai), ocy + rr * sin(ai)]);
          }
        }
        repeat (12) {
          if (i < kk) {
            float jj = i + 1; if (jj >= kk) { jj = 0; }
            addEdge(g, tag + "_" + format(i, 0), tag + "_" + format(jj, 0));
          }
        }
        cur = cur + aa;
      }
    }
    key = k1 * 1e8 + k2 * 1e6 + k3 * 1e4 + k4 * 1e2 + k5;
  }
  sumAng = interior(k1) + interior(k2) + interior(k3) + interior(k4) + interior(k5);
  string cfg = "";
  if (k1 >= 3) { cfg = format(k1, 0); }
  if (k2 >= 3) { if (cfg != "") { cfg = cfg + "."; } cfg = cfg + format(k2, 0); }
  if (k3 >= 3) { if (cfg != "") { cfg = cfg + "."; } cfg = cfg + format(k3, 0); }
  if (k4 >= 3) { if (cfg != "") { cfg = cfg + "."; } cfg = cfg + format(k4, 0); }
  if (k5 >= 3) { if (cfg != "") { cfg = cfg + "."; } cfg = cfg + format(k5, 0); }

  info = "**Угловое условие паркета:** в каждой вершине суммы внутренних углов сходящихся плиток должны давать ровно 360°. Конфигурация вершины [" + cfg + "]: сумма углов = " + format(sumAng, 1) + "°.\n\n";
  if (abs(sumAng - 360) < 0.05) { tcol = "#22c55e"; info = info + "**Сумма равна 360°** — плитки укладываются вокруг вершины без просвета и без наложения, такая конфигурация паркета возможна."; }
  else if (sumAng < 360) { tcol = "#3b82f6"; info = info + "**Сумма меньше 360°** — между плитками остаётся просвет (" + format(360 - sumAng, 1) + "°), паркет с такой конфигурацией невозможен."; }
  else { tcol = "#f59e0b"; info = info + "**Сумма больше 360°** — плитки накладываются друг на друга (на " + format(sumAng - 360, 1) + "°), паркет с такой конфигурацией невозможен."; }
}
]
