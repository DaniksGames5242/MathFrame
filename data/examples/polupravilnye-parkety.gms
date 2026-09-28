[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Одна вершина полуправильного паркета и все сходящиеся в ней правильные многоугольники
// (её окрестность — этого достаточно, чтобы видеть само чередование, задающее весь паркет).
// Конфигурация выбирается из восьми известных; точка A, перетаскиваемая по окружности,
// поворачивает всю картинку — все грани остаются той же формы, меняется лишь ориентация. ----
new Point { name = "V"; pos = (0, 0); text = true("V"); dynamic = false; collision = false }
new Circle { name = "w"; center = "V"; radius = 1.4; color = "transparent" }
new Point { name = "A"; circle = "w"; t = 0 }
draw Graph { name = "mesh"; graph = "g"; nodeRadius = 0; labels = false; interactive = false; showWeights = false }

new UI { name = "sC"; type = select; label = "конфигурация"; variable = cfg; options = ("c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7"); labels = ("3.12.12", "4.8.8", "3.6.3.6", "3.4.6.4", "3.3.3.3.6", "3.3.3.4.4", "3.3.3.3.3.4", "3.4.3.4"); default = "c2" }

// ---- Логика ----
string cfg = "c2";
float a = 1.8;
float key = -1;
string info = "";

Function nAt(idx) {
  if (cfg == "c0") { if (idx == 0) { return 3; } if (idx == 1) { return 12; } if (idx == 2) { return 12; } return 0; }
  if (cfg == "c1") { if (idx == 0) { return 4; } if (idx == 1) { return 8; } if (idx == 2) { return 8; } return 0; }
  if (cfg == "c2") { if (idx == 0) { return 3; } if (idx == 1) { return 6; } if (idx == 2) { return 3; } if (idx == 3) { return 6; } return 0; }
  if (cfg == "c3") { if (idx == 0) { return 3; } if (idx == 1) { return 4; } if (idx == 2) { return 6; } if (idx == 3) { return 4; } return 0; }
  if (cfg == "c4") { if (idx == 0) { return 3; } if (idx == 1) { return 3; } if (idx == 2) { return 3; } if (idx == 3) { return 3; } if (idx == 4) { return 6; } return 0; }
  if (cfg == "c5") { if (idx == 0) { return 3; } if (idx == 1) { return 3; } if (idx == 2) { return 3; } if (idx == 3) { return 4; } if (idx == 4) { return 4; } return 0; }
  if (cfg == "c6") { if (idx == 0) { return 3; } if (idx == 1) { return 3; } if (idx == 2) { return 3; } if (idx == 3) { return 3; } if (idx == 4) { return 3; } if (idx == 5) { return 4; } return 0; }
  if (idx == 0) { return 3; } if (idx == 1) { return 4; } if (idx == 2) { return 3; } if (idx == 3) { return 4; } return 0;
}
Function interior(n) { return (n - 2) * 180 / n; }
Function cfg2num(c) {
  if (c == "c0") { return 0; } if (c == "c1") { return 1; } if (c == "c2") { return 2; } if (c == "c3") { return 3; }
  if (c == "c4") { return 4; } if (c == "c5") { return 5; } if (c == "c6") { return 6; } return 7;
}

Update {
  float ang0 = atan2(A.pos.y, A.pos.x);
  if (key != cfg2num(cfg) * 1e6 + round(ang0 * 500)) {
    g = newGraph();
    float cur = ang0 * 180 / 3.14159265358979;
    repeat (6) {
      float n = nAt(i);
      if (n >= 3) {
        float ang = interior(n);
        float R = a / (2 * sin(3.14159265358979 / n));
        float bis = (cur + ang / 2) * 0.0174532925;
        float ocx = R * cos(bis); float ocy = R * sin(bis);
        float a0 = atan2(0 - ocy, 0 - ocx);
        string tag = "g" + format(i, 0);
        repeat (12) {
          if (i < n) {
            float ai = a0 + 2 * 3.14159265358979 * i / n;
            addNode(g, tag + "_" + format(i, 0), [ocx + R * cos(ai), ocy + R * sin(ai)]);
          }
        }
        repeat (12) {
          if (i < n) {
            float j = i + 1; if (j >= n) { j = 0; }
            addEdge(g, tag + "_" + format(i, 0), tag + "_" + format(j, 0));
          }
        }
        cur = cur + ang;
      }
    }
    key = cfg2num(cfg) * 1e6 + round(ang0 * 500);
  }

  string seq = "";
  repeat (6) { float n = nAt(i); if (n >= 3) { if (seq != "") { seq = seq + "."; } seq = seq + format(n, 0); } }
  string sm = ""; float tot = 0;
  repeat (6) { float n2 = nAt(i); if (n2 >= 3) { if (sm != "") { sm = sm + " + "; } sm = sm + format(interior(n2), 0); tot = tot + interior(n2); } }
  info = "**Конфигурация вершины [" + seq + "]:** вокруг точки V по кругу сходятся правильные многоугольники именно в этом порядке — и так в каждой вершине паркета, поскольку он вершинно-транзитивен. Такая локальная картина однозначно продолжается на всю плоскость единственным способом.\n\n**Угловое условие:** " + sm + " = " + format(tot, 0) + "°.";
}
]
