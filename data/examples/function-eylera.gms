[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Числа 1…n по кругу: взаимно простые с n — синие, остальные — серые ----
draw Graph { name = "gCop"; graph = "gc"; nodeColor = #3b82f6; nodeRadius = 13; interactive = false; showWeights = false }
draw Graph { name = "gNot"; graph = "gn"; nodeColor = #6b7280; nodeRadius = 13; interactive = false; showWeights = false }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 2; max = 36; step = 1; default = 12 }

// ---- Логика ----
float n = 12;
float lastN = 0;
float phi = 0;
string info = "";

// Показатель степени верхним индексом
Function sup(e) {
  if (e == 2) { return "²"; } if (e == 3) { return "³"; } if (e == 4) { return "⁴"; } if (e == 5) { return "⁵"; }
  return "^" + format(e, 0);
}
Function gcd(a, b) {
  repeat (60) { if (b > 0) { float r = a - floor(a / b) * b; a = b; b = r; } }
  return a;
}
// Разложение n на простые множители и формула φ(n) = n·∏(1 − 1/p)
Function factorText() {
  string s = ""; string f = ""; float m = n; float p = 2;
  repeat (40) {
    if (m > 1 && p * p <= m) {
      if (m - floor(m / p) * p == 0) {
        float e = 0;
        repeat (8) { if (m - floor(m / p) * p == 0) { m = m / p; e = e + 1; } }
        if (s != "") { s = s + " · "; }
        s = s + format(p, 0); if (e > 1) { s = s + sup(e); }
        f = f + "(1 − 1/" + format(p, 0) + ")";
      }
      p = p + 1;
    }
  }
  if (m > 1) { if (s != "") { s = s + " · "; } s = s + format(m, 0); f = f + "(1 − 1/" + format(m, 0) + ")"; }
  return format(n, 0) + " = " + s + ", поэтому φ(" + format(n, 0) + ") = " + format(n, 0) + "·" + f;
}

Update {
  if (n != lastN) {
    gc = newGraph(); gn = newGraph(); phi = 0;
    float R = 3.5;
    if (n > 24) { R = 3.9; }
    repeat (n) {
      float k = i + 1;
      float ang = pi / 2 - 2 * pi * i / n;
      if (gcd(n, k) == 1) { addNode(gc, format(k, 0), [R * cos(ang), R * sin(ang)]); phi = phi + 1; }
      else { addNode(gn, format(k, 0), [R * cos(ang), R * sin(ang)]); }
    }
    lastN = n;
  }
  info = "**Функция Эйлера φ(n)** — количество чисел от 1 до n, взаимно простых с n (синие).\n\nφ(" + format(n, 0) + ") = " + format(phi, 0) + ".   " + factorText() + " = " + format(phi, 0) + ".";
  if (phi == n - 1) { info = info + " Все числа, кроме n, синие — n простое: φ(p) = p − 1."; }
}
]
