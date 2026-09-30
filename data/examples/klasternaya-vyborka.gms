[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Совокупность из 80 единиц в 10 группах (кластерах) по 8; в выборку попадают целые кластеры (синие рамки).
// Внизу — оценки среднего на 30 выборках: простой случайной того же объёма (сверху) и кластерной (снизу). ----
draw Graph { name = "gU"; graph = "gu"; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gSel"; graph = "gsel"; nodeColor = #3b82f6; nodeRadius = 7; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gBx"; graph = "gbx"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gBs"; graph = "gbs"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #3b82f6; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #22c55e; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gMu"; graph = "gmu"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Text { name = "t4"; pos = (-9.5, -0.6); text = "простая случайная выборка"; size = 0.85; align = left }
draw Text { name = "t5"; pos = (-9.5, -3.0); text = "кластерная выборка"; size = 0.85; align = left }

new UI { name = "sM"; type = slider; label = "кластеров m"; variable = m; min = 1; max = 9; step = 1; default = 3 }
new UI { name = "sR"; type = slider; label = "сходство внутри групп"; variable = rho; min = 0; max = 0.9; step = 0.05; default = 0.5 }
new UI { name = "sS"; type = slider; label = "выборка №"; variable = sd; min = 1; max = 30; step = 1; default = 1 }

float m = 3; float rho = 0.5; float sd = 1; float key = -1; string info = "";
list perm = [0];
float mu = 0; float xc = 0; float vc = 0; float vr = 0;

Function rnd(k) { float s = sin(k * 12.9898 + 78.233) * 43758.5453; return s - floor(s); }
Function u(k) { return 2.45 * (rnd(k) + rnd(k + 0.5) - 1); }
Function val(j) { return 5 + 2.2 * (sqrt(rho) * u(floor(j / 8) + 8000) + sqrt(1 - rho) * u(j + 9000)); }
Function bx(c) { return -7.2 + 3.4 * (c - 5 * floor(c / 5)); }
Function by(c) { return 4.4 - 2.3 * floor(c / 5); }
Function cx(j) { float l = j - 8 * floor(j / 8); return bx(floor(j / 8)) + 0.7 * (l - 4 * floor(l / 4)); }
Function cy(j) { float l = j - 8 * floor(j / 8); return by(floor(j / 8)) - 0.7 * floor(l / 4); }
Function shuf(s, size, k) {
  repeat (size) { perm[i] = i; }
  repeat (k) { float j = i + floor(rnd(s * 131 + i) * (size - i)); float t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
}
// среднее по m целым кластерам
Function cmean(s) {
  shuf(s, 10, m); float sum = 0;
  repeat (m) { float c = perm[i]; repeat (8) { sum = sum + val(c * 8 + i); } }
  return sum / (8 * m);
}
Function rmean(s) {
  shuf(s, 80, 8 * m); float sum = 0;
  repeat (8 * m) { sum = sum + val(perm[i]); }
  return sum / (8 * m);
}
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function ex(v) { return max(-9.3, min(9.3, (v - mu) * 3)); }

Update {
  if (key == -1) { repeat (79) { push(perm, 0); } }
  if (key != (m * 100 + rho * 20) * 100 + sd) {
    gu = newGraph(); gsel = newGraph(); gbx = newGraph(); gbs = newGraph(); ga = newGraph(); gb = newGraph(); gmu = newGraph();
    mu = 0; repeat (80) { mu = mu + val(i) / 80; addNode(gu, "u" + format(i, 0), [cx(i), cy(i)]); }
    // рамки кластеров
    repeat (10) {
      addNode(gbx, "p" + format(i, 0), [bx(i) - 0.4, by(i) + 0.4]); addNode(gbx, "q" + format(i, 0), [bx(i) + 2.5, by(i) + 0.4]);
      addNode(gbx, "r" + format(i, 0), [bx(i) + 2.5, by(i) - 1.1]); addNode(gbx, "s" + format(i, 0), [bx(i) - 0.4, by(i) - 1.1]);
      addEdge(gbx, "p" + format(i, 0), "q" + format(i, 0)); addEdge(gbx, "q" + format(i, 0), "r" + format(i, 0));
      addEdge(gbx, "r" + format(i, 0), "s" + format(i, 0)); addEdge(gbx, "s" + format(i, 0), "p" + format(i, 0));
    }
    shuf(sd, 10, m); xc = 0;
    repeat (m) {
      float c = perm[i];
      addNode(gbs, "p" + format(c, 0), [bx(c) - 0.4, by(c) + 0.4]); addNode(gbs, "q" + format(c, 0), [bx(c) + 2.5, by(c) + 0.4]);
      addNode(gbs, "r" + format(c, 0), [bx(c) + 2.5, by(c) - 1.1]); addNode(gbs, "s" + format(c, 0), [bx(c) - 0.4, by(c) - 1.1]);
      addEdge(gbs, "p" + format(c, 0), "q" + format(c, 0)); addEdge(gbs, "q" + format(c, 0), "r" + format(c, 0));
      addEdge(gbs, "r" + format(c, 0), "s" + format(c, 0)); addEdge(gbs, "s" + format(c, 0), "p" + format(c, 0));
      repeat (8) { addNode(gsel, "s" + format(c * 8 + i, 0), [cx(c * 8 + i), cy(c * 8 + i)]); xc = xc + val(c * 8 + i); }
    }
    xc = xc / (8 * m);
    // дисперсии оценок: по данным совокупности
    float s2 = 0; repeat (80) { s2 = s2 + (val(i) - mu) * (val(i) - mu) / 79; }
    float q = 0;
    repeat (10) { float h = i; float cm = 0; repeat (8) { cm = cm + val(h * 8 + i) / 8; } q = q + (cm - mu) * (cm - mu) / 9; }
    vc = (1 - m / 10) * q / m;
    vr = (1 - 8 * m / 80) * s2 / (8 * m);
    repeat (30) {
      float ya = -1.5 - 0.3 * (i - 3 * floor(i / 3)); float yb = -3.9 - 0.3 * (i - 3 * floor(i / 3));
      addNode(ga, "a" + format(i, 0), [ex(rmean(i + 501)), ya]); addNode(gb, "b" + format(i, 0), [ex(cmean(i + 1)), yb]);
    }
    addNode(gmu, "m1", [0, -0.9]); addNode(gmu, "m2", [0, -4.9]); addEdge(gmu, "m1", "m2");
    key = (m * 100 + rho * 20) * 100 + sd;
  }
  info = "**Кластерная выборка:** совокупность из 80 единиц заранее разбита на 10 групп по 8, случайно отбираются m = " + format(m, 0) + " групп и обследуются **целиком** (n = " + format(8 * m, 0) + " единиц). Каждая единица принадлежит ровно одной группе.\n\n";
  info = info + "Среднее совокупности μ = " + num(mu, 2) + " (оранжевая линия), оценка по выборке №" + format(sd, 0) + ": x̄ = **" + num(xc, 2) + "**.\n\n";
  info = info + "Стандартная ошибка кластерной оценки **" + num(sqrt(vc), 2) + "**, простой случайной выборки того же объёма — " + num(sqrt(vr), 2) + ". Чем более похожи единицы внутри группы (сходство " + format(rho, 2) + "), тем больше кластерная ошибка: единицы одной группы почти дублируют друг друга.";
}
]
