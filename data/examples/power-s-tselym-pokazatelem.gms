[
description = "{info}"
field width = 10; field height = 8;
camera type = fixed;
float a = 2; float n = -2; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 30; labels = false; interactive = false }
Function power(a, k) { if (k == 0) { return 1; } if (k > 0) { return pow(a, k); } return 1 / pow(a, -k); }
new UI { type = slider; label = "основание a"; variable = a; min = 0.3; max = 3; step = 0.1; default = 2 }
new UI { type = slider; label = "показатель n"; variable = n; min = -5; max = 5; step = 1; default = -2 }
Update {
  float an = power(a, n); float bv = an; if (bv > 8) { bv = 8; }
  g = newGraph(); addNode(g, "p0", [0, -3]); addNode(g, "p1", [0, -3 + 6 * bv / 8]); addEdge(g, "p0", "p1", 1, "#3b82f6");
  if (n == 0) { info = "**Степень с целым показателем:** a⁰ = 1 при a ≠ 0.\n\nПри a = " + format(a, 1) + ": a⁰ = " + format(an, 3) + "."; }
  if (n > 0) { info = "**При n > 0:** aⁿ — произведение a на себя n раз.\n\nПри a = " + format(a, 1) + ", n = " + format(n, 0) + ": aⁿ = " + format(an, 3) + "."; }
  if (n < 0) { info = "**При n < 0:** a в степени n равно 1/(a в степени |n|), при a ≠ 0.\n\nПри a = " + format(a, 1) + ", n = " + format(n, 0) + ": значение = " + format(an, 4) + "."; }
}
]
