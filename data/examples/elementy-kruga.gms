[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Круг радиуса R с центром O. P, Q — точки окружности: радиусы OP, OQ ограничивают
// сектор, хорда PQ отсекает сегмент (обе фигуры — по меньшей дуге PQ). Кольцо — часть
// плоскости между окружностью и концентрической окружностью радиуса r (точка B). ----
new Point { name = "O"; pos = (0, 0); text = true("O"); dynamic = false; collision = false }
new Circle { name = "w"; center = "O"; radius = 4.5 }

new Point { name = "P"; circle = "w"; t = 0.08; text = true("P") }
new Point { name = "Q"; circle = "w"; t = 0.33; text = true("Q") }
draw Graph { name = "sec"; graph = "gs"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "seg"; graph = "gg"; edgeColor = #3b82f6; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
new Claster { name = "tabSec"; elements = (sec); active = true }
new Claster { name = "tabSeg"; elements = (seg); active = false }

new Point { name = "B"; pos = (2.5, 0); text = true("B"); pauseOnDrag = false }
new Circle { name = "w2"; center = "O"; radius = rin }
new Line { name = "ob"; pos = (O, B); interact = false }
new Claster { name = "tabRing"; elements = (B, w2, ob); active = false }

new UI { name = "b1"; type = button; label = "Сектор"; action = "tab = 1; tabSec.active = true; tabSeg.active = false; tabRing.active = false; P.active = true; Q.active = true" }
new UI { name = "b2"; type = button; label = "Сегмент"; action = "tab = 2; tabSec.active = false; tabSeg.active = true; tabRing.active = false; P.active = true; Q.active = true" }
new UI { name = "b3"; type = button; label = "Кольцо"; action = "tab = 3; tabSec.active = false; tabSeg.active = false; tabRing.active = true; P.active = false; Q.active = false" }

// ---- Логика ----
float tab = 1;
float R = 4.5;
float rin = 2.5;
float kA = -100; float kB = -100;
string info = "";

Update {
  float aP = atan2(P.pos.y, P.pos.x);
  float aQ = atan2(Q.pos.y, Q.pos.x);
  float df = aQ - aP;
  while (df > pi) { df = df - 2 * pi; }
  while (df < 0 - pi) { df = df + 2 * pi; }
  float al = abs(df);
  if (kA != round(aP * 400) || kB != round(aQ * 400)) {
    gs = newGraph(); gg = newGraph();
    addNode(gs, "o", [0, 0]);
    repeat (31) {
      float t = aP + df * i / 30;
      addNode(gs, "a" + format(i, 0), [R * cos(t), R * sin(t)]);
      addNode(gg, "a" + format(i, 0), [R * cos(t), R * sin(t)]);
    }
    addEdge(gs, "o", "a0");
    repeat (30) {
      addEdge(gs, "a" + format(i, 0), "a" + format(i + 1, 0));
      addEdge(gg, "a" + format(i, 0), "a" + format(i + 1, 0));
    }
    addEdge(gs, "a30", "o");
    addEdge(gg, "a30", "a0");
    kA = round(aP * 400); kB = round(aQ * 400);
  }

  // B ездит по радиусу: только по горизонтали и строго внутри окружности.
  float bx = B.pos.x;
  if (bx < 0.6) { bx = 0.6; }
  if (bx > R - 0.6) { bx = R - 0.6; }
  if (abs(B.pos.y) > 0.000001 || abs(B.pos.x - bx) > 0.000001) { B.pos.x = bx; B.pos.y = 0; }
  rin = bx;

  float deg = al * 180 / pi;
  float chord = 2 * R * sin(al / 2);
  float dist = R * cos(al / 2);
  float area = pi * R * R;
  if (tab == 1) {
    float sS = 0.5 * R * R * al;
    info = "**Сектор** — часть круга, ограниченная двумя радиусами OP, OQ и дугой PQ (выделен). Центральный угол ∠POQ = " + format(al, 2) + " рад (" + format(deg, 0) + "°).\n\n**Длина дуги:** l = R·α = " + format(R, 2) + " · " + format(al, 2) + " = " + format(R * al, 2) + ".\n\n**Площадь сектора:** S = ½R²α = " + format(sS, 2) + " — доля " + format(al / (2 * pi) * 100, 1) + "% от площади круга πR² = " + format(area, 2) + ".";
  } else if (tab == 2) {
    float sSeg = 0.5 * R * R * (al - sin(al));
    info = "**Сегмент** — часть круга, отсекаемая хордой PQ и ограниченная ею и дугой PQ (выделен). Хорда PQ = 2R·sin(α/2) = " + format(chord, 2) + ", расстояние от центра до хорды d = R·cos(α/2) = " + format(dist, 2) + ".\n\n**Площадь сегмента:** S = ½R²(α − sin α) = " + format(sSeg, 2) + " при α = " + format(deg, 0) + "°: площадь сектора минус площадь треугольника OPQ.";
    if (deg > 179) { info = info + "\n\nХорда проходит через центр — это диаметр, оба сегмента равны и являются полукругами."; }
  } else {
    float ring = pi * (R * R - rin * rin);
    info = "**Кольцо** — часть плоскости между двумя концентрическими окружностями радиусов R = " + format(R, 2) + " и r = " + format(rin, 2) + ". Ширина кольца R − r = " + format(R - rin, 2) + ".\n\n**Площадь:** S = π(R² − r²) = " + format(ring, 2) + ". При r → R кольцо вырождается в окружность, при r = 0 — в круг.";
  }
}
]
