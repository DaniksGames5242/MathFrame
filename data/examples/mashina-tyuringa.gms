[
description = "{info}"

field width = 16;
field height = 7;
camera type = fixed;

// ---- Лента из 13 ячеек (символы 0, 1 и пробел «␣»), головка — подсвеченная ячейка ----
new Point { name = "TL"; pos = (-7.15, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "TR"; pos = (7.15, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "BL"; pos = (-7.15, -0.55); dynamic = false; collision = false; active = false }
new Point { name = "BR"; pos = (7.15, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "tapeTop"; pos = (TL, TR); interact = false }
new Line { name = "tapeBot"; pos = (BL, BR); interact = false }
new Point { name = "U0"; pos = (-7.15, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D0"; pos = (-7.15, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v0"; pos = (U0, D0); interact = false }
new Point { name = "U1"; pos = (-6.05, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D1"; pos = (-6.05, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v1"; pos = (U1, D1); interact = false }
new Point { name = "U2"; pos = (-4.95, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D2"; pos = (-4.95, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v2"; pos = (U2, D2); interact = false }
new Point { name = "U3"; pos = (-3.85, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D3"; pos = (-3.85, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v3"; pos = (U3, D3); interact = false }
new Point { name = "U4"; pos = (-2.75, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D4"; pos = (-2.75, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v4"; pos = (U4, D4); interact = false }
new Point { name = "U5"; pos = (-1.65, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D5"; pos = (-1.65, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v5"; pos = (U5, D5); interact = false }
new Point { name = "U6"; pos = (-0.55, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D6"; pos = (-0.55, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v6"; pos = (U6, D6); interact = false }
new Point { name = "U7"; pos = (0.55, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D7"; pos = (0.55, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v7"; pos = (U7, D7); interact = false }
new Point { name = "U8"; pos = (1.65, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D8"; pos = (1.65, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v8"; pos = (U8, D8); interact = false }
new Point { name = "U9"; pos = (2.75, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D9"; pos = (2.75, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v9"; pos = (U9, D9); interact = false }
new Point { name = "U10"; pos = (3.85, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D10"; pos = (3.85, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v10"; pos = (U10, D10); interact = false }
new Point { name = "U11"; pos = (4.95, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D11"; pos = (4.95, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v11"; pos = (U11, D11); interact = false }
new Point { name = "U12"; pos = (6.05, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D12"; pos = (6.05, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v12"; pos = (U12, D12); interact = false }
new Point { name = "U13"; pos = (7.15, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "D13"; pos = (7.15, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "v13"; pos = (U13, D13); interact = false }
draw Text { name = "c0"; pos = (-6.60, 0); text = sym(0); size = 1.5 }
draw Text { name = "c1"; pos = (-5.50, 0); text = sym(1); size = 1.5 }
draw Text { name = "c2"; pos = (-4.40, 0); text = sym(2); size = 1.5 }
draw Text { name = "c3"; pos = (-3.30, 0); text = sym(3); size = 1.5 }
draw Text { name = "c4"; pos = (-2.20, 0); text = sym(4); size = 1.5 }
draw Text { name = "c5"; pos = (-1.10, 0); text = sym(5); size = 1.5 }
draw Text { name = "c6"; pos = (0.00, 0); text = sym(6); size = 1.5 }
draw Text { name = "c7"; pos = (1.10, 0); text = sym(7); size = 1.5 }
draw Text { name = "c8"; pos = (2.20, 0); text = sym(8); size = 1.5 }
draw Text { name = "c9"; pos = (3.30, 0); text = sym(9); size = 1.5 }
draw Text { name = "c10"; pos = (4.40, 0); text = sym(10); size = 1.5 }
draw Text { name = "c11"; pos = (5.50, 0); text = sym(11); size = 1.5 }
draw Text { name = "c12"; pos = (6.60, 0); text = sym(12); size = 1.5 }
new Point { name = "H1"; pos = (-0.55, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "H2"; pos = (0.55, 0.55); dynamic = false; collision = false; active = false }
new Point { name = "H3"; pos = (0.55, -0.55); dynamic = false; collision = false; active = false }
new Point { name = "H4"; pos = (-0.55, -0.55); dynamic = false; collision = false; active = false }
new Line { name = "h12"; pos = (H1, H2); color = #f59e0b; thickness = 4; interact = false; layer = 30 }
new Line { name = "h23"; pos = (H2, H3); color = #f59e0b; thickness = 4; interact = false; layer = 30 }
new Line { name = "h34"; pos = (H3, H4); color = #f59e0b; thickness = 4; interact = false; layer = 30 }
new Line { name = "h41"; pos = (H4, H1); color = #f59e0b; thickness = 4; interact = false; layer = 30 }
new Figure { name = "head"; elements = (h12, h23, h34, h41); interact = false }
draw Filling { name = "headFill"; figure = "head"; color = #f59e0b; opacity = 0.18 }
draw Text { name = "hArrow"; pos = (hx(), -1.05); text = "▲"; color = #f59e0b; size = 1.3 }
draw Text { name = "hState"; pos = (hx(), -1.65); text = stName(st); color = #f59e0b; size = 1.4 }
draw Text { name = "rule"; pos = (0, 2.3); text = ruleText; size = 1.3; color = #22c55e }
draw Text { name = "steps"; pos = (0, -2.7); text = "шаг " + format(steps, 0); size = 1.1 }

new UI { name = "sP"; type = select; label = "программа"; variable = prog; options = ("inc", "add", "bb"); labels = ("двоичное +1", "сложение 3 + 2 в унарной записи", "усердный бобёр (2 состояния)"); default = "inc" }
new UI { name = "bStep"; type = button; label = "Шаг"; action = "cmd = 1" }
new UI { name = "bRun"; type = button; label = "Пуск / пауза"; action = "cmd = 2" }
new UI { name = "bReset"; type = button; label = "Сброс"; action = "cmd = 3" }

// ---- Логика ----
string prog = "inc";
string lastProg = "";
float cmd = 0;
float run = 0;
float lastT = 0;
float clicks = 0;
float hd = 0;
float st = 0;
float steps = 0;
float HALT = 9;
string ruleText = "";
string info = "";
string table = "";
// Лента: 0 — пробел, 1 — символ 0, 2 — символ 1
list tape = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

Function hx() { return (hd - 6) * 1.1; }
Function sym(k) { if (tape[k] == 1) { return "0"; } if (tape[k] == 2) { return "1"; } return ""; }
Function symName(v) { if (v == 1) { return "0"; } if (v == 2) { return "1"; } return "␣"; }
Function stName(s) {
  if (s == HALT) { return "стоп"; }
  if (prog == "bb") { if (s == 0) { return "A"; } return "B"; }
  if (s == 0) { return "q₀"; } if (s == 1) { return "q₁"; } return "q₂";
}
// Правило: код w·100 + (сдвиг + 1)·10 + новое состояние (сдвиг −1 — влево, 1 — вправо)
Function rule(s, v) {
  if (prog == "inc") {
    if (s == 0) { if (v == 0) { return 0 * 100 + 0 * 10 + 1; } return v * 100 + 2 * 10 + 0; }
    if (v == 2) { return 1 * 100 + 0 * 10 + 1; } return 2 * 100 + 1 * 10 + HALT;
  }
  if (prog == "add") {
    if (s == 0) { if (v == 2) { return 2 * 100 + 2 * 10 + 0; } return 2 * 100 + 2 * 10 + 1; }
    if (s == 1) { if (v == 2) { return 2 * 100 + 2 * 10 + 1; } return 0 * 100 + 0 * 10 + 2; }
    return 0 * 100 + 1 * 10 + HALT;
  }
  if (s == 0) { if (v == 0) { return 2 * 100 + 2 * 10 + 1; } return 2 * 100 + 0 * 10 + 1; }
  if (v == 0) { return 2 * 100 + 0 * 10 + 0; } return 2 * 100 + 2 * 10 + HALT;
}
Function mv(m) { if (m == 0) { return "L"; } if (m == 2) { return "R"; } return "N"; }
Function ruleStr(s, v) {
  float r = rule(s, v); float w = floor(r / 100); float m = floor(r / 10) - w * 10; float ns = r - w * 100 - m * 10;
  return "(" + stName(s) + ", " + symName(v) + ") → (" + symName(w) + ", " + mv(m) + ", " + stName(ns) + ")";
}
Function reset() {
  repeat (13) { tape[i] = 0; }
  if (prog == "inc") { tape[4] = 2; tape[5] = 1; tape[6] = 2; tape[7] = 2; hd = 4; }
  if (prog == "add") { tape[3] = 2; tape[4] = 2; tape[5] = 2; tape[7] = 2; tape[8] = 2; hd = 3; }
  if (prog == "bb") { hd = 6; }
  st = 0; steps = 0; run = 0;
  return 0;
}
Function step() {
  if (st == HALT) { run = 0; return 0; }
  float v = tape[hd]; float r = rule(st, v);
  float w = floor(r / 100); float m = floor(r / 10) - w * 10; float ns = r - w * 100 - m * 10;
  ruleText = ruleStr(st, v);
  tape[hd] = w; hd = hd + m - 1; st = ns; steps = steps + 1;
  if (hd < 0 || hd > 12) { hd = max(0, min(12, hd)); st = HALT; }
  if (st == HALT) { run = 0; }
  return 0;
}

Update {
  if (prog != lastProg) { reset(); ruleText = ""; lastProg = prog; }
  if (cmd == 1) { run = 0; step(); }
  if (cmd == 2) { if (st == HALT) { reset(); } run = 1 - run; lastT = time; }
  if (cmd == 3) { reset(); ruleText = ""; }
  cmd = 0;
  if (run == 1 && time - lastT > 0.5) { lastT = time; step(); }
  // Клик по ячейке меняет её символ: ␣ → 0 → 1 → ␣
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    if (abs(mouseClickY) < 0.55 && abs(mouseClickX) < 7.15) {
      float k = floor((mouseClickX + 7.15) / 1.1);
      tape[k] = tape[k] + 1; if (tape[k] > 2) { tape[k] = 0; }
    }
  }
  H1.pos.x = hx() - 0.55; H4.pos.x = hx() - 0.55; H2.pos.x = hx() + 0.55; H3.pos.x = hx() + 0.55;

  table = "";
  repeat (3) { float s = i; if (s < 2 || prog != "bb") { if (!(prog == "inc" && s == 2)) { repeat (3) { float v = i; if (!(prog != "inc" && v == 1)) {
    if (table != "") { table = table + ";   "; }
    string one = ruleStr(s, v);
    if (s == st && v == tape[hd]) { one = "**" + one + "**"; }
    table = table + one;
  } } } } }
  info = "**Машина Тьюринга** — абстрактный вычислитель: бесконечная лента из ячеек с символами, головка, которая читает одну ячейку, и конечный набор состояний. Программа — таблица правил (состояние, символ) → (что записать, куда сдвинуться: L/R/N, новое состояние); машина работает, пока не придёт в состояние «стоп».\n\n";
  if (prog == "inc") { info = info + "Программа прибавляет 1 к двоичному числу: q₀ идёт к правому краю числа, q₁ переносит единицу справа налево."; }
  if (prog == "add") { info = info + "Числа записаны единицами (3 = 111, 2 = 11) через пробел: машина заполняет пробел и стирает последнюю единицу — получается 11111 = 5."; }
  if (prog == "bb") { info = info + "«Усердный бобёр» — машина с двумя состояниями, которая пишет наибольшее возможное число единиц (4) и останавливается. Для n состояний это число растёт быстрее любой вычислимой функции."; }
  info = info + "\n\nПравила: " + table + ".\n\nКлик по ячейке меняет её символ.";
}
]
