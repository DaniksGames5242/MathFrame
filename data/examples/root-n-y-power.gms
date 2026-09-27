[
description = "{info}"
field width = 12; field height = 6;
camera type = fixed;
float a = 8; float n = 3; string info = "";
draw Graph { name = "ax"; graph = "gax"; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false }
new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new UI { type = slider; label = "степень n"; variable = n; min = 2; max = 5; step = 1; default = 3 }
new UI { type = slider; label = "число a"; variable = a; min = -10; max = 10; step = 0.5; default = 8 }
Function isEven(k) { if (k - 2 * floor(k / 2) == 0) { return 1; } return 0; }
Update {
  gax = newGraph(); addNode(gax, "a1", [-6.5, 0]); addNode(gax, "a2", [6.5, 0]); addEdge(gax, "a1", "a2");
  if (isEven(n) == 1 && a < 0) { a = 0; }
  float x = pow(abs(a), 1 / n); if (a < 0) { x = -x; }
  P1.pos.x = x;
  string nm = "нечётной"; if (isEven(n) == 1) { nm = "чётной"; }
  info = "Корень " + format(n, 0) + "-й степени (" + nm + ") из a = " + format(a, 1) + ": x = ⁿ√a = " + format(x, 3) + ". Проверка: xⁿ = " + format(pow(x, n), 2) + " = a.";
}
]
