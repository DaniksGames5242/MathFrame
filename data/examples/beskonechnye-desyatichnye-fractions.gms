[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float n = 7; string info = "";
draw Graph { name = "gb"; graph = "g"; nodeRadius = 0; edgeWidth = 22; labels = false; interactive = false }
new UI { type = slider; label = "знаменатель n"; variable = n; min = 2; max = 12; step = 1; default = 7 }
Function bar(i, v, c2) { addNode(g, "a" + format(i, 0), [i * 1.3 - 5.5, -3]); addNode(g, "b" + format(i, 0), [i * 1.3 - 5.5, -3 + 5 * v / 9]); addEdge(g, "a" + format(i, 0), "b" + format(i, 0), 1, c2); }
Update {
  string digits = ""; float finite = 0; g = newGraph();
  float rem = 1; float k = 0;
  repeat (8) { rem = rem * 10; float dig = floor(rem / n); rem = rem - dig * n; digits = digits + format(dig, 0); bar(k, dig, "#3b82f6"); k = k + 1; if (rem < 0.5) { finite = 1; } }
  string kind = "бесконечная периодическая"; if (finite > 0.5) { kind = "конечная"; }
  info = "1/" + format(n, 0) + " = 0," + digits + "… — **" + kind + "** десятичная дробь (первые 8 цифр после запятой).\n\nЕсли деление на n когда-нибудь даёт остаток 0, дробь конечная; иначе цифры повторяются бесконечно.";
}
]
