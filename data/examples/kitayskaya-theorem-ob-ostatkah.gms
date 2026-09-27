[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Таблица m × n: столбец — остаток по модулю m, строка — остаток по модулю n.
// Число x записывается в клетку (x mod m, x mod n); шаг x → x + 1 — сдвиг по диагонали
// (с переходом через край, как на торе). ----
draw Graph { name = "gPath"; graph = "gp"; edgeColor = #3b82f6; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gCur"; graph = "gc"; nodeColor = #f59e0b; nodeRadius = 16; labels = false; interactive = false; showWeights = false; layer = 8 }
draw Graph { name = "gPick"; graph = "gk"; nodeColor = #22c55e; nodeRadius = 16; labels = false; interactive = false; showWeights = false; layer = 7 }
new Point { name = "VA0"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB0"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "vl0"; pos = (VA0, VB0); thickness = 1; interact = false }
new Point { name = "HA0"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB0"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "hl0"; pos = (HA0, HB0); thickness = 1; interact = false }
new Point { name = "VA1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "vl1"; pos = (VA1, VB1); thickness = 1; interact = false }
new Point { name = "HA1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "hl1"; pos = (HA1, HB1); thickness = 1; interact = false }
new Point { name = "VA2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "vl2"; pos = (VA2, VB2); thickness = 1; interact = false }
new Point { name = "HA2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "hl2"; pos = (HA2, HB2); thickness = 1; interact = false }
new Point { name = "VA3"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB3"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "vl3"; pos = (VA3, VB3); thickness = 1; interact = false }
new Point { name = "HA3"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB3"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "hl3"; pos = (HA3, HB3); thickness = 1; interact = false }
new Point { name = "VA4"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB4"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "vl4"; pos = (VA4, VB4); thickness = 1; interact = false }
new Point { name = "HA4"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB4"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "hl4"; pos = (HA4, HB4); thickness = 1; interact = false }
new Point { name = "VA5"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB5"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "vl5"; pos = (VA5, VB5); thickness = 1; interact = false }
new Point { name = "HA5"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB5"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "hl5"; pos = (HA5, HB5); thickness = 1; interact = false }
new Point { name = "VA6"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB6"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "vl6"; pos = (VA6, VB6); thickness = 1; interact = false }
new Point { name = "HA6"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB6"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "hl6"; pos = (HA6, HB6); thickness = 1; interact = false }
new Point { name = "VA7"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB7"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "vl7"; pos = (VA7, VB7); thickness = 1; interact = false }
new Point { name = "HA7"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB7"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "hl7"; pos = (HA7, HB7); thickness = 1; interact = false }
new Point { name = "VA8"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB8"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "vl8"; pos = (VA8, VB8); thickness = 1; interact = false }
new Point { name = "HA8"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB8"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "hl8"; pos = (HA8, HB8); thickness = 1; interact = false }
new Point { name = "VA9"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB9"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "vl9"; pos = (VA9, VB9); thickness = 1; interact = false }
new Point { name = "HA9"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB9"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "hl9"; pos = (HA9, HB9); thickness = 1; interact = false }
draw Text { name = "c0_0"; pos = (gx(0), gy(0)); text = ct(0, 0); size = 1.1; layer = 20; active = 0 < m && 0 < n }
draw Text { name = "c0_1"; pos = (gx(0), gy(1)); text = ct(0, 1); size = 1.1; layer = 20; active = 0 < m && 1 < n }
draw Text { name = "c0_2"; pos = (gx(0), gy(2)); text = ct(0, 2); size = 1.1; layer = 20; active = 0 < m && 2 < n }
draw Text { name = "c0_3"; pos = (gx(0), gy(3)); text = ct(0, 3); size = 1.1; layer = 20; active = 0 < m && 3 < n }
draw Text { name = "c0_4"; pos = (gx(0), gy(4)); text = ct(0, 4); size = 1.1; layer = 20; active = 0 < m && 4 < n }
draw Text { name = "c0_5"; pos = (gx(0), gy(5)); text = ct(0, 5); size = 1.1; layer = 20; active = 0 < m && 5 < n }
draw Text { name = "c0_6"; pos = (gx(0), gy(6)); text = ct(0, 6); size = 1.1; layer = 20; active = 0 < m && 6 < n }
draw Text { name = "c0_7"; pos = (gx(0), gy(7)); text = ct(0, 7); size = 1.1; layer = 20; active = 0 < m && 7 < n }
draw Text { name = "c0_8"; pos = (gx(0), gy(8)); text = ct(0, 8); size = 1.1; layer = 20; active = 0 < m && 8 < n }
draw Text { name = "cm0"; pos = (gx(0), gy(-1) + 0.1); text = "0"; size = 0.9; color = #6b7280; active = 0 < m }
draw Text { name = "cn0"; pos = (gx(-1) + 0.1, gy(0)); text = "0"; size = 0.9; color = #6b7280; active = 0 < n }
draw Text { name = "c1_0"; pos = (gx(1), gy(0)); text = ct(1, 0); size = 1.1; layer = 20; active = 1 < m && 0 < n }
draw Text { name = "c1_1"; pos = (gx(1), gy(1)); text = ct(1, 1); size = 1.1; layer = 20; active = 1 < m && 1 < n }
draw Text { name = "c1_2"; pos = (gx(1), gy(2)); text = ct(1, 2); size = 1.1; layer = 20; active = 1 < m && 2 < n }
draw Text { name = "c1_3"; pos = (gx(1), gy(3)); text = ct(1, 3); size = 1.1; layer = 20; active = 1 < m && 3 < n }
draw Text { name = "c1_4"; pos = (gx(1), gy(4)); text = ct(1, 4); size = 1.1; layer = 20; active = 1 < m && 4 < n }
draw Text { name = "c1_5"; pos = (gx(1), gy(5)); text = ct(1, 5); size = 1.1; layer = 20; active = 1 < m && 5 < n }
draw Text { name = "c1_6"; pos = (gx(1), gy(6)); text = ct(1, 6); size = 1.1; layer = 20; active = 1 < m && 6 < n }
draw Text { name = "c1_7"; pos = (gx(1), gy(7)); text = ct(1, 7); size = 1.1; layer = 20; active = 1 < m && 7 < n }
draw Text { name = "c1_8"; pos = (gx(1), gy(8)); text = ct(1, 8); size = 1.1; layer = 20; active = 1 < m && 8 < n }
draw Text { name = "cm1"; pos = (gx(1), gy(-1) + 0.1); text = "1"; size = 0.9; color = #6b7280; active = 1 < m }
draw Text { name = "cn1"; pos = (gx(-1) + 0.1, gy(1)); text = "1"; size = 0.9; color = #6b7280; active = 1 < n }
draw Text { name = "c2_0"; pos = (gx(2), gy(0)); text = ct(2, 0); size = 1.1; layer = 20; active = 2 < m && 0 < n }
draw Text { name = "c2_1"; pos = (gx(2), gy(1)); text = ct(2, 1); size = 1.1; layer = 20; active = 2 < m && 1 < n }
draw Text { name = "c2_2"; pos = (gx(2), gy(2)); text = ct(2, 2); size = 1.1; layer = 20; active = 2 < m && 2 < n }
draw Text { name = "c2_3"; pos = (gx(2), gy(3)); text = ct(2, 3); size = 1.1; layer = 20; active = 2 < m && 3 < n }
draw Text { name = "c2_4"; pos = (gx(2), gy(4)); text = ct(2, 4); size = 1.1; layer = 20; active = 2 < m && 4 < n }
draw Text { name = "c2_5"; pos = (gx(2), gy(5)); text = ct(2, 5); size = 1.1; layer = 20; active = 2 < m && 5 < n }
draw Text { name = "c2_6"; pos = (gx(2), gy(6)); text = ct(2, 6); size = 1.1; layer = 20; active = 2 < m && 6 < n }
draw Text { name = "c2_7"; pos = (gx(2), gy(7)); text = ct(2, 7); size = 1.1; layer = 20; active = 2 < m && 7 < n }
draw Text { name = "c2_8"; pos = (gx(2), gy(8)); text = ct(2, 8); size = 1.1; layer = 20; active = 2 < m && 8 < n }
draw Text { name = "cm2"; pos = (gx(2), gy(-1) + 0.1); text = "2"; size = 0.9; color = #6b7280; active = 2 < m }
draw Text { name = "cn2"; pos = (gx(-1) + 0.1, gy(2)); text = "2"; size = 0.9; color = #6b7280; active = 2 < n }
draw Text { name = "c3_0"; pos = (gx(3), gy(0)); text = ct(3, 0); size = 1.1; layer = 20; active = 3 < m && 0 < n }
draw Text { name = "c3_1"; pos = (gx(3), gy(1)); text = ct(3, 1); size = 1.1; layer = 20; active = 3 < m && 1 < n }
draw Text { name = "c3_2"; pos = (gx(3), gy(2)); text = ct(3, 2); size = 1.1; layer = 20; active = 3 < m && 2 < n }
draw Text { name = "c3_3"; pos = (gx(3), gy(3)); text = ct(3, 3); size = 1.1; layer = 20; active = 3 < m && 3 < n }
draw Text { name = "c3_4"; pos = (gx(3), gy(4)); text = ct(3, 4); size = 1.1; layer = 20; active = 3 < m && 4 < n }
draw Text { name = "c3_5"; pos = (gx(3), gy(5)); text = ct(3, 5); size = 1.1; layer = 20; active = 3 < m && 5 < n }
draw Text { name = "c3_6"; pos = (gx(3), gy(6)); text = ct(3, 6); size = 1.1; layer = 20; active = 3 < m && 6 < n }
draw Text { name = "c3_7"; pos = (gx(3), gy(7)); text = ct(3, 7); size = 1.1; layer = 20; active = 3 < m && 7 < n }
draw Text { name = "c3_8"; pos = (gx(3), gy(8)); text = ct(3, 8); size = 1.1; layer = 20; active = 3 < m && 8 < n }
draw Text { name = "cm3"; pos = (gx(3), gy(-1) + 0.1); text = "3"; size = 0.9; color = #6b7280; active = 3 < m }
draw Text { name = "cn3"; pos = (gx(-1) + 0.1, gy(3)); text = "3"; size = 0.9; color = #6b7280; active = 3 < n }
draw Text { name = "c4_0"; pos = (gx(4), gy(0)); text = ct(4, 0); size = 1.1; layer = 20; active = 4 < m && 0 < n }
draw Text { name = "c4_1"; pos = (gx(4), gy(1)); text = ct(4, 1); size = 1.1; layer = 20; active = 4 < m && 1 < n }
draw Text { name = "c4_2"; pos = (gx(4), gy(2)); text = ct(4, 2); size = 1.1; layer = 20; active = 4 < m && 2 < n }
draw Text { name = "c4_3"; pos = (gx(4), gy(3)); text = ct(4, 3); size = 1.1; layer = 20; active = 4 < m && 3 < n }
draw Text { name = "c4_4"; pos = (gx(4), gy(4)); text = ct(4, 4); size = 1.1; layer = 20; active = 4 < m && 4 < n }
draw Text { name = "c4_5"; pos = (gx(4), gy(5)); text = ct(4, 5); size = 1.1; layer = 20; active = 4 < m && 5 < n }
draw Text { name = "c4_6"; pos = (gx(4), gy(6)); text = ct(4, 6); size = 1.1; layer = 20; active = 4 < m && 6 < n }
draw Text { name = "c4_7"; pos = (gx(4), gy(7)); text = ct(4, 7); size = 1.1; layer = 20; active = 4 < m && 7 < n }
draw Text { name = "c4_8"; pos = (gx(4), gy(8)); text = ct(4, 8); size = 1.1; layer = 20; active = 4 < m && 8 < n }
draw Text { name = "cm4"; pos = (gx(4), gy(-1) + 0.1); text = "4"; size = 0.9; color = #6b7280; active = 4 < m }
draw Text { name = "cn4"; pos = (gx(-1) + 0.1, gy(4)); text = "4"; size = 0.9; color = #6b7280; active = 4 < n }
draw Text { name = "c5_0"; pos = (gx(5), gy(0)); text = ct(5, 0); size = 1.1; layer = 20; active = 5 < m && 0 < n }
draw Text { name = "c5_1"; pos = (gx(5), gy(1)); text = ct(5, 1); size = 1.1; layer = 20; active = 5 < m && 1 < n }
draw Text { name = "c5_2"; pos = (gx(5), gy(2)); text = ct(5, 2); size = 1.1; layer = 20; active = 5 < m && 2 < n }
draw Text { name = "c5_3"; pos = (gx(5), gy(3)); text = ct(5, 3); size = 1.1; layer = 20; active = 5 < m && 3 < n }
draw Text { name = "c5_4"; pos = (gx(5), gy(4)); text = ct(5, 4); size = 1.1; layer = 20; active = 5 < m && 4 < n }
draw Text { name = "c5_5"; pos = (gx(5), gy(5)); text = ct(5, 5); size = 1.1; layer = 20; active = 5 < m && 5 < n }
draw Text { name = "c5_6"; pos = (gx(5), gy(6)); text = ct(5, 6); size = 1.1; layer = 20; active = 5 < m && 6 < n }
draw Text { name = "c5_7"; pos = (gx(5), gy(7)); text = ct(5, 7); size = 1.1; layer = 20; active = 5 < m && 7 < n }
draw Text { name = "c5_8"; pos = (gx(5), gy(8)); text = ct(5, 8); size = 1.1; layer = 20; active = 5 < m && 8 < n }
draw Text { name = "cm5"; pos = (gx(5), gy(-1) + 0.1); text = "5"; size = 0.9; color = #6b7280; active = 5 < m }
draw Text { name = "cn5"; pos = (gx(-1) + 0.1, gy(5)); text = "5"; size = 0.9; color = #6b7280; active = 5 < n }
draw Text { name = "c6_0"; pos = (gx(6), gy(0)); text = ct(6, 0); size = 1.1; layer = 20; active = 6 < m && 0 < n }
draw Text { name = "c6_1"; pos = (gx(6), gy(1)); text = ct(6, 1); size = 1.1; layer = 20; active = 6 < m && 1 < n }
draw Text { name = "c6_2"; pos = (gx(6), gy(2)); text = ct(6, 2); size = 1.1; layer = 20; active = 6 < m && 2 < n }
draw Text { name = "c6_3"; pos = (gx(6), gy(3)); text = ct(6, 3); size = 1.1; layer = 20; active = 6 < m && 3 < n }
draw Text { name = "c6_4"; pos = (gx(6), gy(4)); text = ct(6, 4); size = 1.1; layer = 20; active = 6 < m && 4 < n }
draw Text { name = "c6_5"; pos = (gx(6), gy(5)); text = ct(6, 5); size = 1.1; layer = 20; active = 6 < m && 5 < n }
draw Text { name = "c6_6"; pos = (gx(6), gy(6)); text = ct(6, 6); size = 1.1; layer = 20; active = 6 < m && 6 < n }
draw Text { name = "c6_7"; pos = (gx(6), gy(7)); text = ct(6, 7); size = 1.1; layer = 20; active = 6 < m && 7 < n }
draw Text { name = "c6_8"; pos = (gx(6), gy(8)); text = ct(6, 8); size = 1.1; layer = 20; active = 6 < m && 8 < n }
draw Text { name = "cm6"; pos = (gx(6), gy(-1) + 0.1); text = "6"; size = 0.9; color = #6b7280; active = 6 < m }
draw Text { name = "cn6"; pos = (gx(-1) + 0.1, gy(6)); text = "6"; size = 0.9; color = #6b7280; active = 6 < n }
draw Text { name = "c7_0"; pos = (gx(7), gy(0)); text = ct(7, 0); size = 1.1; layer = 20; active = 7 < m && 0 < n }
draw Text { name = "c7_1"; pos = (gx(7), gy(1)); text = ct(7, 1); size = 1.1; layer = 20; active = 7 < m && 1 < n }
draw Text { name = "c7_2"; pos = (gx(7), gy(2)); text = ct(7, 2); size = 1.1; layer = 20; active = 7 < m && 2 < n }
draw Text { name = "c7_3"; pos = (gx(7), gy(3)); text = ct(7, 3); size = 1.1; layer = 20; active = 7 < m && 3 < n }
draw Text { name = "c7_4"; pos = (gx(7), gy(4)); text = ct(7, 4); size = 1.1; layer = 20; active = 7 < m && 4 < n }
draw Text { name = "c7_5"; pos = (gx(7), gy(5)); text = ct(7, 5); size = 1.1; layer = 20; active = 7 < m && 5 < n }
draw Text { name = "c7_6"; pos = (gx(7), gy(6)); text = ct(7, 6); size = 1.1; layer = 20; active = 7 < m && 6 < n }
draw Text { name = "c7_7"; pos = (gx(7), gy(7)); text = ct(7, 7); size = 1.1; layer = 20; active = 7 < m && 7 < n }
draw Text { name = "c7_8"; pos = (gx(7), gy(8)); text = ct(7, 8); size = 1.1; layer = 20; active = 7 < m && 8 < n }
draw Text { name = "cm7"; pos = (gx(7), gy(-1) + 0.1); text = "7"; size = 0.9; color = #6b7280; active = 7 < m }
draw Text { name = "cn7"; pos = (gx(-1) + 0.1, gy(7)); text = "7"; size = 0.9; color = #6b7280; active = 7 < n }
draw Text { name = "c8_0"; pos = (gx(8), gy(0)); text = ct(8, 0); size = 1.1; layer = 20; active = 8 < m && 0 < n }
draw Text { name = "c8_1"; pos = (gx(8), gy(1)); text = ct(8, 1); size = 1.1; layer = 20; active = 8 < m && 1 < n }
draw Text { name = "c8_2"; pos = (gx(8), gy(2)); text = ct(8, 2); size = 1.1; layer = 20; active = 8 < m && 2 < n }
draw Text { name = "c8_3"; pos = (gx(8), gy(3)); text = ct(8, 3); size = 1.1; layer = 20; active = 8 < m && 3 < n }
draw Text { name = "c8_4"; pos = (gx(8), gy(4)); text = ct(8, 4); size = 1.1; layer = 20; active = 8 < m && 4 < n }
draw Text { name = "c8_5"; pos = (gx(8), gy(5)); text = ct(8, 5); size = 1.1; layer = 20; active = 8 < m && 5 < n }
draw Text { name = "c8_6"; pos = (gx(8), gy(6)); text = ct(8, 6); size = 1.1; layer = 20; active = 8 < m && 6 < n }
draw Text { name = "c8_7"; pos = (gx(8), gy(7)); text = ct(8, 7); size = 1.1; layer = 20; active = 8 < m && 7 < n }
draw Text { name = "c8_8"; pos = (gx(8), gy(8)); text = ct(8, 8); size = 1.1; layer = 20; active = 8 < m && 8 < n }
draw Text { name = "cm8"; pos = (gx(8), gy(-1) + 0.1); text = "8"; size = 0.9; color = #6b7280; active = 8 < m }
draw Text { name = "cn8"; pos = (gx(-1) + 0.1, gy(8)); text = "8"; size = 0.9; color = #6b7280; active = 8 < n }
draw Text { name = "tm"; pos = (gx(m / 2 - 0.5), gy(-1) + 0.6); text = "x mod " + format(m, 0); size = 1; color = #6b7280 }
draw Text { name = "tn"; pos = (gx(-1) - 1.1, gy(n / 2 - 0.5)); text = "x mod " + format(n, 0); size = 1; color = #6b7280 }

new UI { name = "sM"; type = slider; label = "m"; variable = m; min = 2; max = 9; step = 1; default = 4 }
new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 2; max = 9; step = 1; default = 5 }
new UI { name = "sX"; type = slider; label = "x до"; variable = X; min = 0; max = m * n - 1; step = 1; default = 11 }

// ---- Логика ----
float m = 4; float n = 5; float X = 11;
float cs = 1; float ox = 0; float oy = 0;
float lastKey = -1;
list tf = (-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1);
list tc = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
float clicks = 0;
string pickText = "";
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function gcd(a, b) { repeat (20) { if (b > 0) { float r = md(a, b); a = b; b = r; } } return a; }
Function gx(i) { return ox + cs * (i + 0.5); }
Function gy(j) { return oy - cs * (j + 0.5); }
// Текст клетки: первое x ≤ X, попавшее в неё (и «+k», если туда попадали ещё)
Function ct(i, j) { float f = tf[i * 9 + j]; if (f < 0) { return ""; } float c = tc[i * 9 + j]; if (c > 1) { return format(f, 0) + "⁺"; } return format(f, 0); }

Update {
  X = min(X, m * n - 1);
  cs = min(8 / n, 11 / m, 1.5);
  ox = -cs * m / 2 + 0.4; oy = cs * n / 2 - 0.3;
  float key = m * 10000 + n * 100 + X;
  if (key != lastKey) {
    repeat (81) { tf[i] = -1; tc[i] = 0; }
    gp = newGraph();
    repeat (X + 1) {
      float x = i; float ci = md(x, m); float cj = md(x, n);
      float k = ci * 9 + cj;
      if (tf[k] < 0) { tf[k] = x; }
      tc[k] = tc[k] + 1;
      addNode(gp, "p" + format(x, 0), [gx(ci), gy(cj)]);
      // шаг x − 1 → x — отрезок по диагонали, если не было перехода через край
      if (x > 0 && ci > 0 && cj > 0) { addEdge(gp, "p" + format(x - 1, 0), "p" + format(x, 0)); }
    }
    gc = newGraph(); addNode(gc, "c", [gx(md(X, m)), gy(md(X, n))]);
    // линии сетки
    if (0 <= m) { VA0.pos.x = ox + cs * 0; VA0.pos.y = oy; VB0.pos.x = ox + cs * 0; VB0.pos.y = oy - cs * n; } else { VA0.pos.x = 99; VB0.pos.x = 99; }
    if (0 <= n) { HA0.pos.x = ox; HA0.pos.y = oy - cs * 0; HB0.pos.x = ox + cs * m; HB0.pos.y = oy - cs * 0; } else { HA0.pos.x = 99; HB0.pos.x = 99; }
    if (1 <= m) { VA1.pos.x = ox + cs * 1; VA1.pos.y = oy; VB1.pos.x = ox + cs * 1; VB1.pos.y = oy - cs * n; } else { VA1.pos.x = 99; VB1.pos.x = 99; }
    if (1 <= n) { HA1.pos.x = ox; HA1.pos.y = oy - cs * 1; HB1.pos.x = ox + cs * m; HB1.pos.y = oy - cs * 1; } else { HA1.pos.x = 99; HB1.pos.x = 99; }
    if (2 <= m) { VA2.pos.x = ox + cs * 2; VA2.pos.y = oy; VB2.pos.x = ox + cs * 2; VB2.pos.y = oy - cs * n; } else { VA2.pos.x = 99; VB2.pos.x = 99; }
    if (2 <= n) { HA2.pos.x = ox; HA2.pos.y = oy - cs * 2; HB2.pos.x = ox + cs * m; HB2.pos.y = oy - cs * 2; } else { HA2.pos.x = 99; HB2.pos.x = 99; }
    if (3 <= m) { VA3.pos.x = ox + cs * 3; VA3.pos.y = oy; VB3.pos.x = ox + cs * 3; VB3.pos.y = oy - cs * n; } else { VA3.pos.x = 99; VB3.pos.x = 99; }
    if (3 <= n) { HA3.pos.x = ox; HA3.pos.y = oy - cs * 3; HB3.pos.x = ox + cs * m; HB3.pos.y = oy - cs * 3; } else { HA3.pos.x = 99; HB3.pos.x = 99; }
    if (4 <= m) { VA4.pos.x = ox + cs * 4; VA4.pos.y = oy; VB4.pos.x = ox + cs * 4; VB4.pos.y = oy - cs * n; } else { VA4.pos.x = 99; VB4.pos.x = 99; }
    if (4 <= n) { HA4.pos.x = ox; HA4.pos.y = oy - cs * 4; HB4.pos.x = ox + cs * m; HB4.pos.y = oy - cs * 4; } else { HA4.pos.x = 99; HB4.pos.x = 99; }
    if (5 <= m) { VA5.pos.x = ox + cs * 5; VA5.pos.y = oy; VB5.pos.x = ox + cs * 5; VB5.pos.y = oy - cs * n; } else { VA5.pos.x = 99; VB5.pos.x = 99; }
    if (5 <= n) { HA5.pos.x = ox; HA5.pos.y = oy - cs * 5; HB5.pos.x = ox + cs * m; HB5.pos.y = oy - cs * 5; } else { HA5.pos.x = 99; HB5.pos.x = 99; }
    if (6 <= m) { VA6.pos.x = ox + cs * 6; VA6.pos.y = oy; VB6.pos.x = ox + cs * 6; VB6.pos.y = oy - cs * n; } else { VA6.pos.x = 99; VB6.pos.x = 99; }
    if (6 <= n) { HA6.pos.x = ox; HA6.pos.y = oy - cs * 6; HB6.pos.x = ox + cs * m; HB6.pos.y = oy - cs * 6; } else { HA6.pos.x = 99; HB6.pos.x = 99; }
    if (7 <= m) { VA7.pos.x = ox + cs * 7; VA7.pos.y = oy; VB7.pos.x = ox + cs * 7; VB7.pos.y = oy - cs * n; } else { VA7.pos.x = 99; VB7.pos.x = 99; }
    if (7 <= n) { HA7.pos.x = ox; HA7.pos.y = oy - cs * 7; HB7.pos.x = ox + cs * m; HB7.pos.y = oy - cs * 7; } else { HA7.pos.x = 99; HB7.pos.x = 99; }
    if (8 <= m) { VA8.pos.x = ox + cs * 8; VA8.pos.y = oy; VB8.pos.x = ox + cs * 8; VB8.pos.y = oy - cs * n; } else { VA8.pos.x = 99; VB8.pos.x = 99; }
    if (8 <= n) { HA8.pos.x = ox; HA8.pos.y = oy - cs * 8; HB8.pos.x = ox + cs * m; HB8.pos.y = oy - cs * 8; } else { HA8.pos.x = 99; HB8.pos.x = 99; }
    if (9 <= m) { VA9.pos.x = ox + cs * 9; VA9.pos.y = oy; VB9.pos.x = ox + cs * 9; VB9.pos.y = oy - cs * n; } else { VA9.pos.x = 99; VB9.pos.x = 99; }
    if (9 <= n) { HA9.pos.x = ox; HA9.pos.y = oy - cs * 9; HB9.pos.x = ox + cs * m; HB9.pos.y = oy - cs * 9; } else { HA9.pos.x = 99; HB9.pos.x = 99; }
    lastKey = key;
  }
  // Клик по клетке: решаем систему x ≡ i (mod m), x ≡ j (mod n)
  if (mouseClickCount != clicks) {
    clicks = mouseClickCount;
    float i0 = floor((mouseClickX - ox) / cs); float j0 = floor((oy - mouseClickY) / cs);
    gk = newGraph(); pickText = "";
    if (i0 >= 0 && i0 < m && j0 >= 0 && j0 < n) {
      addNode(gk, "k", [gx(i0), gy(j0)]);
      float sol = -1; repeat (m * n) { if (sol < 0 && md(i, m) == i0 && md(i, n) == j0) { sol = i; } }
      pickText = "Система x ≡ " + format(i0, 0) + " (mod " + format(m, 0) + "), x ≡ " + format(j0, 0) + " (mod " + format(n, 0) + "): ";
      if (sol >= 0) { pickText = pickText + "x ≡ " + format(sol, 0) + " (mod " + format(m * n / gcd(m, n), 0) + ")."; }
      else { pickText = pickText + "решений нет — эту клетку диагональ не посещает."; }
    }
  }
  float g = gcd(m, n);
  float filled = 0; repeat (81) { if (tf[i] >= 0) { filled = filled + 1; } }
  info = "**Китайская теорема об остатках:** если m и n взаимно просты, то система x ≡ a (mod m), x ≡ b (mod n) имеет решение при любых a, b, и оно единственно по модулю mn. Иначе говоря, отображение x ↦ (x mod m, x mod n) — взаимно однозначное соответствие между остатками по модулю mn и парами остатков.\n\nВ таблице число x стоит в клетке (x mod m; x mod n), шаг x → x + 1 сдвигает на клетку по диагонали, и путь «оборачивается» через края. m = " + format(m, 0) + ", n = " + format(n, 0) + ", НОД = " + format(g, 0) + ": ";
  if (g == 1) { info = info + "числа 0…" + format(m * n - 1, 0) + " обходят все " + format(m * n, 0) + " клеток по одному разу — у каждой системы ровно одно решение."; }
  else { info = info + "путь замыкается уже через НОК = " + format(m * n / g, 0) + " шагов (дальше числа повторяют клетки — отмечены ⁺) и посещает только " + format(m * n / g, 0) + " клеток из " + format(m * n, 0) + ": у остальных систем решений нет."; }
  if (pickText != "") { info = info + "\n\n" + pickText; }
  info = info + "\n\nКлик по клетке решает соответствующую систему.";
}
]
