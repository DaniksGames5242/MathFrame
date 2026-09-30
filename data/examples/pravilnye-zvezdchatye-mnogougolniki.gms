[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Правильный звёздчатый многоугольник {n/k}: n вершин на окружности с центром O, стороны
// соединяют вершины через k − 1. Вершину V0 можно перетаскивать: она задаёт радиус R и поворот. ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "V0"; pos = (0, 5); text = true("V₀") }
new Circle { name = "cc"; center = O; radius = rr; thickness = 1 }
draw Graph { name = "gStar"; graph = "gst"; edgeWidth = 3; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gSide"; graph = "gsd"; edgeWidth = 5; edgeColor = #3b82f6; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }

new UI { name = "sN"; type = select; label = "n"; variable = nsel; options = ("5", "7", "8", "9", "10", "11", "12", "13"); default = "7" }
new UI { name = "sK"; type = slider; label = "номер шага k"; variable = jk; min = 1; max = cnt; step = 1; default = 1 }

string nsel = "7"; float n = 7; float jk = 1; float cnt = 2; float k = 2;
float rr = 5; float keyc = -1;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function gcd(a, b) { repeat (30) { if (b > 0) { float r = a - floor(a / b) * b; a = b; b = r; } } return a; }
// Число допустимых шагов k (1 < k < n/2, gcd(n, k) = 1) и j-й из них.
Function cntK(nn) {
  float c = 0;
  repeat (8) { float kk = i + 2; if (kk * 2 < nn) { if (gcd(nn, kk) == 1) { c = c + 1; } } }
  return c;
}
Function kth(nn, j) {
  float c = 0; float res = 2;
  repeat (8) { float kk = i + 2; if (kk * 2 < nn) { if (gcd(nn, kk) == 1) { c = c + 1; if (c == j) { res = kk; } } } }
  return res;
}

Update {
  if (nsel == "5") { n = 5; } if (nsel == "7") { n = 7; } if (nsel == "8") { n = 8; } if (nsel == "9") { n = 9; }
  if (nsel == "10") { n = 10; } if (nsel == "11") { n = 11; } if (nsel == "12") { n = 12; } if (nsel == "13") { n = 13; }
  cnt = cntK(n);
  if (jk > cnt) { jk = cnt; }
  k = kth(n, jk);
  // Радиус R = |OV₀| держим в пределах поля; вне — вершину возвращаем на ближайшую допустимую окружность.
  float vx = V0.pos.x; float vy = V0.pos.y;
  float r0 = sqrt(vx * vx + vy * vy);
  float rmax = min(fieldMaxY, fieldMaxX) - 0.2;
  if (r0 < 2 || r0 > rmax) {
    float r1 = max(2, min(rmax, r0));
    if (r0 < 0.000001) { vx = 0; vy = r1; } else { vx = vx * r1 / r0; vy = vy * r1 / r0; }
    V0.pos.x = vx; V0.pos.y = vy; r0 = r1;
  }
  rr = r0;
  float phi = atan2(vy, vx);
  float kn = vx * 3 + vy * 7 + n * 11 + k * 13;
  if (abs(kn - keyc) > 0.000001) {
    gst = newGraph();
    repeat (n) { addNode(gst, "v" + i, [rr * cos(phi + 2 * pi * i / n), rr * sin(phi + 2 * pi * i / n)]); }
    repeat (n) { float j = i + k; if (j > n - 1) { j = j - n; } addEdge(gst, "v" + i, "v" + j); }
    gsd = newGraph();
    addNode(gsd, "a", [vx, vy]);
    addNode(gsd, "b", [rr * cos(phi + 2 * pi * k / n), rr * sin(phi + 2 * pi * k / n)]);
    addEdge(gsd, "a", "b");
    keyc = kn;
  }
  float cen = 360 * k / n;
  float side = 2 * rr * sin(pi * k / n);
  float angV = 180 * (n - 2 * k) / n;
  info = "**Звёздчатый многоугольник {" + format(n, 0) + "/" + format(k, 0) + "}:** " + format(n, 0) + " вершин правильного " + format(n, 0) + "-угольника, вершина i соединена с вершиной i + " + format(k, 0) + " (k взаимно просто с n, 1 < k < n/2). Ломаная замыкается за один обход.\n\n**Центральный угол стороны** 2πk/n = " + format(cen, 1) + "°; **угол при вершине** π(n − 2k)/n = " + format(angV, 1) + "°.\n\n**Длина стороны** 2R·sin(πk/n) = " + format(side, 2) + " при R = " + format(rr, 2) + ". Сторон, пересекающих данную: 2(k − 1) = " + format(2 * (k - 1), 0) + ", пар пересекающихся сторон: n(k − 1) = " + format(n * (k - 1), 0) + ".";
}
]
