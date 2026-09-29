[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = "";
float p1x = 99; float p1y = 99; float p2x = 99; float p2y = 99;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "one"; pos = (1, 0); text = true("1"); dynamic = false; collision = false }
new Point { name = "z1"; pos = (2, 1); text = true("z₁"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "z2"; pos = (0, 1.5); text = true("z₂"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "p"; pos = (-1.5, 3); text = true("z₁·z₂"); dynamic = false; collision = false; color = #22c55e }
new Line { name = "o1"; pos = (O, z1); interact = false; color = #3b82f6; thickness = 3 }
new Line { name = "o2"; pos = (O, z2); interact = false; color = #f59e0b; thickness = 3 }
new Line { name = "op"; pos = (O, p); interact = false; color = #22c55e; thickness = 3 }
draw Vector { name = "v1"; edge = "o1"; pos = 1; color = #3b82f6; thickness = 3 }
draw Vector { name = "v2"; edge = "o2"; pos = 1; color = #f59e0b; thickness = 3 }
draw Vector { name = "vp"; edge = "op"; pos = 1; color = #22c55e; thickness = 3 }

Function num(v) { if (v < 0) { return "−" + format(-v, 1); } return format(v, 1); }
Function num2(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Function term(v) { if (v < 0) { return " − " + format(-v, 1); } return " + " + format(v, 1); }
Function par(v) { if (v < 0) { return "(" + num(v) + ")"; } return num(v); }
Function cx(a, b) { return num(a) + term(b) + "i"; }
Function deg(a, b) { return atan2(b, a) * 57.29578; }

Update {
  float R = min(fieldMaxX, fieldMaxY);
  float r1 = hypot(z1.pos.x, z1.pos.y); float r2 = hypot(z2.pos.x, z2.pos.y);
  // модуль произведения |z₁|·|z₂| не должен выходить за поле: сдвинутая точка сжимается к началу координат
  if (r1 * r2 > R) {
    float m1 = abs(z1.pos.x - p1x) + abs(z1.pos.y - p1y);
    float m2 = abs(z2.pos.x - p2x) + abs(z2.pos.y - p2y);
    if (m1 >= m2) { float k = R / (r1 * r2); z1.pos.x = z1.pos.x * k; z1.pos.y = z1.pos.y * k; }
    else { float k = R / (r1 * r2); z2.pos.x = z2.pos.x * k; z2.pos.y = z2.pos.y * k; }
  }
  if (abs(z1.pos.x - p1x) > 0.00001 || abs(z1.pos.y - p1y) > 0.00001 || abs(z2.pos.x - p2x) > 0.00001 || abs(z2.pos.y - p2y) > 0.00001) {
    p1x = z1.pos.x; p1y = z1.pos.y; p2x = z2.pos.x; p2y = z2.pos.y;
    p.pos.x = p1x * p2x - p1y * p2y; p.pos.y = p1x * p2y + p1y * p2x;
  }
  float a = p1x; float b = p1y; float c = p2x; float d = p2y;
  float re = a * c - b * d; float im = a * d + b * c;
  info = "**Умножение комплексных чисел**: скобки раскрываются как у двучленов, а i² = −1: (a + bi)(c + di) = (ac − bd) + (ad + bc)i.\n\n";
  info = info + "z₁ = " + cx(a, b) + ", z₂ = " + cx(c, d) + ".\n\n";
  info = info + "Действительная часть: " + par(a) + "·" + par(c) + " − " + par(b) + "·" + par(d) + " = " + num2(re) + ". Мнимая часть: " + par(a) + "·" + par(d) + " + " + par(b) + "·" + par(c) + " = " + num2(im) + ".\n\n";
  info = info + "z₁·z₂ = " + num2(re) + term(im) + "i. Модули перемножаются: |z₁|·|z₂| = " + format(hypot(a, b), 2) + "·" + format(hypot(c, d), 2) + " = " + format(hypot(re, im), 2) + ", а аргументы складываются: " + num(deg(a, b)) + "° + " + num(deg(c, d)) + "° ≡ " + num(deg(re, im)) + "° (mod 360°). Перестановка сомножителей ничего не меняет, умножение на 1 не меняет число.";
}
]
