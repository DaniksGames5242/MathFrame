[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Правильный треугольник: места 1, 2, 3 (серые метки) и фишки 1, 2, 3 на них ----
// Кнопки применяют к текущему положению поворот r (на 120° против часовой) или отражение s
// (относительно оси через место 1). Любая комбинация — одна из 6 перестановок фишек: S₃.
new Point { name = "V1"; pos = (0, 2.7); dynamic = false; collision = false; active = false }
new Point { name = "V2"; pos = (-3.12, -2.7); dynamic = false; collision = false; active = false }
new Point { name = "V3"; pos = (3.12, -2.7); dynamic = false; collision = false; active = false }
new Line { name = "s12"; pos = (V1, V2); interact = false }
new Line { name = "s23"; pos = (V2, V3); interact = false }
new Line { name = "s31"; pos = (V3, V1); interact = false }
draw Text { name = "m1"; pos = (0, 3.6); text = "место 1" }
draw Text { name = "m2"; pos = (-4.1, -3.3); text = "место 2" }
draw Text { name = "m3"; pos = (4.1, -3.3); text = "место 3" }
new Point { name = "AX"; pos = (0, -2.7); dynamic = false; collision = false; active = false }
new Line { name = "axis"; pos = (V1, AX); active = false }
draw Punctir { name = "pax"; edge = "axis"; layer = 1 }

draw Graph { name = "ch1"; graph = "g1"; nodeRadius = 18; interactive = false; showWeights = false; nodeColor = #3b82f6 }
draw Graph { name = "ch2"; graph = "g2"; nodeRadius = 18; interactive = false; showWeights = false; nodeColor = #f59e0b }
draw Graph { name = "ch3"; graph = "g3"; nodeRadius = 18; interactive = false; showWeights = false; nodeColor = #22c55e }

new UI { name = "bR"; type = button; label = "r — поворот на 120°"; action = "pending = 1" }
new UI { name = "bS"; type = button; label = "s — отражение"; action = "pending = 2" }
new UI { name = "bE"; type = button; label = "Сбросить (e)"; action = "pending = 3" }

// ---- Логика ----
// at1, at2, at3 — на каком месте (1…3) стоит фишка 1, 2, 3; word — запись элемента через r и s
float at1 = 1; float at2 = 2; float at3 = 3;
float pending = 0;
float anim = 1;
float f1x = 0; float f1y = 2.7; float f2x = -3.12; float f2y = -2.7; float f3x = 3.12; float f3y = -2.7;
string word = "e";
string info = "";

Function px(k) { if (k == 1) { return 0; } if (k == 2) { return -3.12; } return 3.12; }
Function py(k) { if (k == 1) { return 2.7; } return -2.7; }
Function rot(k) { if (k == 3) { return 1; } return k + 1; }
Function refl(k) { if (k == 2) { return 3; } if (k == 3) { return 2; } return k; }
// Приведённая запись элемента: каждый элемент S₃ однозначно имеет вид rᵏ или rᵏs
Function wordOf() {
  // фишка 1 стоит на месте at1; ориентация: фишка 2 следует за 1 против часовой?
  float k = at1 - 1;
  float refl1 = 0; if (rot(at1) != at2) { refl1 = 1; }
  string w = "e";
  if (refl1 == 0) { if (k == 1) { w = "r"; } if (k == 2) { w = "r²"; } }
  else { w = "s"; if (at1 == 2) { w = "rs"; } if (at1 == 3) { w = "r²s"; } }
  return w;
}
// Перестановка в цикловой записи: фишка i → место at_i
Function cycles() {
  if (at1 == 1 && at2 == 2 && at3 == 3) { return "id"; }
  if (at1 == 1) { return "(2 3)"; } if (at2 == 2) { return "(1 3)"; } if (at3 == 3) { return "(1 2)"; }
  if (at1 == 2) { return "(1 2 3)"; }
  return "(1 3 2)";
}

Update {
  if (pending == 1) { at1 = rot(at1); at2 = rot(at2); at3 = rot(at3); anim = 0; }
  if (pending == 2) { at1 = refl(at1); at2 = refl(at2); at3 = refl(at3); anim = 0; }
  if (pending == 3) { at1 = 1; at2 = 2; at3 = 3; anim = 0; }
  pending = 0;
  // Плавный переезд фишек на новые места
  anim = min(anim + 0.08, 1);
  f1x = f1x + (px(at1) - f1x) * anim; f1y = f1y + (py(at1) - f1y) * anim;
  f2x = f2x + (px(at2) - f2x) * anim; f2y = f2y + (py(at2) - f2y) * anim;
  f3x = f3x + (px(at3) - f3x) * anim; f3y = f3y + (py(at3) - f3y) * anim;
  g1 = newGraph(); g2 = newGraph(); g3 = newGraph();
  addNode(g1, "1", [f1x, f1y]); addNode(g2, "2", [f2x, f2y]); addNode(g3, "3", [f3x, f3y]);

  info = "**Симметрическая группа S₃** — все 6 перестановок трёх элементов с операцией композиции. Её можно увидеть как группу симметрий правильного треугольника: любое положение фишек получается из поворота r и отражения s.\n\nТекущий элемент: **" + wordOf() + "**, перестановка фишек " + cycles() + " (фишка → место).\n\nЭлементы: e, r, r², s, rs, r²s; соотношения r³ = s² = e, sr = r²s. Группа некоммутативна: попробуйте r затем s и s затем r из одного положения.";
}
]
