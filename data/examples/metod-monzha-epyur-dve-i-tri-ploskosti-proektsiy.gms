[
description = "{info}"
field width = 26; field height = 16;
camera type = fixed;
float x = 5; float y = 2.5; float z = 3; float tab = 2; float axOn = 0; string info = "";
new Point { name = "A2"; pos = (-5, 3); text = true("A₂"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "A1"; pos = (-5, -2.5); text = true("A₁"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "A3"; pos = (2.5, 3); text = true("A₃"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "K"; pos = (2.5, -2.5); dynamic = false; collision = false; size = 0.15 }
new Line { name = "c12"; pos = (A2, A1); interact = false; thickness = 1 }
new Line { name = "c23"; pos = (A2, A3); interact = false; thickness = 1 }
new Line { name = "c13"; pos = (A1, K); interact = false; thickness = 1 }
new Line { name = "c3k"; pos = (K, A3); interact = false; thickness = 1 }
new Claster { name = "tab3"; elements = (A3, K, c23, c13, c3k, dConst, tW, tYw); active = false }
draw Graph { name = "dAxis"; graph = "gAxis"; nodeRadius = 0; labels = false; interactive = false; edgeWidth = 1.5 }
draw Graph { name = "dConst"; graph = "gConst"; nodeRadius = 0; labels = false; interactive = false; edgeWidth = 1 }
draw Text { name = "tx"; pos = (-12.4, 0.6); text = "x" }
draw Text { name = "tz"; pos = (0.6, 7.4); text = "z" }
draw Text { name = "tYh"; pos = (0.7, -7.4); text = "y" }
draw Text { name = "tYw"; pos = (12.4, 0.6); text = "y" }
draw Text { name = "tV"; pos = (-12.4, 7.4); text = "V"; align = left }
draw Text { name = "tH"; pos = (-12.4, -7.4); text = "H"; align = left }
draw Text { name = "tW"; pos = (12.4, 7.4); text = "W"; align = right }
new UI { name = "btn2"; type = button; label = "Две плоскости"; action = "tab = 2; tab3.active = false" }
new UI { name = "btn3"; type = button; label = "Три плоскости"; action = "tab = 3; tab3.active = true" }
Function num(v, d) { if (v < 0) { return "−" + format(-v, d); } return format(v, d); }
Function cl(v, lo, hi) { return max(lo, min(hi, v)); }
Update {
  if (axOn == 0) {
    axOn = 1;
    gAxis = newGraph(); addNode(gAxis, "a", [-12.6, 0]); addNode(gAxis, "b", [12.6, 0]); addNode(gAxis, "c", [0, -7.6]); addNode(gAxis, "d", [0, 7.6]); addEdge(gAxis, "a", "b"); addEdge(gAxis, "c", "d");
    gConst = newGraph(); addNode(gConst, "p", [-5.5, 5.5]); addNode(gConst, "q", [5.5, -5.5]); addEdge(gConst, "p", "q");
  }
  // какая проекция сдвинута (по наибольшему смещению)
  float d2 = abs(A2.pos.x + x) + abs(A2.pos.y - z);
  float d1 = abs(A1.pos.x + x) + abs(A1.pos.y + y);
  float d3 = abs(A3.pos.x - y) + abs(A3.pos.y - z);
  if (tab == 2) { d3 = 0; }
  float m = max(d1, max(d2, d3));
  if (m > 0.00001) {
    if (m == d2) { x = -A2.pos.x; z = A2.pos.y; }
    else if (m == d1) { x = -A1.pos.x; y = -A1.pos.y; }
    else { y = A3.pos.x; z = A3.pos.y; }
    x = cl(x, 0, 10); y = cl(y, -4, 5); z = cl(z, -4, 5);
  }
  if (abs(A2.pos.x + x) + abs(A2.pos.y - z) > 0.00001) { A2.pos.x = -x; A2.pos.y = z; }
  if (abs(A1.pos.x + x) + abs(A1.pos.y + y) > 0.00001) { A1.pos.x = -x; A1.pos.y = -y; }
  if (abs(A3.pos.x - y) + abs(A3.pos.y - z) > 0.00001) { A3.pos.x = y; A3.pos.y = z; }
  if (abs(K.pos.x - y) + abs(K.pos.y + y) > 0.00001) { K.pos.x = y; K.pos.y = -y; }
  string q = "I"; if (y < 0 && z >= 0) { q = "II"; } if (y < 0 && z < 0) { q = "III"; } if (y >= 0 && z < 0) { q = "IV"; }
  string sV = "над осью x"; if (z < 0) { sV = "под осью x"; }
  string sH = "под осью x"; if (y < 0) { sH = "над осью x"; }
  string pos = "A(" + num(x, 1) + "; " + num(y, 1) + "; " + num(z, 1) + ")";
  if (tab == 2) {
    info = "**Дипроекция.** Точка " + pos + " задана двумя проекциями на взаимно перпендикулярные плоскости: горизонтальной H и фронтальной V. После совмещения H с V получается эпюр (комплексный чертёж): проекции A₁ и A₂ лежат на одной линии связи, перпендикулярной оси x.\n\nФронтальная проекция A₂ = (x; z) — " + sV + " на расстоянии |z| = " + format(abs(z), 1) + " (высота точки над H), горизонтальная A₁ = (x; y) — " + sH + " на расстоянии |y| = " + format(abs(y), 1) + " (удаление от V). Точка находится в " + q + " четверти пространства.\n\nПо двум проекциям точка восстанавливается однозначно.";
  } else {
    info = "**Трипроекция.** К H и V добавлена профильная плоскость W; точка " + pos + " имеет три проекции: A₁ = (x; y), A₂ = (x; z), A₃ = (y; z). Фронтальная и профильная проекции связаны горизонтальной линией связи (перпендикулярной оси z), горизонтальная и профильная — ломаной через постоянную прямую, наклонённую под 45° к осям.\n\nA₃ находится на расстоянии y = " + num(y, 1) + " от оси z и на высоте z = " + num(z, 1) + ": каждая проекция несёт две координаты из трёх, третья определяется по любым двум остальным.\n\nРасстояния до плоскостей: до H — |z| = " + format(abs(z), 1) + ", до V — |y| = " + format(abs(y), 1) + ", до W — x = " + format(x, 1) + ".";
  }
}
]
