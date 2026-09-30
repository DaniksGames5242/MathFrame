[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Целое p-адическое число x = a/b (b не делится на p): цифры d₀, d₁, … (младшая слева), частичные суммы sₙ
// и столбики |x − sₙ|ₚ — суммы sₙ (обычные целые) сходятся к x в p-адической норме. ----
draw Graph { name = "gB"; graph = "gb"; edgeColor = #3b82f6; edgeWidth = 34; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "r1"; pos = (-7.8, 4.6); text = "цифры dᵢ:  x = d₀ + d₁p + d₂p² + …"; size = 0.95; align = left }
draw Text { name = "r2"; pos = (-7.8, 2.5); text = "частичные суммы sₙ = d₀ + … + dₙ₋₁pⁿ⁻¹"; size = 0.95; align = left }
draw Text { name = "r3"; pos = (-7.8, 0.9); text = "норма |x − sₙ|ₚ"; size = 0.95; align = left }
draw Text { name = "d0"; pos = (cx(0), 3.6); text = format(dg[0], 0); size = 1.7; color = #f59e0b }
draw Text { name = "s0"; pos = (cx(0), 1.7); text = format(ps[0 + 1], 0); size = 1 }
draw Text { name = "v0"; pos = (cx(0), -4.2 + hh(0) + 0.4); text = nt(0); size = 0.9 }
draw Text { name = "n0"; pos = (cx(0), -4.75); text = "n = 1"; size = 0.9; color = #3b82f6 }
draw Text { name = "d1"; pos = (cx(1), 3.6); text = format(dg[1], 0); size = 1.7; color = #f59e0b }
draw Text { name = "s1"; pos = (cx(1), 1.7); text = format(ps[1 + 1], 0); size = 1 }
draw Text { name = "v1"; pos = (cx(1), -4.2 + hh(1) + 0.4); text = nt(1); size = 0.9 }
draw Text { name = "n1"; pos = (cx(1), -4.75); text = "n = 2"; size = 0.9; color = #3b82f6 }
draw Text { name = "d2"; pos = (cx(2), 3.6); text = format(dg[2], 0); size = 1.7; color = #f59e0b }
draw Text { name = "s2"; pos = (cx(2), 1.7); text = format(ps[2 + 1], 0); size = 1 }
draw Text { name = "v2"; pos = (cx(2), -4.2 + hh(2) + 0.4); text = nt(2); size = 0.9 }
draw Text { name = "n2"; pos = (cx(2), -4.75); text = "n = 3"; size = 0.9; color = #3b82f6 }
draw Text { name = "d3"; pos = (cx(3), 3.6); text = format(dg[3], 0); size = 1.7; color = #f59e0b }
draw Text { name = "s3"; pos = (cx(3), 1.7); text = format(ps[3 + 1], 0); size = 1 }
draw Text { name = "v3"; pos = (cx(3), -4.2 + hh(3) + 0.4); text = nt(3); size = 0.9 }
draw Text { name = "n3"; pos = (cx(3), -4.75); text = "n = 4"; size = 0.9; color = #3b82f6 }
draw Text { name = "d4"; pos = (cx(4), 3.6); text = format(dg[4], 0); size = 1.7; color = #f59e0b }
draw Text { name = "s4"; pos = (cx(4), 1.7); text = format(ps[4 + 1], 0); size = 1 }
draw Text { name = "v4"; pos = (cx(4), -4.2 + hh(4) + 0.4); text = nt(4); size = 0.9 }
draw Text { name = "n4"; pos = (cx(4), -4.75); text = "n = 5"; size = 0.9; color = #3b82f6 }
draw Text { name = "d5"; pos = (cx(5), 3.6); text = format(dg[5], 0); size = 1.7; color = #f59e0b }
draw Text { name = "s5"; pos = (cx(5), 1.7); text = format(ps[5 + 1], 0); size = 1 }
draw Text { name = "v5"; pos = (cx(5), -4.2 + hh(5) + 0.4); text = nt(5); size = 0.9 }
draw Text { name = "n5"; pos = (cx(5), -4.75); text = "n = 6"; size = 0.9; color = #3b82f6 }
draw Text { name = "d6"; pos = (cx(6), 3.6); text = format(dg[6], 0); size = 1.7; color = #f59e0b }
draw Text { name = "s6"; pos = (cx(6), 1.7); text = format(ps[6 + 1], 0); size = 1 }
draw Text { name = "v6"; pos = (cx(6), -4.2 + hh(6) + 0.4); text = nt(6); size = 0.9 }
draw Text { name = "n6"; pos = (cx(6), -4.75); text = "n = 7"; size = 0.9; color = #3b82f6 }
draw Text { name = "d7"; pos = (cx(7), 3.6); text = format(dg[7], 0); size = 1.7; color = #f59e0b }
draw Text { name = "s7"; pos = (cx(7), 1.7); text = format(ps[7 + 1], 0); size = 1 }
draw Text { name = "v7"; pos = (cx(7), -4.2 + hh(7) + 0.4); text = nt(7); size = 0.9 }
draw Text { name = "n7"; pos = (cx(7), -4.75); text = "n = 8"; size = 0.9; color = #3b82f6 }

new UI { name = "sP"; type = select; label = "p"; variable = p; options = (2, 3, 5, 7); default = 3 }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = -40; max = 40; step = 1; default = 1 }
new UI { name = "sB"; type = slider; label = "b"; variable = q; min = 1; max = 12; step = 1; default = 3 }

// ---- Логика ----
float p = 3; float a = 1; float q = 3; float b = 4;
list dg = [0, 0, 0, 0, 0, 0, 0, 0];
list ps = [0, 0, 0, 0, 0, 0, 0, 0, 0];
list vl = [0, 0, 0, 0, 0, 0, 0, 0];
string info = "";

Function md(m, r) { return m - floor(m / r) * r; }
Function num(x) { if (x < 0) { return "−" + format(-x, 0); } return format(x, 0); }
Function nv(n) { float m = abs(n); if (m == 0) { return 99; } float v = 0; repeat (14) { if (md(m, p) == 0) { v = v + 1; m = m / p; } } return v; }
Function cx(k) { return -6.3 + 1.8 * k; }
Function hh(k) { if (vl[k] > 50) { return 0.15; } return max(0.15, 3.8 - 0.4 * (vl[k] - 1)); }
Function sup(n) { if (n == 0) { return "⁰"; } if (n == 1) { return "¹"; } if (n == 2) { return "²"; } if (n == 3) { return "³"; } if (n == 4) { return "⁴"; } if (n == 5) { return "⁵"; } if (n == 6) { return "⁶"; } if (n == 7) { return "⁷"; } if (n == 8) { return "⁸"; } return "⁹"; }
Function sup2(n) { if (n < 10) { return sup(n); } return sup(floor(n / 10)) + sup(md(n, 10)); }
Function nt(k) { float v = vl[k]; if (v > 50) { return "0"; } return "p⁻" + sup2(v); }
Function dstr() { string s = ""; repeat (8) { s = s + format(dg[7 - i], 0); } return s; }

Update {
  b = q + floor((q - 1) / (p - 1));
  float inv = 1; repeat (8) { if (md(b * (i + 1), p) == 1) { inv = i + 1; } }
  float s = 0; ps[0] = 0;
  repeat (8) { float k = i; float rem = a - b * s; float t = rem / (p ^ k); dg[k] = md(t * inv, p); s = s + dg[k] * p ^ k; ps[k + 1] = s; vl[k] = nv(a - b * s); }
  gb = newGraph();
  repeat (8) { float k = i; addNode(gb, "a" + format(k, 0), [cx(k), -4.2]); addNode(gb, "b" + format(k, 0), [cx(k), -4.2 + hh(k)]); addEdge(gb, "a" + format(k, 0), "b" + format(k, 0)); }
  info = "**p-адические числа** — пополнение ℚ по p-адической норме. Целое p-адическое число записывается рядом x = d₀ + d₁p + d₂p² + … с цифрами 0 ≤ dᵢ < p, бесконечным влево.\n\n";
  info = info + "p = " + format(p, 0) + ":   x = " + num(a) + "/" + format(b, 0) + " = …" + dstr() + " (по основанию " + format(p, 0) + "). Частичные суммы sₙ — обычные целые числа, s₈ = " + format(ps[8], 0) + "; в ℝ они не сходятся, а x − sₙ делится на pⁿ, то есть |x − sₙ|ₚ ≤ p⁻ⁿ → 0: **фундаментальная последовательность имеет предел**.\n\n";
  info = info + "Например, −1 = …(p−1)(p−1)(p−1): при a = −1, b = 1 все цифры равны p − 1.";
}
]
