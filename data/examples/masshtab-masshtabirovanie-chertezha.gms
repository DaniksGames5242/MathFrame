[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float L = 20; float m = 200; float d = 0; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 26; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-3, -3.5); text = "объект, м"; size = 0.9 }
draw Text { name = "l2"; pos = (3, -3.5); text = "чертёж, см"; size = 0.9 }
new UI { type = slider; label = "размер на объекте, м"; variable = L; min = 1; max = 50; step = 1; default = 20 }
new UI { type = slider; label = "знаменатель масштаба (1:m)"; variable = m; min = 10; max = 1000; step = 10; default = 200 }
Function bar(k, x, v, vmax, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / vmax]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  d = L * 100 / m;
  g = newGraph(); bar("a", -3, L, 50, "#3b82f6"); bar("b", 3, d, 500, "#f59e0b");
  info = "**Масштаб 1 : " + format(m,0) + "** означает, что 1 см на чертеже соответствует " + format(m,0) + " см на объекте.\n\nПри размере объекта " + format(L,0) + " м чертёж этой детали равен L·100/m = " + format(L,0) + "·100/" + format(m,0) + " = **" + format(d,2) + " см**.";
}
]
