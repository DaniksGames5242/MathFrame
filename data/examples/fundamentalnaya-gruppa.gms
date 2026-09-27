[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Плоскость без двух точек H₁ и H₂. Петля с началом и концом в O — замкнутая ломаная,
// её вершины перетаскиваются. Пунктир — лучи вверх из выколотых точек: каждое пересечение
// луча записывает букву (a — для H₁, b — для H₂; справа налево — со степенью +1). ----
new Point { name = "H1"; pos = (-2.5, 0.5); text = true("H₁"); dynamic = false; collision = false; color = #ef4444; size = 1.1 }
new Point { name = "H2"; pos = (2.5, 0.5); text = true("H₂"); dynamic = false; collision = false; color = #ef4444; size = 1.1 }
new Point { name = "U1"; pos = (-2.5, 6); dynamic = false; collision = false; active = false }
new Point { name = "U2"; pos = (2.5, 6); dynamic = false; collision = false; active = false }
new Line { name = "ray1"; pos = (H1, U1); active = false }
new Line { name = "ray2"; pos = (H2, U2); active = false }
draw Punctir { name = "pr1"; edge = "ray1"; color = #ef4444; thickness = 1.5; layer = 2 }
draw Punctir { name = "pr2"; edge = "ray2"; color = #ef4444; thickness = 1.5; layer = 2 }
new Point { name = "O"; pos = (0, -3.8); text = true("O"); dynamic = false; collision = false; color = #22c55e; size = 1 }
new Point { name = "P1"; pos = (-1.2, -1); pauseOnDrag = false; size = 0.7 }
new Point { name = "P2"; pos = (-1.5, 2.2); pauseOnDrag = false; size = 0.7 }
new Point { name = "P3"; pos = (-3.8, 2.2); pauseOnDrag = false; size = 0.7 }
new Point { name = "P4"; pos = (-3.8, -1.2); pauseOnDrag = false; size = 0.7 }
new Point { name = "P5"; pos = (0, -1.2); pauseOnDrag = false; size = 0.7 }
new Point { name = "P6"; pos = (3.8, -1.2); pauseOnDrag = false; size = 0.7 }
new Point { name = "P7"; pos = (3.8, 2.2); pauseOnDrag = false; size = 0.7 }
new Point { name = "P8"; pos = (1.5, 2.2); pauseOnDrag = false; size = 0.7 }
new Point { name = "P9"; pos = (1.2, -1); pauseOnDrag = false; size = 0.7 }
new Point { name = "P10"; pos = (0.9, -2.2); pauseOnDrag = false; size = 0.7 }
new Point { name = "P11"; pos = (0.5, -3); pauseOnDrag = false; size = 0.7 }
new Line { name = "s0"; pos = (O, P1); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs0"; edge = "s0"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s1"; pos = (P1, P2); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs1"; edge = "s1"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s2"; pos = (P2, P3); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs2"; edge = "s2"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s3"; pos = (P3, P4); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs3"; edge = "s3"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s4"; pos = (P4, P5); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs4"; edge = "s4"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s5"; pos = (P5, P6); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs5"; edge = "s5"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s6"; pos = (P6, P7); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs6"; edge = "s6"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s7"; pos = (P7, P8); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs7"; edge = "s7"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s8"; pos = (P8, P9); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs8"; edge = "s8"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s9"; pos = (P9, P10); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs9"; edge = "s9"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s10"; pos = (P10, P11); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs10"; edge = "s10"; pos = 0; color = #3b82f6; thickness = 3 }
new Line { name = "s11"; pos = (P11, O); color = #3b82f6; thickness = 3; interact = false }
draw Vector { name = "vs11"; edge = "s11"; pos = 0; color = #3b82f6; thickness = 3 }

new UI { name = "sPr"; type = select; label = "петля"; variable = preset; options = ("ab", "comm", "a2"); labels = ("a·b", "a·b·a⁻¹·b⁻¹", "a²"); default = "ab" }

// ---- Логика ----
string preset = "ab";
string lastPreset = "";
string word = "";
float w1 = 0; float w2 = 0;
float sp = 0;
list stk = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
string info = "";

// Буква: ±1 — a^±1, ±2 — b^±1. Свободная редукция: x·x⁻¹ сокращается сразу.
Function pushL(c) {
  if (c == 1 || c == -1) { w1 = w1 + c; } else { w2 = w2 + c / 2; }
  if (sp > 0 && stk[sp - 1] == -c) { sp = sp - 1; return 0; }
  if (sp < 30) { stk[sp] = c; sp = sp + 1; }
  return 0;
}
// Пересечения отрезка (x1, y1)–(x2, y2) с лучами вверх из H₁ и H₂ — по порядку вдоль отрезка
Function seg(x1, y1, x2, y2) {
  float t1 = 2; float t2 = 2; float c1 = 0; float c2 = 0;
  if ((x1 - H1.pos.x) * (x2 - H1.pos.x) < 0) {
    float t = (H1.pos.x - x1) / (x2 - x1);
    if (y1 + t * (y2 - y1) > H1.pos.y) { t1 = t; c1 = 1; if (x2 > x1) { c1 = -1; } }
  }
  if ((x1 - H2.pos.x) * (x2 - H2.pos.x) < 0) {
    float t = (H2.pos.x - x1) / (x2 - x1);
    if (y1 + t * (y2 - y1) > H2.pos.y) { t2 = t; c2 = 2; if (x2 > x1) { c2 = -2; } }
  }
  if (t1 < t2) { if (c1 != 0) { pushL(c1); } if (c2 != 0) { pushL(c2); } }
  else { if (c2 != 0) { pushL(c2); } if (c1 != 0) { pushL(c1); } }
  return 0;
}
Function letter(c) { if (c == 1) { return "a"; } if (c == -1) { return "a⁻¹"; } if (c == 2) { return "b"; } return "b⁻¹"; }
Function sup(e) { if (e == 2) { return "²"; } if (e == 3) { return "³"; } if (e == 4) { return "⁴"; } return "^" + format(e, 0); }
// Вершина не может стоять в выколотой точке — отодвигаем
Function away(P) {
  float dx = P.pos.x - H1.pos.x; float dy = P.pos.y - H1.pos.y; float d = sqrt(dx * dx + dy * dy);
  if (d < 0.6) { if (d < 0.001) { dx = 1; dy = 0; d = 1; } P.pos.x = H1.pos.x + dx * 0.6 / d; P.pos.y = H1.pos.y + dy * 0.6 / d; }
  dx = P.pos.x - H2.pos.x; dy = P.pos.y - H2.pos.y; d = sqrt(dx * dx + dy * dy);
  if (d < 0.6) { if (d < 0.001) { dx = 1; dy = 0; d = 1; } P.pos.x = H2.pos.x + dx * 0.6 / d; P.pos.y = H2.pos.y + dy * 0.6 / d; }
  return 0;
}

Update {
  if (preset != lastPreset) {
  if (preset == "ab") { P1.pos.x = -1.2; P1.pos.y = -1; P2.pos.x = -1.5; P2.pos.y = 2.2; P3.pos.x = -3.8; P3.pos.y = 2.2; P4.pos.x = -3.8; P4.pos.y = -1.2; P5.pos.x = 0; P5.pos.y = -1.2; P6.pos.x = 3.8; P6.pos.y = -1.2; P7.pos.x = 3.8; P7.pos.y = 2.2; P8.pos.x = 1.5; P8.pos.y = 2.2; P9.pos.x = 1.2; P9.pos.y = -1; P10.pos.x = 0.9; P10.pos.y = -2.2; P11.pos.x = 0.5; P11.pos.y = -3; }
  if (preset == "comm") { P1.pos.x = -1.5; P1.pos.y = 2.5; P2.pos.x = -3.5; P2.pos.y = 2.5; P3.pos.x = -3.5; P3.pos.y = -1.5; P4.pos.x = 3.5; P4.pos.y = -1.5; P5.pos.x = 3.5; P5.pos.y = 3.2; P6.pos.x = 1.5; P6.pos.y = 3.2; P7.pos.x = 1.5; P7.pos.y = -2.5; P8.pos.x = -4.4; P8.pos.y = -2.5; P9.pos.x = -4.4; P9.pos.y = 4.2; P10.pos.x = 4.4; P10.pos.y = 4.2; P11.pos.x = 4.4; P11.pos.y = -3.2; }
  if (preset == "a2") { P1.pos.x = -1.3; P1.pos.y = -0.6; P2.pos.x = -1.3; P2.pos.y = 2; P3.pos.x = -3.7; P3.pos.y = 2; P4.pos.x = -3.7; P4.pos.y = -1; P5.pos.x = -1; P5.pos.y = -1.3; P6.pos.x = -0.8; P6.pos.y = 2.8; P7.pos.x = -4.3; P7.pos.y = 2.8; P8.pos.x = -4.3; P8.pos.y = -1.8; P9.pos.x = -1.8; P9.pos.y = -2.2; P10.pos.x = -0.9; P10.pos.y = -2.9; P11.pos.x = -0.4; P11.pos.y = -3.4; }
    lastPreset = preset;
  }
  away(P1); away(P2); away(P3); away(P4); away(P5); away(P6); away(P7); away(P8); away(P9); away(P10); away(P11);
  sp = 0; w1 = 0; w2 = 0;
  seg(O.pos.x, O.pos.y, P1.pos.x, P1.pos.y); seg(P1.pos.x, P1.pos.y, P2.pos.x, P2.pos.y); seg(P2.pos.x, P2.pos.y, P3.pos.x, P3.pos.y);
  seg(P3.pos.x, P3.pos.y, P4.pos.x, P4.pos.y); seg(P4.pos.x, P4.pos.y, P5.pos.x, P5.pos.y); seg(P5.pos.x, P5.pos.y, P6.pos.x, P6.pos.y);
  seg(P6.pos.x, P6.pos.y, P7.pos.x, P7.pos.y); seg(P7.pos.x, P7.pos.y, P8.pos.x, P8.pos.y); seg(P8.pos.x, P8.pos.y, P9.pos.x, P9.pos.y);
  seg(P9.pos.x, P9.pos.y, P10.pos.x, P10.pos.y); seg(P10.pos.x, P10.pos.y, P11.pos.x, P11.pos.y); seg(P11.pos.x, P11.pos.y, O.pos.x, O.pos.y);
  // Слово: одинаковые буквы подряд — степенью
  word = ""; float k = 0;
  repeat (sp) {
    float j = i;
    if (j >= k) {
      float c = stk[j]; float e = 1;
      repeat (30) { if (j + e < sp && stk[j + e] == c) { e = e + 1; } }
      if (word != "") { word = word + "·"; }
      if (c > 0) { word = word + letter(c); if (e > 1) { word = word + sup(e); } }
      else { if (c == -1) { word = word + "a"; } else { word = word + "b"; } if (e > 1) { word = word + sup(-e); } else { word = word + "⁻¹"; } }
      k = j + e;
    }
  }
  info = "**Фундаментальная группа** π₁(X, O) — множество классов петель с началом и концом в точке O, где петли, переводимые друг в друга непрерывной деформацией (гомотопией) с закреплённым O, считаются одинаковыми; операция — прохождение петель друг за другом. Для плоскости без двух точек это свободная группа с двумя образующими: a — обход H₁ против часовой стрелки, b — обход H₂.\n\nКласс петли: ";
  if (sp == 0) { info = info + "**e** (тождественный элемент) — петлю можно стянуть в точку O."; }
  else { info = info + "**" + word + "**."; }
  info = info + "   Число оборотов вокруг H₁: " + format(w1, 0) + ", вокруг H₂: " + format(w2, 0) + ".";
  if (sp > 0 && w1 == 0 && w2 == 0) { info = info + " Числа оборотов нулевые, но петля не стягивается: группа некоммутативна, ab ≠ ba."; }
  info = info + "\n\nПока вершины двигаются, не задевая H₁ и H₂, петля деформируется непрерывно, и класс не меняется; меняется он, только когда отрезок перескакивает через выколотую точку.";
}
]
