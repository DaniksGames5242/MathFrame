[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Шесть столбиков в логарифмической шкале (выше — «больше» норма): |x|ₚ, |y|ₚ, |x + y|ₚ, max(|x|ₚ, |y|ₚ), |xy|ₚ, |x|ₚ·|y|ₚ.
// Серая линия — уровень нормы 1. Неархимедовость: |x + y|ₚ не выше max; мультипликативность: пятый и шестой столбики равны. ----
draw Graph { name = "gB1"; graph = "g1"; edgeColor = #3b82f6; edgeWidth = 44; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gB2"; graph = "g2"; edgeColor = #22c55e; edgeWidth = 44; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gB3"; graph = "g3"; edgeColor = #f59e0b; edgeWidth = 44; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gL"; graph = "gl"; edgeColor = #3b82f6; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "n0"; pos = (bx(0), -4.75); text = "|x|ₚ"; size = 1 }
draw Text { name = "n1"; pos = (bx(1), -4.75); text = "|y|ₚ"; size = 1 }
draw Text { name = "n2"; pos = (bx(2), -4.75); text = "|x+y|ₚ"; size = 1 }
draw Text { name = "n3"; pos = (bx(3), -4.75); text = "max"; size = 1 }
draw Text { name = "n4"; pos = (bx(4), -4.75); text = "|xy|ₚ"; size = 1 }
draw Text { name = "n5"; pos = (bx(5), -4.75); text = "|x|ₚ·|y|ₚ"; size = 1 }
draw Text { name = "t0"; pos = (bx(0), ty(0)); text = nt(0); size = 1 }
draw Text { name = "t1"; pos = (bx(1), ty(1)); text = nt(1); size = 1 }
draw Text { name = "t2"; pos = (bx(2), ty(2)); text = nt(2); size = 1 }
draw Text { name = "t3"; pos = (bx(3), ty(3)); text = nt(3); size = 1 }
draw Text { name = "t4"; pos = (bx(4), ty(4)); text = nt(4); size = 1 }
draw Text { name = "t5"; pos = (bx(5), ty(5)); text = nt(5); size = 1 }

new UI { name = "sP"; type = select; label = "p"; variable = p; options = (2, 3, 5, 7); default = 3 }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = -60; max = 60; step = 1; default = 12 }
new UI { name = "sB"; type = slider; label = "b"; variable = b; min = 1; max = 30; step = 1; default = 9 }
new UI { name = "sC"; type = slider; label = "c"; variable = c; min = -60; max = 60; step = 1; default = 18 }
new UI { name = "sD"; type = slider; label = "d"; variable = d; min = 1; max = 30; step = 1; default = 5 }

// ---- Логика ----
float p = 3; float a = 12; float b = 9; float c = 18; float d = 5;
list vs = [0, 0, 0, 0, 0, 0];
string info = "";

Function md(m, q) { return m - floor(m / q) * q; }
Function num(x) { if (x < 0) { return "−" + format(-x, 0); } return format(x, 0); }
// v_p(n): показатель p в разложении целого n (0 — «бесконечность», 99)
Function nv(n) { float m = abs(n); if (m == 0) { return 99; } float v = 0; repeat (12) { if (md(m, p) == 0) { v = v + 1; m = m / p; } } return v; }
Function vq(n, q) { if (n == 0) { return 99; } return nv(n) - nv(q); }
Function bx(k) { return -6.6 + 2.6 * k; }
Function hh(v) { if (v > 50) { return 0.15; } return max(0.15, min(8.3, 4.6 - 0.6 * v)); }
Function ty(k) { return -4.2 + hh(vs[k]) + 0.4; }
Function nt(k) { float v = vs[k]; if (v > 50) { return "0"; } if (v == 0) { return "1"; } if (v > 0) { return "1/" + format(p ^ v, 0); } return format(p ^ (-v), 0); }
Function vp2(v) { if (v > 50) { return "∞"; } return num(v); }

Update {
  vs[0] = vq(a, b); vs[1] = vq(c, d);
  vs[2] = vq(a * d + c * b, b * d);
  vs[3] = min(vs[0], vs[1]);
  vs[4] = vq(a * c, b * d);
  vs[5] = 99; if (vs[0] < 50 && vs[1] < 50) { vs[5] = vs[0] + vs[1]; }
  g1 = newGraph(); g2 = newGraph(); g3 = newGraph(); gl = newGraph();
  repeat (6) { float k = i;
    if (k == 0 || k == 1) { addNode(g1, "a" + format(k, 0), [bx(k), -4.2]); addNode(g1, "b" + format(k, 0), [bx(k), -4.2 + hh(vs[k])]); addEdge(g1, "a" + format(k, 0), "b" + format(k, 0)); }
    if (k == 2 || k == 4) { addNode(g2, "a" + format(k, 0), [bx(k), -4.2]); addNode(g2, "b" + format(k, 0), [bx(k), -4.2 + hh(vs[k])]); addEdge(g2, "a" + format(k, 0), "b" + format(k, 0)); }
    if (k == 3 || k == 5) { addNode(g3, "a" + format(k, 0), [bx(k), -4.2]); addNode(g3, "b" + format(k, 0), [bx(k), -4.2 + hh(vs[k])]); addEdge(g3, "a" + format(k, 0), "b" + format(k, 0)); }
  }
  addNode(gl, "l1", [-7.8, 0.4]); addNode(gl, "l2", [7.8, 0.4]); addEdge(gl, "l1", "l2");
  info = "**p-адическая норма** рационального числа x = pᵛ·m/n (m, n не делятся на p): |x|ₚ = p⁻ᵛ, |0|ₚ = 0. Чем выше степень p в x, тем норма меньше (серая линия на рисунке — уровень 1).\n\n";
  info = info + "p = " + format(p, 0) + ":   x = " + num(a) + "/" + format(b, 0) + ", vₚ(x) = " + vp2(vs[0]) + ", |x|ₚ = " + nt(0) + ";   y = " + num(c) + "/" + format(d, 0) + ", vₚ(y) = " + vp2(vs[1]) + ", |y|ₚ = " + nt(1) + ".\n\n";
  info = info + "**Неархимедовость:** |x + y|ₚ = " + nt(2) + " ≤ max(|x|ₚ, |y|ₚ) = " + nt(3) + ". Если нормы слагаемых различны, то |x + y|ₚ равно большей из них.\n\n";
  info = info + "**Мультипликативность:** |xy|ₚ = " + nt(4) + " = |x|ₚ·|y|ₚ = " + nt(5) + ".";
}
]
