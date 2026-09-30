[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Поле K = ℚ(√d). Узлы решётки — целые элементы K (корни приведённых многочленов с целыми
// коэффициентами). Синие — ℤ[√d], жёлтые — целые элементы, не лежащие в ℤ[√d] (при d ≡ 1 mod 4).
// d < 0: узел u + v√d стоит в точке (u, v√|d|); d > 0: в точке (σ₁, σ₂) = (u + v√d, u − v√d). ----
draw Graph { name = "gAx"; graph = "gx"; edgeColor = #3b82f6; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #3b82f6; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gY"; graph = "gy"; nodeColor = #f59e0b; nodeRadius = 5; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Text { name = "tX"; pos = (9.2, -0.6); text = axX; size = 0.9; align = right }
draw Text { name = "tY"; pos = (0.4, 5.3); text = axY; size = 0.9; align = left }
new Point { name = "Pi"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = isInt > 0.5; layer = 20 }
new Point { name = "Pn"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b; active = isInt < 0.5; layer = 20 }

new UI { name = "sD"; type = select; label = "d"; variable = d; options = (-7, -5, -3, -2, -1, 2, 3, 5, 6, 7); labels = ("−7", "−5", "−3", "−2", "−1", "2", "3", "5", "6", "7"); default = 5 }
new UI { name = "sU"; type = slider; label = "u"; variable = u; min = -2; max = 2; step = 0.5; default = 0.5 }
new UI { name = "sV"; type = slider; label = "v"; variable = v; min = -2; max = 2; step = 0.5; default = 0.5 }

float d = 5; float u = 0.5; float v = 0.5; float key = -1; float kd = 99; float isInt = 1;
string axX = "Re"; string axY = "Im"; string info = "";

Function num(x, dd) { if (x < -0.00001) { return "−" + format(-x, dd); } return format(abs(x), dd); }
Function px(a, b) { if (d < 0) { return a; } return a + b * sqrt(d); }
Function py(a, b) { if (d < 0) { return b * sqrt(-d); } return a - b * sqrt(d); }
Function isI(x) { return abs(x - round(x)) < 0.000001; }
Function mod4(x) { return x - 4 * floor(x / 4); }
Function fr(x) { if (isI(x)) { return num(x, 0); } return num(x, 1); }
Function poly(t, n) {
  string s = "x²";
  if (t > 0.00001) { s = s + " − " + (t == 1 ? "" : "") + fr(t) + "x"; }
  if (t < -0.00001) { s = s + " + " + fr(-t) + "x"; }
  if (n > 0.00001) { s = s + " + " + fr(n); }
  if (n < -0.00001) { s = s + " − " + fr(-n); }
  return s;
}

Update {
  if (key < 0) {
    gx = newGraph();
    addNode(gx, "a1", [-9.5, 0]); addNode(gx, "a2", [9.5, 0]); addEdge(gx, "a1", "a2");
    addNode(gx, "b1", [0, -5.5]); addNode(gx, "b2", [0, 5.5]); addEdge(gx, "b1", "b2");
    key = 0;
  }
  if (kd != d) {
    kd = d;
    gb = newGraph(); gy = newGraph();
    float ext = 0; if (mod4(d) == 1) { ext = 1; }
    if (d < 0) { axX = "Re"; axY = "Im"; }
    if (d > 0) { axX = "σ₁"; axY = "σ₂"; }
    float n1 = 0; float n2 = 0;
    repeat (33) {
      float A = i - 16;
      float i1 = i;
      repeat (33) {
        float B = i - 16;
        float x = px(A / 2, B / 2); float y = py(A / 2, B / 2);
        if (abs(x) < 9.3 && abs(y) < 5.4) {
          if (isI(A / 2) && isI(B / 2)) { n1 = n1 + 1; addNode(gb, "n" + format(n1, 0), [x, y]); }
          if (ext == 1 && !isI(A / 2) && !isI(B / 2)) { n2 = n2 + 1; addNode(gy, "m" + format(n2, 0), [x, y]); }
        }
      }
    }
    key = 1;
  }
  float k2 = d * 1000 + (u + 5) * 20 + (v + 5) * 2;
  if (k2 != key + 0.5 * 0 && k2 != kk) {
    kk = k2;
    Pi.pos.x = px(u, v); Pi.pos.y = py(u, v); Pn.pos.x = px(u, v); Pn.pos.y = py(u, v);
    float t = 2 * u; float nn = u * u - d * v * v;
    if (v == 0) { isInt = 0; if (isI(u)) { isInt = 1; } }
    if (v != 0) { isInt = 0; if (isI(t) && isI(nn)) { isInt = 1; } }
    string s = "**Кольцо целых** поля K = ℚ(√" + num(d, 0) + ") — множество элементов K, являющихся корнями приведённых многочленов с целыми коэффициентами. ";
    if (mod4(d) == 1) { s = s + "Так как d ≡ 1 (mod 4), это ℤ[ω], ω = (1 + √" + num(d, 0) + ")/2: жёлтые узлы не лежат в ℤ[√" + num(d, 0) + "]. Дискриминант поля равен " + num(d, 0) + ".\n\n"; }
    if (mod4(d) != 1) { s = s + "Так как d ≢ 1 (mod 4), это ℤ[√" + num(d, 0) + "]. Дискриминант поля равен " + num(4 * d, 0) + ".\n\n"; }
    s = s + "Как аддитивная группа оно свободно ранга 2 = [K : ℚ] — узлы образуют решётку.\n\n";
    if (v == 0) {
      s = s + "α = " + num(u, 1) + " рационально: его минимальный многочлен x − (" + num(u, 1) + ")" + (isInt == 1 ? " — целое число, α целое." : " — не с целыми коэффициентами, α не целое.");
    }
    if (v != 0) {
      s = s + "α = " + num(u, 1) + (v < 0 ? " − " : " + ") + num(abs(v), 1) + "·√" + num(d, 0) + ", след " + num(t, 1) + ", норма " + num(nn, 2) + ", минимальный многочлен " + poly(t, nn) + ".";
      if (isInt == 1) { s = s + " Коэффициенты целые — α **целое** (зелёная точка)."; }
      if (isInt == 0) { s = s + " Коэффициенты не целые — α **не целое** (красная точка)."; }
    }
    info = s;
  }
}
float kk = -1;
]
