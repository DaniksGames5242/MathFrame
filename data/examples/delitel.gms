[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 12; float d = 3; string info = "";
new UI { type = slider; label = "число N"; variable = N; min = 1; max = 100; step = 1; default = 12 }
new UI { type = slider; label = "делитель d"; variable = d; min = 1; max = 20; step = 1; default = 3 }
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
draw Text { name = "l1"; pos = (-2, -3.6); text = "N"; size = 0.9 }
draw Text { name = "l2"; pos = (2, -3.6); text = "остаток"; size = 0.9 }
Function bar(k, x, v, c) { addNode(g, k + "0", [x, -3]); addNode(g, k + "1", [x, -3 + 5.4 * v / 100]); addEdge(g, k + "0", k + "1", 1, c); }
Update {
  float nn = round(N); float dd = round(d);
  float r = nn - floor(nn / dd) * dd;
  g = newGraph(); bar("a", -2, nn, "#3b82f6"); bar("b", 2, r, "#f59e0b");
  string m = "d не является делителем N: остаток " + format(r, 0) + " ≠ 0.";
  if (r < 0.5) { m = "d — делитель N: N делится на d без остатка (N = d × " + format(nn / dd, 0) + ")."; }
  info = "**N = " + format(nn, 0) + ", d = " + format(dd, 0) + "**: " + m;
}
]
