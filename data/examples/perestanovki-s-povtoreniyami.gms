[
description = "{info}"
field width = 14; field height = 9;
camera type = fixed;
float a = 3; float b = 3; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 40; labels = false; interactive = false }
new UI { type = slider; label = "букв А"; variable = a; min = 1; max = 6; step = 1; default = 3 }
new UI { type = slider; label = "букв Б"; variable = b; min = 1; max = 6; step = 1; default = 3 }
Function fact(n) { float r = 1; repeat (12) { if (i < n) { r = r * (i + 1); } } return r; }
Update {
  float n = a + b; float val = fact(n) / (fact(a) * fact(b));
  g = newGraph(); addNode(g, "x0", [0, -3.5]); addNode(g, "x1", [0, -3.5 + 6 * val / 924]); addEdge(g, "x0", "x1", 1, "#3b82f6");
  info = "Слово из " + format(a,0) + " букв «А» и " + format(b,0) + " букв «Б» (всего n = " + format(n,0) + " букв) можно переставить n!/(a!·b!) = " + format(n,0) + "!/(" + format(a,0) + "!·" + format(b,0) + "!) = **" + format(val,0) + "** способами — это перестановка с повторениями.";
}
]
