[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
new Point { name = "A"; pos = (3, 2); pauseOnDrag = false; color = #3b82f6 }
Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Update {
  string q = "I"; if (A.pos.x < 0) { if (A.pos.y > 0) { q = "II"; } if (A.pos.y < 0) { q = "III"; } } if (A.pos.x > 0 && A.pos.y < 0) { q = "IV"; }
  string qt = "квадранте " + q; if (abs(A.pos.x) < 0.01) { qt = "на оси ординат"; } if (abs(A.pos.y) < 0.01) { qt = "на оси абсцисс"; }
  info = "Оси Ox и Oy взаимно перпендикулярны и делят плоскость на четыре квадранта. Точка A(" + num(A.pos.x) + "; " + num(A.pos.y) + ") лежит в " + qt + ": знаки её координат — (" + num(A.pos.x) + "; " + num(A.pos.y) + ").\n\nI: (+;+), II: (−;+), III: (−;−), IV: (+;−).";
}
]
