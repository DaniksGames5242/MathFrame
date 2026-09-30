[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Для каждой подходящей дроби hₖ/kₖ числа √D столбик показывает hₖ² − D·kₖ². Решение
// уравнения Пелля — первый зелёный столбик (значение +1); жёлтые — значение −1. ----
draw Graph { name = "gB"; graph = "gb"; edgeWidth = 8; edgeCap = butt; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; edgeColor = #3b82f688; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }

new UI { type = slider; label = "D"; variable = Dk; min = 2; max = 60; step = 1; default = 13 }
new UI { type = slider; label = "подходящих дробей"; variable = N; min = 2; max = 24; step = 1; default = 24 }

float Dk = 13; float D = 13; float N = 24; float key = -1; string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function px(k) { return -6.9 + 0.6 * k; }
// значение hₖ² − D·kₖ² = (−1)^(k+1)·d_(k+1), d — из алгоритма разложения √D
Function vk(k) {
  float a0 = floor(sqrt(D)); float m = 0; float d = 1; float a = a0;
  repeat (k + 1) { m = d * a - m; d = (D - m * m) / d; a = floor((a0 + m) / d); }
  if (k - 2 * floor(k / 2) == 0) { return -d; }
  return d;
}
// f = 0: x₁, f = 1: y₁, f = 2: длина периода
Function fund(f) {
  float a0 = floor(sqrt(D)); float m = 0; float d = 1; float a = a0;
  float h1 = 1; float k1 = 0; float h = a0; float kk = 1; float per = 0; float done = 0; float rx = 0; float ry = 0;
  repeat (60) {
    if (done < 1) {
      per = per + 1;
      m = d * a - m; d = (D - m * m) / d; a = floor((a0 + m) / d);
      float sgn = 1; if (per - 2 * floor(per / 2) == 1) { sgn = -1; }
      if (d == 1 && sgn > 0 && rx == 0) { rx = h; ry = kk; }
      if (d == 1 && rx > 0) { done = 1; }
      if (done < 1) { float t = a * h + h1; h1 = h; h = t; t = a * kk + k1; k1 = kk; kk = t; }
    }
  }
  if (f == 0) { return rx; } if (f == 1) { return ry; } return per;
}
Function plen() {
  float a0 = floor(sqrt(D)); float m = 0; float d = 1; float a = a0; float p = 0; float done = 0;
  repeat (60) { if (done < 1) { m = d * a - m; d = (D - m * m) / d; a = floor((a0 + m) / d); p = p + 1; if (a == 2 * a0) { done = 1; } } }
  return p;
}
Function cf() {
  float a0 = floor(sqrt(D)); float m = 0; float d = 1; float a = a0; float p = plen(); string s = "[" + format(a0, 0) + "; (";
  repeat (p) { m = d * a - m; d = (D - m * m) / d; a = floor((a0 + m) / d); s = s + format(a, 0); if (i < p - 1) { s = s + ", "; } }
  return s + ")]";
}

Update {
  float r = floor(sqrt(Dk)); D = Dk; if (r * r == Dk) { D = Dk + 1; }
  if (key != D * 100 + N) {
    gb = newGraph(); ga = newGraph();
    addNode(ga, "z1", [-7.4, -0.2]); addNode(ga, "z2", [7.4, -0.2]); addEdge(ga, "z1", "z2");
    repeat (N) {
      float v = vk(i); string col = "#3b82f6";
      if (v == 1) { col = "#22c55e"; } if (v == -1) { col = "#f59e0b"; }
      addNode(gb, "p" + format(i, 0), [px(i), -0.2]); addNode(gb, "q" + format(i, 0), [px(i), -0.2 + 0.27 * v]);
      addEdge(gb, "p" + format(i, 0), "q" + format(i, 0), 1, col);
    }
    key = D * 100 + N;
  }
  float x1 = fund(0); float y1 = fund(1); float p = plen();
  info = "**Уравнение Пелля x² − D·y² = 1**, D = **" + format(D, 0) + "**";
  if (D != Dk) { info = info + " (при D = " + format(Dk, 0) + " — полном квадрате — решений, кроме тривиальных, нет, поэтому взято следующее число)"; }
  info = info + ". Разложение √D = " + cf() + ", период " + format(p, 0) + ".\n\n";
  info = info + "Минимальное решение — подходящая дробь x₁/y₁ = **" + format(x1, 0) + "/" + format(y1, 0) + "**: " + format(x1, 0) + "² − " + format(D, 0) + "·" + format(y1, 0) + "² = 1. ";
  if (x1 < 1000000) { info = info + "Следующие решения — степени (x₁ + y₁√D)ⁿ: (" + format(x1 * x1 + D * y1 * y1, 0) + ", " + format(2 * x1 * y1, 0) + "), … — их бесконечно много. "; }
  if (p - 2 * floor(p / 2) == 1) { info = info + "Период нечётный — разрешимо и уравнение x² − D·y² = −1 (жёлтый столбик)."; }
  if (p - 2 * floor(p / 2) == 0) { info = info + "Период чётный — уравнение x² − D·y² = −1 неразрешимо (жёлтых столбиков нет)."; }
}
]
