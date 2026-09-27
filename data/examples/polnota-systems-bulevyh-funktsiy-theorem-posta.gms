[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Таблица Поста: строки — выбранные функции, столбцы — пять замкнутых классов.
// Серая точка — функция лежит в классе, оранжевая — не лежит. Нижняя строка: зелёная
// галочка, если хоть одна функция системы выходит из класса. ----
draw Graph { name = "gIn"; graph = "gi"; nodeColor = #6b7280; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gOut"; graph = "go"; nodeColor = #f59e0b; nodeRadius = 13; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gOk"; graph = "gk"; nodeColor = #22c55e; nodeRadius = 15; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gBad"; graph = "gb"; nodeColor = #ef4444; nodeRadius = 15; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "ch0"; pos = (cx(0), ry(-1) + 0.1); text = "T₀"; size = 1.3 }
draw Text { name = "cv0"; pos = (cx(0), ry(nSel) - 0.05); text = verd(0); size = 1.2; layer = 20 }
draw Text { name = "ch1"; pos = (cx(1), ry(-1) + 0.1); text = "T₁"; size = 1.3 }
draw Text { name = "cv1"; pos = (cx(1), ry(nSel) - 0.05); text = verd(1); size = 1.2; layer = 20 }
draw Text { name = "ch2"; pos = (cx(2), ry(-1) + 0.1); text = "S"; size = 1.3 }
draw Text { name = "cv2"; pos = (cx(2), ry(nSel) - 0.05); text = verd(2); size = 1.2; layer = 20 }
draw Text { name = "ch3"; pos = (cx(3), ry(-1) + 0.1); text = "M"; size = 1.3 }
draw Text { name = "cv3"; pos = (cx(3), ry(nSel) - 0.05); text = verd(3); size = 1.2; layer = 20 }
draw Text { name = "ch4"; pos = (cx(4), ry(-1) + 0.1); text = "L"; size = 1.3 }
draw Text { name = "cv4"; pos = (cx(4), ry(nSel) - 0.05); text = verd(4); size = 1.2; layer = 20 }
draw Text { name = "rn0"; pos = (-3.6, ry(0)); text = rname(0); size = 1.1; active = 0 < nSel }
draw Text { name = "rn1"; pos = (-3.6, ry(1)); text = rname(1); size = 1.1; active = 1 < nSel }
draw Text { name = "rn2"; pos = (-3.6, ry(2)); text = rname(2); size = 1.1; active = 2 < nSel }
draw Text { name = "rn3"; pos = (-3.6, ry(3)); text = rname(3); size = 1.1; active = 3 < nSel }
draw Text { name = "rn4"; pos = (-3.6, ry(4)); text = rname(4); size = 1.1; active = 4 < nSel }
draw Text { name = "rn5"; pos = (-3.6, ry(5)); text = rname(5); size = 1.1; active = 5 < nSel }
draw Text { name = "rn6"; pos = (-3.6, ry(6)); text = rname(6); size = 1.1; active = 6 < nSel }
draw Text { name = "rn7"; pos = (-3.6, ry(7)); text = rname(7); size = 1.1; active = 7 < nSel }
draw Text { name = "rn8"; pos = (-3.6, ry(8)); text = rname(8); size = 1.1; active = 8 < nSel }
draw Text { name = "rn9"; pos = (-3.6, ry(9)); text = rname(9); size = 1.1; active = 9 < nSel }
draw Text { name = "rn10"; pos = (-3.6, ry(10)); text = rname(10); size = 1.1; active = 10 < nSel }
draw Text { name = "rsys"; pos = (-3.6, ry(nSel) - 0.05); text = "система"; size = 1.1; color = #6b7280 }

new UI { name = "t_neg"; type = toggle; label = "¬x"; variable = u_neg; default = false }
new UI { name = "t_and"; type = toggle; label = "x ∧ y"; variable = u_and; default = true }
new UI { name = "t_or"; type = toggle; label = "x ∨ y"; variable = u_or; default = true }
new UI { name = "t_xor"; type = toggle; label = "x ⊕ y"; variable = u_xor; default = false }
new UI { name = "t_imp"; type = toggle; label = "x → y"; variable = u_imp; default = false }
new UI { name = "t_eq"; type = toggle; label = "x ↔ y"; variable = u_eq; default = false }
new UI { name = "t_pierce"; type = toggle; label = "x ↓ y"; variable = u_pierce; default = false }
new UI { name = "t_sheffer"; type = toggle; label = "x | y"; variable = u_sheffer; default = false }
new UI { name = "t_c0"; type = toggle; label = "0"; variable = u_c0; default = false }
new UI { name = "t_c1"; type = toggle; label = "1"; variable = u_c1; default = false }
new UI { name = "t_maj"; type = toggle; label = "maj(x, y, z)"; variable = u_maj; default = false }

// ---- Логика ----
bool u_neg = false;
bool u_and = true;
bool u_or = true;
bool u_xor = false;
bool u_imp = false;
bool u_eq = false;
bool u_pierce = false;
bool u_sheffer = false;
bool u_c0 = false;
bool u_c1 = false;
bool u_maj = false;
float nSel = 0;
list sel = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list bad = (0, 0, 0, 0, 0);
string info = "";

// Принадлежность классам T₀, T₁, S, M, L (1 — лежит в классе)
Function inC(f, c) {
  if (f == 0) { if (c == 0) { return 0; } if (c == 1) { return 0; } if (c == 2) { return 1; } if (c == 3) { return 0; } if (c == 4) { return 1; } }
  if (f == 1) { if (c == 0) { return 1; } if (c == 1) { return 1; } if (c == 2) { return 0; } if (c == 3) { return 1; } if (c == 4) { return 0; } }
  if (f == 2) { if (c == 0) { return 1; } if (c == 1) { return 1; } if (c == 2) { return 0; } if (c == 3) { return 1; } if (c == 4) { return 0; } }
  if (f == 3) { if (c == 0) { return 1; } if (c == 1) { return 0; } if (c == 2) { return 0; } if (c == 3) { return 0; } if (c == 4) { return 1; } }
  if (f == 4) { if (c == 0) { return 0; } if (c == 1) { return 1; } if (c == 2) { return 0; } if (c == 3) { return 0; } if (c == 4) { return 0; } }
  if (f == 5) { if (c == 0) { return 0; } if (c == 1) { return 1; } if (c == 2) { return 0; } if (c == 3) { return 0; } if (c == 4) { return 1; } }
  if (f == 6) { if (c == 0) { return 0; } if (c == 1) { return 0; } if (c == 2) { return 0; } if (c == 3) { return 0; } if (c == 4) { return 0; } }
  if (f == 7) { if (c == 0) { return 0; } if (c == 1) { return 0; } if (c == 2) { return 0; } if (c == 3) { return 0; } if (c == 4) { return 0; } }
  if (f == 8) { if (c == 0) { return 1; } if (c == 1) { return 0; } if (c == 2) { return 0; } if (c == 3) { return 1; } if (c == 4) { return 1; } }
  if (f == 9) { if (c == 0) { return 0; } if (c == 1) { return 1; } if (c == 2) { return 0; } if (c == 3) { return 1; } if (c == 4) { return 1; } }
  if (f == 10) { if (c == 0) { return 1; } if (c == 1) { return 1; } if (c == 2) { return 1; } if (c == 3) { return 1; } if (c == 4) { return 0; } }
  return 0;
}
Function used(f) {
  if (f == 0) { return u_neg; }
  if (f == 1) { return u_and; }
  if (f == 2) { return u_or; }
  if (f == 3) { return u_xor; }
  if (f == 4) { return u_imp; }
  if (f == 5) { return u_eq; }
  if (f == 6) { return u_pierce; }
  if (f == 7) { return u_sheffer; }
  if (f == 8) { return u_c0; }
  if (f == 9) { return u_c1; }
  if (f == 10) { return u_maj; }
  return false;
}
Function fname(f) {
  if (f == 0) { return "¬x"; }
  if (f == 1) { return "x ∧ y"; }
  if (f == 2) { return "x ∨ y"; }
  if (f == 3) { return "x ⊕ y"; }
  if (f == 4) { return "x → y"; }
  if (f == 5) { return "x ↔ y"; }
  if (f == 6) { return "x ↓ y"; }
  if (f == 7) { return "x | y"; }
  if (f == 8) { return "0"; }
  if (f == 9) { return "1"; }
  if (f == 10) { return "maj(x, y, z)"; }
  return "";
}
Function rname(k) { if (k >= nSel) { return ""; } return fname(sel[k]); }
Function cx(c) { return -1.2 + 1.9 * c; }
Function st() { return min(0.75, 7.6 / (nSel + 2)); }
Function ry(k) { return st() * (nSel + 1) / 2 - 0.3 - st() * k; }
Function verd(c) { if (bad[c] == 1) { return "✓"; } return "✗"; }
Function cname(c) { if (c == 0) { return "T₀"; } if (c == 1) { return "T₁"; } if (c == 2) { return "S"; } if (c == 3) { return "M"; } return "L"; }

Update {
  nSel = 0;
  repeat (11) { if (used(i)) { sel[nSel] = i; nSel = nSel + 1; } }
  gi = newGraph(); go = newGraph(); gk = newGraph(); gb = newGraph();
  repeat (5) { bad[i] = 0; }
  repeat (nSel) { float k = i; float f = sel[k];
    repeat (5) { string key = format(k, 0) + "_" + format(i, 0);
      if (inC(f, i) == 1) { addNode(gi, key, [cx(i), ry(k)]); } else { addNode(go, key, [cx(i), ry(k)]); bad[i] = 1; }
    }
  }
  float ok = 1; string miss = "";
  repeat (5) {
    if (bad[i] == 1) { addNode(gk, "v" + format(i, 0), [cx(i), ry(nSel)]); }
    else { addNode(gb, "v" + format(i, 0), [cx(i), ry(nSel)]); ok = 0; if (miss != "") { miss = miss + ", "; } miss = miss + cname(i); }
  }
  info = "**Теорема Поста о полноте:** система булевых функций полна (через неё выражается любая булева функция) тогда и только тогда, когда она не содержится целиком ни в одном из пяти замкнутых классов: T₀ — сохраняющие 0 (f(0,…,0) = 0), T₁ — сохраняющие 1, S — самодвойственные (f(¬x) = ¬f(x)), M — монотонные, L — линейные (многочлен Жегалкина первой степени). Каждый класс замкнут: суперпозиции его функций не выводят из него, поэтому система внутри класса неполна. Пост доказал, что других препятствий нет.\n\n";
  if (nSel == 0) { info = info + "Выберите функции системы."; }
  else {
    if (ok == 1) { info = info + "**Система полна:** в каждом столбце есть оранжевая точка — функция, выходящая из класса."; }
    else { info = info + "**Система неполна:** все её функции лежат в классе " + miss + ", и любая их суперпозиция — тоже."; }
  }
  if (nSel == 1 && ok == 1) { info = info + " Одной функции достаточно — это функция Шеффера (или стрелка Пирса)."; }
}
]
