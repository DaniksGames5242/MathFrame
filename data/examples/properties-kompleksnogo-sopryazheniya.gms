[
description = "{info}"
field width = 16; field height = 10;
camera type = fixed;
show axes = true; show grid = true;
string info = ""; string op = "add";
float p1x = 99; float p1y = 99; float p2x = 99; float p2y = 99; float prev = 0;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "z1"; pos = (2, 1); text = true("z₁"); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "z2"; pos = (-1, 2); text = true("z₂"); pauseOnDrag = false; collideWithPoints = false; color = #f59e0b }
new Point { name = "c1"; pos = (2, -1); text = true("z̄₁"); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "c2"; pos = (-1, -2); text = true("z̄₂"); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "r"; pos = (1, 3); text = true("z₁ ∘ z₂"); dynamic = false; collision = false; color = #22c55e }
new Point { name = "rc"; pos = (1, -3); text = true("(z₁ ∘ z₂)‾ = z̄₁ ∘ z̄₂"); dynamic = false; collision = false; color = #22c55e }
new Point { name = "rr"; pos = (1, -3); dynamic = false; collision = false; color = #f59e0b; layer = 5 }
new Line { name = "l1"; pos = (z1, c1); interact = false }
new Line { name = "l2"; pos = (z2, c2); interact = false }
new Line { name = "lr"; pos = (r, rc); interact = false; color = #22c55e }
new UI { name = "sO"; type = select; label = "операция ∘"; variable = op; options = ("add", "sub", "mul", "div"); labels = ("z₁ + z₂", "z₁ − z₂", "z₁ · z₂", "z₁ / z₂"); default = "add" }

Function num(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Function term(v) { if (v < 0) { return " − " + format(-v, 2); } return " + " + format(v, 2); }
Function cx(a, b) { return num(a) + term(b) + "i"; }
Function cl(v, lo, hi) { return max(lo, min(hi, v)); }
Function re(x1, y1, x2, y2) {
  if (op == "add") { return x1 + x2; } if (op == "sub") { return x1 - x2; }
  if (op == "mul") { return x1 * x2 - y1 * y2; }
  return (x1 * x2 + y1 * y2) / (x2 * x2 + y2 * y2);
}
Function im(x1, y1, x2, y2) {
  if (op == "add") { return y1 + y2; } if (op == "sub") { return y1 - y2; }
  if (op == "mul") { return x1 * y2 + y1 * x2; }
  return (y1 * x2 - x1 * y2) / (x2 * x2 + y2 * y2);
}
Function sym() { if (op == "add") { return "+"; } if (op == "sub") { return "−"; } if (op == "mul") { return "·"; } return "/"; }
Function isDiv() { if (op == "div") { return 1; } return 0; }
Function isMul() { if (op == "mul" || op == "div") { return 1; } return 0; }

Update {
  float Lx = fieldMaxX - 0.3; float Ly = fieldMaxY - 0.3; float R = min(Lx, Ly);
  float r1 = hypot(z1.pos.x, z1.pos.y); float r2 = hypot(z2.pos.x, z2.pos.y);
  float m1 = abs(z1.pos.x - p1x) + abs(z1.pos.y - p1y);
  float m2 = abs(z2.pos.x - p2x) + abs(z2.pos.y - p2y);
  // результат операции остаётся в поле
  if (isMul() == 0) {
    if (m1 >= m2) {
      float sg = 1; if (op == "sub") { sg = -1; }
      float nx = cl(z1.pos.x, -Lx - sg * z2.pos.x, Lx - sg * z2.pos.x); float ny = cl(z1.pos.y, -Ly - sg * z2.pos.y, Ly - sg * z2.pos.y);
      if (nx != z1.pos.x) { z1.pos.x = nx; } if (ny != z1.pos.y) { z1.pos.y = ny; }
    } else {
      float nx = cl(z2.pos.x, -Lx - z1.pos.x, Lx - z1.pos.x); float ny = cl(z2.pos.y, -Ly - z1.pos.y, Ly - z1.pos.y);
      if (op == "sub") { nx = cl(z2.pos.x, z1.pos.x - Lx, z1.pos.x + Lx); ny = cl(z2.pos.y, z1.pos.y - Ly, z1.pos.y + Ly); }
      if (nx != z2.pos.x) { z2.pos.x = nx; } if (ny != z2.pos.y) { z2.pos.y = ny; }
    }
  } else {
    if (isDiv() == 1 && r2 < 0.8) {
      if (r2 < 0.001) { z2.pos.x = 0.8; z2.pos.y = 0; } else { float k = 0.8 / r2; z2.pos.x = z2.pos.x * k; z2.pos.y = z2.pos.y * k; }
      r2 = 0.8;
    }
    float big = r1 * r2; if (isDiv() == 1) { big = max(r1 * r2, r1 / r2); }
    if (big > R) {
      if (m1 >= m2) { float t = R / r2; if (isDiv() == 1) { t = min(R / r2, R * r2); } float k = t / r1; z1.pos.x = z1.pos.x * k; z1.pos.y = z1.pos.y * k; }
      else {
        float t = R / r1; if (isDiv() == 1 && r1 > R * r2) { t = r1 / R; }
        float k = t / r2; z2.pos.x = z2.pos.x * k; z2.pos.y = z2.pos.y * k;
      }
    }
  }
  float chg = 0; if (op == "add") { chg = 1; } if (op == "sub") { chg = 2; } if (op == "mul") { chg = 3; } if (op == "div") { chg = 4; }
  if (abs(z1.pos.x - p1x) > 0.00001 || abs(z1.pos.y - p1y) > 0.00001 || abs(z2.pos.x - p2x) > 0.00001 || abs(z2.pos.y - p2y) > 0.00001 || chg != prev) {
    prev = chg;
    p1x = z1.pos.x; p1y = z1.pos.y; p2x = z2.pos.x; p2y = z2.pos.y;
    c1.pos.x = p1x; c1.pos.y = -p1y; c2.pos.x = p2x; c2.pos.y = -p2y;
    r.pos.x = re(p1x, p1y, p2x, p2y); r.pos.y = im(p1x, p1y, p2x, p2y);
    rc.pos.x = r.pos.x; rc.pos.y = -r.pos.y;
    rr.pos.x = re(p1x, -p1y, p2x, -p2y); rr.pos.y = im(p1x, -p1y, p2x, -p2y);
  }
  float a = p1x; float b = p1y; float c = p2x; float d = p2y;
  float ex = re(a, b, c, d); float ey = im(a, b, c, d);
  float fx = re(a, -b, c, -d); float fy = im(a, -b, c, -d);
  string s = sym();
  info = "**Сопряжение** z ↦ z̄ (отражение в действительной оси) сохраняет операции: сопряжение результата равно результату над сопряжёнными числами. (z₁ " + s + " z₂)‾ = z̄₁ " + s + " z̄₂; для разности и частного (при z₂ ≠ 0) — то же самое.\n\n";
  info = info + "z₁ = " + cx(a, b) + ", z₂ = " + cx(c, d) + ".\n\n";
  info = info + "z₁ " + s + " z₂ = " + cx(ex, ey) + ", его сопряжённое: " + cx(ex, -ey) + ".\n\n";
  info = info + "z̄₁ " + s + " z̄₂ = " + cx(fx, fy) + " — то же число: зелёная и оранжевая точки внизу совпадают. Сопряжение действительного числа даёт его само, а двойное сопряжение возвращает исходное: z̄̄ = z.";
}
]
