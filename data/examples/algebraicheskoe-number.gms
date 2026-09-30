[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Комплексная плоскость: корни многочлена a·x² + b·x + c с целыми коэффициентами.
// Корень любого такого многочлена — алгебраическое число; вещественное или нет. ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f6; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Text { name = "tRe"; pos = (7.4, -0.5); text = "Re"; size = 0.9 }
draw Text { name = "tIm"; pos = (0.6, 4.6); text = "Im"; size = 0.9; align = left }
new Point { name = "R1"; pos = (1, 0); dynamic = false; collision = false; color = #f59e0b; label = "α" }
new Point { name = "R2"; pos = (-1, 0); dynamic = false; collision = false; color = #f59e0b; label = "ᾱ"; active = D2 > 0.5 }

new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 5; step = 1; default = 1 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = -6; max = 6; step = 1; default = 0 }
new UI { name = "sC"; type = slider; label = "c"; variable = c; min = -6; max = 6; step = 1; default = 1 }

float a = 1; float b = 0; float c = 1; float key = -1; float D2 = 1;
string info = "";

Function ns(x) { if (x < 0) { return "−" + format(-x, 0); } return format(x, 0); }
Function num(x, d) { if (x < -0.00001) { return "−" + format(-x, d); } return format(abs(x), d); }
Function pc(k, v) { if (k == 1) { return v; } return format(k, 0) + v; }
Function poly() {
  string s = pc(a, "x²");
  if (b > 0) { s = s + " + " + pc(b, "x"); }
  if (b < 0) { s = s + " − " + pc(-b, "x"); }
  if (c > 0) { s = s + " + " + format(c, 0); }
  if (c < 0) { s = s + " − " + format(-c, 0); }
  return s;
}
Function isSq(x) { return abs(sqrt(x) - round(sqrt(x))) < 0.000001; }

Update {
  if (key < 0) {
    gx = newGraph();
    addNode(gx, "a1", [-7.7, 0]); addNode(gx, "a2", [7.7, 0]); addEdge(gx, "a1", "a2");
    addNode(gx, "b1", [0, -4.7]); addNode(gx, "b2", [0, 4.7]); addEdge(gx, "b1", "b2");
    repeat (15) {
      addNode(gx, "x" + format(i, 0), [i - 7, -0.15]); addNode(gx, "X" + format(i, 0), [i - 7, 0.15]); addEdge(gx, "x" + format(i, 0), "X" + format(i, 0));
    }
    repeat (9) {
      addNode(gx, "y" + format(i, 0), [-0.15, i - 4]); addNode(gx, "Y" + format(i, 0), [0.15, i - 4]); addEdge(gx, "y" + format(i, 0), "Y" + format(i, 0));
    }
  }
  float k2 = a * 10000 + (b + 20) * 100 + c + 20;
  if (k2 != key) {
    key = k2;
    float D = b * b - 4 * a * c;
    string pol = poly();
    string s = "**Алгебраическое число** — комплексное число, являющееся корнем ненулевого многочлена с рациональными коэффициентами. Многочлен P(x) = " + pol + " имеет дискриминант D = " + num(D, 0) + ".\n\n";
    if (D < 0) {
      R1.pos.x = -b / (2 * a); R1.pos.y = sqrt(-D) / (2 * a);
      R2.pos.x = -b / (2 * a); R2.pos.y = -sqrt(-D) / (2 * a); D2 = 1;
      s = s + "Корни невещественны: α = " + num(-b / (2 * a), 3) + " ± " + num(sqrt(-D) / (2 * a), 3) + "·i. Определение охватывает и такие числа: оба корня алгебраические, рационального корня нет, поэтому степень числа α равна **2**.";
    }
    if (D >= 0) {
      float r1 = (-b - sqrt(D)) / (2 * a); float r2 = (-b + sqrt(D)) / (2 * a);
      R1.pos.x = r1; R1.pos.y = 0; R2.pos.x = r2; R2.pos.y = 0; D2 = 1;
      if (D == 0) { D2 = 0; }
      if (isSq(D)) {
        s = s + "Корни рациональны: " + num(r1, 3) + " и " + num(r2, 3) + ". Всякое рациональное число алгебраично — оно корень многочлена первой степени, степень числа равна **1**.";
      }
      if (!isSq(D)) {
        s = s + "Корни вещественны, но иррациональны: " + num(r1, 3) + " и " + num(r2, 3) + ". Рационального корня нет, минимальная степень многочлена равна **2**, значит, степень числа α равна 2.";
      }
    }
    info = s;
  }
}
]
