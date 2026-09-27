[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
float v1 = 4; float v2 = 9; float v3 = 2; float v4 = 7; float v5 = 11; float v6 = 5; string info = "";
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -4.3]); addNode(g, k + "1", [x, -4.3 + v]); addEdge(g, k + "0", k + "1", 1, c); }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 22; labels = false; interactive = false }
new UI { type = slider; label = "значение x₃"; variable = v3; min = 0; max = 12; step = 0.5; default = 2 }
Update {
  float m = (v1 + v2 + v3 + v4 + v5 + v6) / 6;
  float d1 = abs(v1 - m); float d2 = abs(v2 - m); float d3 = abs(v3 - m);
  float d4 = abs(v4 - m); float d5 = abs(v5 - m); float d6 = abs(v6 - m);
  float dv = ((v1 - m) * (v1 - m) + (v2 - m) * (v2 - m) + (v3 - m) * (v3 - m) + (v4 - m) * (v4 - m) + (v5 - m) * (v5 - m) + (v6 - m) * (v6 - m)) / 6;
  float s = sqrt(dv);
  g = newGraph();
  bar("a", -6, d1, "#3b82f6"); bar("b", -3.6, d2, "#3b82f6"); bar("c", -1.2, d3, "#f59e0b"); bar("d", 1.2, d4, "#3b82f6"); bar("e", 3.6, d5, "#3b82f6"); bar("f", 6, d6, "#3b82f6");
  info = "Столбики — модули отклонений |xᵢ − x̄| при среднем x̄ = " + format(m, 2) + ".\n\n**Выборочное стандартное отклонение** σ = √D = √" + format(dv, 2) + " = " + format(s, 2) + " — показывает, на сколько в среднем значения выборки отличаются от x̄, в тех же единицах, что и сами данные.";
}
]
