[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Система из трёх аксиом инцидентности (пример системы аксиом теории):
// (1) через любые две точки проходит прямая; (2) на каждой прямой не меньше двух точек;
// (3) есть три точки, не лежащие на одной общей прямой. Выбираем разные модели (наборы
// точек и прямых) и проверяем, все ли аксиомы системы в них выполнены. ----
draw Graph { name = "gL"; graph = "gl"; edgeWidth = 2; nodeRadius = 16; interactive = false; labels = false; showWeights = false }
draw Text { name = "lA"; pos = (ax() - 0.5, ay() + 0.6); text = "A"; size = 0.9 }
draw Text { name = "lB"; pos = (bx() + 0.5, by() + 0.6); text = "B"; size = 0.9 }
draw Text { name = "lC"; pos = (cx(), cy() + 0.6); text = "C"; size = 0.9 }
draw Text { name = "lD"; pos = (dx() + 0.5, dy() - 0.6); text = "D"; size = 0.9; active = sr != "tri" }

new UI { name = "sM"; type = select; label = "модель"; variable = sr; options = ("tri", "quad", "allcol", "isolated"); labels = ("треугольник (3 точки)", "полный четырёхугольник", "все точки на одной прямой", "точка без прямых"); default = "tri" }

// ---- Логика ----
string sr = "tri";
string info = "";

Function ax() { if (sr == "allcol") { return -6; } if (sr == "quad") { return -5; } return -4; }
Function ay() { if (sr == "allcol") { return 0; } if (sr == "quad") { return -3; } return -2; }
Function bx() { if (sr == "allcol") { return -2; } if (sr == "quad") { return 5; } return 4; }
Function by() { if (sr == "allcol") { return 0; } if (sr == "quad") { return -3; } return -2; }
Function cx() { if (sr == "allcol") { return 2; } if (sr == "quad") { return 5; } return 0; }
Function cy() { if (sr == "allcol") { return 0; } if (sr == "quad") { return 3; } if (sr == "tri") { return 3; } return 2; }
Function dx() { if (sr == "allcol") { return 6; } if (sr == "quad") { return -5; } return 0; }
Function dy() { if (sr == "allcol") { return 0; } if (sr == "quad") { return 3; } return -4.6; }

Update {
  gl = newGraph();
  addNode(gl, "A", [ax(), ay()]); addNode(gl, "B", [bx(), by()]); addNode(gl, "C", [cx(), cy()]);
  addEdge(gl, "A", "B"); addEdge(gl, "B", "C"); addEdge(gl, "C", "A");
  if (sr != "tri") { addNode(gl, "D", [dx(), dy()]); }
  if (sr == "quad") { addEdge(gl, "A", "D"); addEdge(gl, "B", "D"); addEdge(gl, "C", "D"); }
  if (sr == "allcol") { addEdge(gl, "C", "D"); }

  float ax1 = 1; float ax2 = 1; float ax3 = 1; string w = "";
  if (sr == "allcol") { ax3 = 0; w = "все четыре точки лежат на одной прямой — тройки точек вне общей прямой нет."; }
  if (sr == "isolated") { ax1 = 0; w = "прямой через A и D нет: точка D не соединена ни с одной другой точкой."; }

  string name = "треугольник ABC"; if (sr == "quad") { name = "полный четырёхугольник ABCD"; } if (sr == "allcol") { name = "четыре точки A, B, C, D на одной прямой"; } if (sr == "isolated") { name = "треугольник ABC и точка D без единой прямой"; }

  info = "**Аксиома** — утверждение, принимаемое без доказательства и задающее исходные свойства объектов теории. Система аксиом (пример — инцидентность): (1) через любые две точки — прямая; (2) на каждой прямой не меньше двух точек; (3) есть три точки не на одной общей прямой.\n\nМодель: " + name + ".\n\n";
  if (ax1 == 1 && ax2 == 1 && ax3 == 1) { info = info + "Все три аксиомы **выполнены** — это модель системы: разные модели одной и той же системы аксиом могут быть устроены совсем по-разному."; }
  else { info = info + "Нарушена аксиома: " + w + " Значит, эта модель **не удовлетворяет** системе: чтобы теория была непротиворечивой, аксиомы должны выполняться одновременно в каждой её модели."; }
}
]
