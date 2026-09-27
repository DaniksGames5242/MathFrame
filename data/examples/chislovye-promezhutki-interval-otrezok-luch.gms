[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
show axes = true;
string tp = "otr"; float x = 0; string info = "";
draw Graph { name = "gL"; graph = "g"; edgeColor = #3b82f6; edgeWidth = 6; nodeRadius = 0; labels = false; interactive = false }
new Point { name = "L"; pos = (-3, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "R"; pos = (4, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "X"; pos = (0, 0); color = #f59e0b }
new UI { type = select; label = "тип промежутка"; variable = tp; options = ("otr", "int", "luch"); labels = ("отрезок [−3; 4]", "интервал (−3; 4)", "луч (−3; +∞)"); default = "otr" }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  if (abs(X.pos.y) > 0.001) { X.pos.y = 0; }
  float lo = -3; float hi = 4; string notation = "[−3; 4]"; string bl = "включена"; string br = "включена";
  g = newGraph(); addNode(g, "a", [lo, 0]); addNode(g, "b", [8, 0]); addEdge(g, "a", "b");
  if (tp == "int") { notation = "(−3; 4)"; bl = "не включена"; br = "не включена"; }
  if (tp == "luch") { notation = "(−3; +∞)"; bl = "не включена"; br = "не включена"; }
  float ins = 0;
  if (tp == "otr") { if (X.pos.x >= lo) { if (X.pos.x <= hi) { ins = 1; } } }
  if (tp == "int") { if (X.pos.x > lo) { if (X.pos.x < hi) { ins = 1; } } }
  if (tp == "luch") { if (X.pos.x > lo) { ins = 1; } }
  string res = "не принадлежит"; if (ins > 0.5) { res = "принадлежит"; }
  info = "";
  if (tp != "luch") { info = "**Числовой промежуток** " + notation + ": левая граница −3 " + bl + ", правая граница 4 " + br + "."; }
  if (tp == "luch") { info = "**Числовой промежуток** " + notation + ": левая граница −3 " + bl + ", ограничен только слева."; }
  info = info + "\n\nТочка x = " + num(X.pos.x, 2) + " " + res + " промежутку.";
}
]
