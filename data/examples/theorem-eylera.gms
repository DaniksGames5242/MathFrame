[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Остатки 0…m−1 по кругу. Синие узлы — обратимые остатки (взаимно простые с m), их φ(m).
// «Степени a»: жёлтая цепочка 1 → a → a² → … замыкается в единице. «Умножение на a»: стрелки x → a·x переставляют обратимые остатки. ----
draw Graph { name = "gE"; graph = "ge"; nodeColor = #3b82f6; nodeRadius = 13; labels = false; directed = true; edgeWidth = 2; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gN"; graph = "gn"; nodeColor = #3b82f6; nodeRadius = 13; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gI"; graph = "gi"; nodeColor = #3b82f6; nodeRadius = 13; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gO"; graph = "go"; nodeColor = #f59e0b; nodeRadius = 13; interactive = false; showWeights = false; layer = 7 }

new UI { name = "sV"; type = select; label = "показать"; variable = view; options = ("pow", "perm"); labels = ("степени a: 1 → a → a² → …", "умножение на a: x → a·x"); default = "pow" }
new UI { name = "sM"; type = slider; label = "модуль m"; variable = m; min = 2; max = 30; step = 1; default = 14 }
new UI { name = "sA"; type = slider; label = "a"; variable = a; min = 1; max = 60; step = 1; default = 3 }

// ---- Логика ----
string view = "pow"; float m = 14; float a = 3; float key = -1;
string info = "";

Function md(x, y) { return x - floor(x / y) * y; }
Function gd(x, y) { float u = abs(x); float v = abs(y); repeat (40) { if (v > 0) { float r = u - floor(u / v) * v; u = v; v = r; } } return u; }
Function sd(e) { if (e == 0) { return "⁰"; } if (e == 1) { return "¹"; } if (e == 2) { return "²"; } if (e == 3) { return "³"; } if (e == 4) { return "⁴"; } if (e == 5) { return "⁵"; } if (e == 6) { return "⁶"; } if (e == 7) { return "⁷"; } if (e == 8) { return "⁸"; } return "⁹"; }
Function sup(e) { if (e < 10) { return sd(e); } return sd(floor(e / 10)) + sd(md(e, 10)); }
Function phi(n) { float c = 0; repeat (n) { if (gd(n, i + 1) == 1) { c = c + 1; } } return c; }
Function pm(x, e) { float r = 1; repeat (e) { r = md(r * md(x, m), m); } return md(r, m); }
Function seen(t, v) { float cur = 1; float f = 0; repeat (t + 1) { if (cur == v) { f = 1; } cur = md(cur * a, m); } return f; }
Function cx(t) { return 3.9 * sin(2 * pi * t / m); }
Function cy(t) { return 3.9 * cos(2 * pi * t / m); }

Update {
  float kk = m * 1000 + a;
  if (view == "perm") { kk = kk + 0.25; }
  if (kk != key) {
    key = kk;
    ge = newGraph(); gn = newGraph(); gi = newGraph(); go = newGraph();
    repeat (m) { addNode(ge, "e" + format(i, 0), [cx(i), cy(i)]); }
    repeat (m) {
      float x = i;
      if (gd(x, m) == 1) { addNode(gi, "n" + format(x, 0), [cx(x), cy(x)], format(x, 0)); }
      else { addNode(gn, "n" + format(x, 0), [cx(x), cy(x)], format(x, 0)); }
    }
    if (view == "pow") {
      float cur = 1; float going = 1;
      repeat (m + 1) {
        if (going == 1) {
          float nx = md(cur * a, m);
          addNode(go, "o" + format(cur, 0), [cx(cur), cy(cur)], format(cur, 0));
          if (nx != cur) { addEdge(ge, "e" + format(cur, 0), "e" + format(nx, 0), 1, "#f59e0b"); }
          if (seen(i, nx) == 1) { going = 0; }
          cur = nx;
        }
      }
    } else {
      repeat (m) {
        float x = i;
        if (gd(x, m) == 1) {
          float y = md(a * x, m);
          if (y != x) { addEdge(ge, "e" + format(x, 0), "e" + format(y, 0), 1, "#3b82f6"); }
        }
      }
    }
  }
  float ph = phi(m); float cop = gd(a, m);
  float aph = pm(a, ph);
  info = "**Теорема Эйлера:** если a взаимно просто с m, то a^φ(m) ≡ 1 (mod m). Здесь m = **" + format(m, 0) + "**, φ(" + format(m, 0) + ") = **" + format(ph, 0) + "** — число синих узлов (остатков, взаимно простых с m).\n\n";
  if (view == "pow") {
    string s = "1"; float cur = 1; float go2 = 1; float d = 0;
    repeat (m + 1) {
      if (go2 == 1) {
        float nx = md(cur * a, m); d = d + 1;
        s = s + " → " + format(nx, 0);
        if (seen(i, nx) == 1) { go2 = 0; }
        cur = nx;
      }
    }
    if (cop == 1) {
      info = info + "**a = " + format(a, 0) + ", НОД(a, m) = 1.** Степени a по модулю m: " + s + ". Цепочка вернулась в 1 за d = " + format(d, 0) + " шагов (порядок a), и d делит φ(m): " + format(ph, 0) + " = " + format(ph / d, 0) + "·" + format(d, 0) + ". Поэтому a" + sup(ph) + " ≡ " + format(aph, 0) + " (mod " + format(m, 0) + ").";
    } else {
      info = info + "**a = " + format(a, 0) + ", НОД(a, m) = " + format(cop, 0) + " > 1.** Условие теоремы нарушено: степени a по модулю m — " + s + " — в единицу не возвращаются, и a" + sup(ph) + " ≡ " + format(aph, 0) + " ≢ 1.";
    }
  } else {
    float P = 1; float Q = 1;
    repeat (m) { float x = i; if (gd(x, m) == 1) { P = md(P * x, m); Q = md(Q * md(a * x, m), m); } }
    if (cop == 1) {
      info = info + "**a = " + format(a, 0) + ", НОД(a, m) = 1.** Умножение на a переставляет обратимые остатки: каждый синий узел получает ровно одну стрелку. Произведение всех обратимых остатков P ≡ " + format(P, 0) + "; после умножения каждого на a получаются те же остатки в другом порядке, произведение снова ≡ " + format(Q, 0) + ". Но оно равно a" + sup(ph) + "·P ≡ " + format(aph, 0) + "·" + format(P, 0) + ", а P обратимо и сокращается: a" + sup(ph) + " ≡ 1.";
    } else {
      info = info + "**a = " + format(a, 0) + ", НОД(a, m) = " + format(cop, 0) + " > 1.** Умножение на a уже не переставляет обратимые остатки: стрелки уходят в серые узлы и сливаются, и a" + sup(ph) + " ≡ " + format(aph, 0) + " ≢ 1 — теорема к такому a неприменима.";
    }
  }
}
]
