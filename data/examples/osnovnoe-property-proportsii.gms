[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float a = 6; float b = 8; float c = 9; float d = 12; string info = ""; float ad = 0; float bc = 0;
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-1.5, -3.5); text = "a×d"; size = 0.9 }
draw Text { name = "l2"; pos = (1.5, -3.5); text = "b×c"; size = 0.9 }
new UI { type = slider; label = "a"; variable = a; min = 1; max = 20; step = 1; default = 6 }
new UI { type = slider; label = "b"; variable = b; min = 1; max = 20; step = 1; default = 8 }
new UI { type = slider; label = "c"; variable = c; min = 1; max = 20; step = 1; default = 9 }
new UI { type = slider; label = "d"; variable = d; min = 1; max = 20; step = 1; default = 12 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 6 * v / VMAX]); addEdge(g, k + "0", k + "1", 1, c); }
float VMAX = 400;
Update {
  ad = a * d;
  bc = b * c;
  VMAX = max(ad, max(bc, 0.01)) * 1.1;
  g = newGraph(); bar("a", -1.5, ad, "#3b82f6"); bar("b", 1.5, bc, "#f59e0b");
  string eq = "равны"; if (ad != bc) { eq = "не равны"; }
  info = "Пропорция " + format(a, 0) + "/" + format(b, 0) + " = " + format(c, 0) + "/" + format(d, 0) + ": произведение крайних a×d = " + format(ad, 0) + ", средних b×c = " + format(bc, 0) + " — **" + eq + "**.";
}
]
