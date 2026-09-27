[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Прямоугольник 0 < x < p/2, 0 < y < q/2 и его целые точки. Диагональ y = qx/p делит
// их на A точек под ней (синие) и B над ней (оранжевые); на самой диагонали точек нет. ----
new Point { name = "R0"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "R1"; pos = (1, 0); dynamic = false; collision = false; active = false }
new Point { name = "R2"; pos = (1, 1); dynamic = false; collision = false; size = 0.5 }
new Point { name = "R3"; pos = (0, 1); dynamic = false; collision = false; active = false }
new Line { name = "r01"; pos = (R0, R1); thickness = 1.5; interact = false }
new Line { name = "r12"; pos = (R1, R2); thickness = 1; interact = false }
new Line { name = "r23"; pos = (R2, R3); thickness = 1; interact = false }
new Line { name = "r30"; pos = (R3, R0); thickness = 1.5; interact = false }
new Line { name = "dg"; pos = (R0, R2); color = #ef4444; thickness = 2.5; interact = false }
// ---- Целочисленная решётка: прямые x = 1, 2, … и y = 1, 2, … (стороны прямоугольника — на полуцелых p/2 и q/2) ----
new Point { name = "VA0"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB0"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv0"; pos = (VA0, VB0); active = false }
draw Punctir { name = "pv0"; edge = "gv0"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA0"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB0"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh0"; pos = (HA0, HB0); active = false }
draw Punctir { name = "ph0"; edge = "gh0"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv0"; pos = (ox + s * 1, oy - 0.35); text = "1"; size = 0.8; color = #6b7280; active = 1 <= (p - 1) / 2 }
draw Text { name = "th0"; pos = (ox - 0.3, oy + s * 1); text = "1"; size = 0.8; color = #6b7280; active = 1 <= (q - 1) / 2 }
new Point { name = "VA1"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB1"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv1"; pos = (VA1, VB1); active = false }
draw Punctir { name = "pv1"; edge = "gv1"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA1"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB1"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh1"; pos = (HA1, HB1); active = false }
draw Punctir { name = "ph1"; edge = "gh1"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv1"; pos = (ox + s * 2, oy - 0.35); text = "2"; size = 0.8; color = #6b7280; active = 2 <= (p - 1) / 2 }
draw Text { name = "th1"; pos = (ox - 0.3, oy + s * 2); text = "2"; size = 0.8; color = #6b7280; active = 2 <= (q - 1) / 2 }
new Point { name = "VA2"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB2"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv2"; pos = (VA2, VB2); active = false }
draw Punctir { name = "pv2"; edge = "gv2"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA2"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB2"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh2"; pos = (HA2, HB2); active = false }
draw Punctir { name = "ph2"; edge = "gh2"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv2"; pos = (ox + s * 3, oy - 0.35); text = "3"; size = 0.8; color = #6b7280; active = 3 <= (p - 1) / 2 }
draw Text { name = "th2"; pos = (ox - 0.3, oy + s * 3); text = "3"; size = 0.8; color = #6b7280; active = 3 <= (q - 1) / 2 }
new Point { name = "VA3"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB3"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv3"; pos = (VA3, VB3); active = false }
draw Punctir { name = "pv3"; edge = "gv3"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA3"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB3"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh3"; pos = (HA3, HB3); active = false }
draw Punctir { name = "ph3"; edge = "gh3"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv3"; pos = (ox + s * 4, oy - 0.35); text = "4"; size = 0.8; color = #6b7280; active = 4 <= (p - 1) / 2 }
draw Text { name = "th3"; pos = (ox - 0.3, oy + s * 4); text = "4"; size = 0.8; color = #6b7280; active = 4 <= (q - 1) / 2 }
new Point { name = "VA4"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB4"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv4"; pos = (VA4, VB4); active = false }
draw Punctir { name = "pv4"; edge = "gv4"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA4"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB4"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh4"; pos = (HA4, HB4); active = false }
draw Punctir { name = "ph4"; edge = "gh4"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv4"; pos = (ox + s * 5, oy - 0.35); text = "5"; size = 0.8; color = #6b7280; active = 5 <= (p - 1) / 2 }
draw Text { name = "th4"; pos = (ox - 0.3, oy + s * 5); text = "5"; size = 0.8; color = #6b7280; active = 5 <= (q - 1) / 2 }
new Point { name = "VA5"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB5"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv5"; pos = (VA5, VB5); active = false }
draw Punctir { name = "pv5"; edge = "gv5"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA5"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB5"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh5"; pos = (HA5, HB5); active = false }
draw Punctir { name = "ph5"; edge = "gh5"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv5"; pos = (ox + s * 6, oy - 0.35); text = "6"; size = 0.8; color = #6b7280; active = 6 <= (p - 1) / 2 }
draw Text { name = "th5"; pos = (ox - 0.3, oy + s * 6); text = "6"; size = 0.8; color = #6b7280; active = 6 <= (q - 1) / 2 }
new Point { name = "VA6"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB6"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv6"; pos = (VA6, VB6); active = false }
draw Punctir { name = "pv6"; edge = "gv6"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA6"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB6"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh6"; pos = (HA6, HB6); active = false }
draw Punctir { name = "ph6"; edge = "gh6"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv6"; pos = (ox + s * 7, oy - 0.35); text = "7"; size = 0.8; color = #6b7280; active = 7 <= (p - 1) / 2 }
draw Text { name = "th6"; pos = (ox - 0.3, oy + s * 7); text = "7"; size = 0.8; color = #6b7280; active = 7 <= (q - 1) / 2 }
new Point { name = "VA7"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB7"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv7"; pos = (VA7, VB7); active = false }
draw Punctir { name = "pv7"; edge = "gv7"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA7"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB7"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh7"; pos = (HA7, HB7); active = false }
draw Punctir { name = "ph7"; edge = "gh7"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv7"; pos = (ox + s * 8, oy - 0.35); text = "8"; size = 0.8; color = #6b7280; active = 8 <= (p - 1) / 2 }
draw Text { name = "th7"; pos = (ox - 0.3, oy + s * 8); text = "8"; size = 0.8; color = #6b7280; active = 8 <= (q - 1) / 2 }
new Point { name = "VA8"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB8"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv8"; pos = (VA8, VB8); active = false }
draw Punctir { name = "pv8"; edge = "gv8"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA8"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB8"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh8"; pos = (HA8, HB8); active = false }
draw Punctir { name = "ph8"; edge = "gh8"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv8"; pos = (ox + s * 9, oy - 0.35); text = "9"; size = 0.8; color = #6b7280; active = 9 <= (p - 1) / 2 }
draw Text { name = "th8"; pos = (ox - 0.3, oy + s * 9); text = "9"; size = 0.8; color = #6b7280; active = 9 <= (q - 1) / 2 }
new Point { name = "VA9"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB9"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv9"; pos = (VA9, VB9); active = false }
draw Punctir { name = "pv9"; edge = "gv9"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA9"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB9"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh9"; pos = (HA9, HB9); active = false }
draw Punctir { name = "ph9"; edge = "gh9"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv9"; pos = (ox + s * 10, oy - 0.35); text = "10"; size = 0.8; color = #6b7280; active = 10 <= (p - 1) / 2 }
draw Text { name = "th9"; pos = (ox - 0.3, oy + s * 10); text = "10"; size = 0.8; color = #6b7280; active = 10 <= (q - 1) / 2 }
new Point { name = "VA10"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB10"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv10"; pos = (VA10, VB10); active = false }
draw Punctir { name = "pv10"; edge = "gv10"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA10"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB10"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh10"; pos = (HA10, HB10); active = false }
draw Punctir { name = "ph10"; edge = "gh10"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv10"; pos = (ox + s * 11, oy - 0.35); text = "11"; size = 0.8; color = #6b7280; active = 11 <= (p - 1) / 2 }
draw Text { name = "th10"; pos = (ox - 0.3, oy + s * 11); text = "11"; size = 0.8; color = #6b7280; active = 11 <= (q - 1) / 2 }
new Point { name = "VA11"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "VB11"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gv11"; pos = (VA11, VB11); active = false }
draw Punctir { name = "pv11"; edge = "gv11"; color = #374151; thickness = 1; layer = 1 }
new Point { name = "HA11"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Point { name = "HB11"; pos = (99, 0); dynamic = false; collision = false; active = false }
new Line { name = "gh11"; pos = (HA11, HB11); active = false }
draw Punctir { name = "ph11"; edge = "gh11"; color = #374151; thickness = 1; layer = 1 }
draw Text { name = "tv11"; pos = (ox + s * 12, oy - 0.35); text = "12"; size = 0.8; color = #6b7280; active = 12 <= (p - 1) / 2 }
draw Text { name = "th11"; pos = (ox - 0.3, oy + s * 12); text = "12"; size = 0.8; color = #6b7280; active = 12 <= (q - 1) / 2 }
draw Graph { name = "gA"; graph = "ga"; nodeColor = #3b82f6; nodeRadius = 7; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gB"; graph = "gb"; nodeColor = #f59e0b; nodeRadius = 7; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "tx"; pos = (R1.pos.x + 0.4, R1.pos.y - 0.4); text = "p/2 = " + format(p / 2, 1); size = 1 }
draw Text { name = "ty"; pos = (R3.pos.x - 0.9, R3.pos.y); text = "q/2 = " + format(q / 2, 1); size = 1 }
draw Text { name = "td"; pos = (R2.pos.x + 0.8, R2.pos.y + 0.2); text = "y = qx/p"; color = #ef4444; size = 1 }

new UI { name = "sP"; type = select; label = "p"; variable = p; options = (3, 5, 7, 11, 13, 17, 19, 23); default = 11 }
new UI { name = "sQ"; type = select; label = "q"; variable = q; options = (3, 5, 7, 11, 13, 17, 19, 23); default = 7 }

// ---- Логика ----
float p = 11; float q = 7;
float key = -1;
float A = 0; float B = 0; float lp = 0; float lq = 0;
float s = 1; float ox = 0; float oy = 0;
string info = "";

Function md(a, m) { return a - floor(a / m) * m; }
// a^e mod m
Function pw(a, e, m) { float r = 1; float b = md(a, m); repeat (e) { r = md(r * b, m); } return r; }
// Символ Лежандра по критерию Эйлера: ±1
Function leg(a, m) { if (pw(a, (m - 1) / 2, m) == 1) { return 1; } return -1; }
Function sg(v) { if (v > 0) { return "+1"; } return "−1"; }
Function par(v) { if (md(v, 2) == 0) { return "чётно"; } return "нечётно"; }

Update {
  if (p * 100 + q != key) {
    float h = (p - 1) / 2; float k = (q - 1) / 2;
    s = min(12 / (p / 2), 7.6 / (q / 2));
    ox = -s * p / 4; oy = -s * q / 4 - 0.2;
    R0.pos.x = ox; R0.pos.y = oy; R1.pos.x = ox + s * p / 2; R1.pos.y = oy;
    R2.pos.x = ox + s * p / 2; R2.pos.y = oy + s * q / 2; R3.pos.x = ox; R3.pos.y = oy + s * q / 2;
    if (1 <= h) { VA0.pos.x = ox + s * 1; VA0.pos.y = oy; VB0.pos.x = ox + s * 1; VB0.pos.y = oy + s * q / 2; } else { VA0.pos.x = 99; VB0.pos.x = 99; }
    if (1 <= k) { HA0.pos.x = ox; HA0.pos.y = oy + s * 1; HB0.pos.x = ox + s * p / 2; HB0.pos.y = oy + s * 1; } else { HA0.pos.x = 99; HB0.pos.x = 99; }
    if (2 <= h) { VA1.pos.x = ox + s * 2; VA1.pos.y = oy; VB1.pos.x = ox + s * 2; VB1.pos.y = oy + s * q / 2; } else { VA1.pos.x = 99; VB1.pos.x = 99; }
    if (2 <= k) { HA1.pos.x = ox; HA1.pos.y = oy + s * 2; HB1.pos.x = ox + s * p / 2; HB1.pos.y = oy + s * 2; } else { HA1.pos.x = 99; HB1.pos.x = 99; }
    if (3 <= h) { VA2.pos.x = ox + s * 3; VA2.pos.y = oy; VB2.pos.x = ox + s * 3; VB2.pos.y = oy + s * q / 2; } else { VA2.pos.x = 99; VB2.pos.x = 99; }
    if (3 <= k) { HA2.pos.x = ox; HA2.pos.y = oy + s * 3; HB2.pos.x = ox + s * p / 2; HB2.pos.y = oy + s * 3; } else { HA2.pos.x = 99; HB2.pos.x = 99; }
    if (4 <= h) { VA3.pos.x = ox + s * 4; VA3.pos.y = oy; VB3.pos.x = ox + s * 4; VB3.pos.y = oy + s * q / 2; } else { VA3.pos.x = 99; VB3.pos.x = 99; }
    if (4 <= k) { HA3.pos.x = ox; HA3.pos.y = oy + s * 4; HB3.pos.x = ox + s * p / 2; HB3.pos.y = oy + s * 4; } else { HA3.pos.x = 99; HB3.pos.x = 99; }
    if (5 <= h) { VA4.pos.x = ox + s * 5; VA4.pos.y = oy; VB4.pos.x = ox + s * 5; VB4.pos.y = oy + s * q / 2; } else { VA4.pos.x = 99; VB4.pos.x = 99; }
    if (5 <= k) { HA4.pos.x = ox; HA4.pos.y = oy + s * 5; HB4.pos.x = ox + s * p / 2; HB4.pos.y = oy + s * 5; } else { HA4.pos.x = 99; HB4.pos.x = 99; }
    if (6 <= h) { VA5.pos.x = ox + s * 6; VA5.pos.y = oy; VB5.pos.x = ox + s * 6; VB5.pos.y = oy + s * q / 2; } else { VA5.pos.x = 99; VB5.pos.x = 99; }
    if (6 <= k) { HA5.pos.x = ox; HA5.pos.y = oy + s * 6; HB5.pos.x = ox + s * p / 2; HB5.pos.y = oy + s * 6; } else { HA5.pos.x = 99; HB5.pos.x = 99; }
    if (7 <= h) { VA6.pos.x = ox + s * 7; VA6.pos.y = oy; VB6.pos.x = ox + s * 7; VB6.pos.y = oy + s * q / 2; } else { VA6.pos.x = 99; VB6.pos.x = 99; }
    if (7 <= k) { HA6.pos.x = ox; HA6.pos.y = oy + s * 7; HB6.pos.x = ox + s * p / 2; HB6.pos.y = oy + s * 7; } else { HA6.pos.x = 99; HB6.pos.x = 99; }
    if (8 <= h) { VA7.pos.x = ox + s * 8; VA7.pos.y = oy; VB7.pos.x = ox + s * 8; VB7.pos.y = oy + s * q / 2; } else { VA7.pos.x = 99; VB7.pos.x = 99; }
    if (8 <= k) { HA7.pos.x = ox; HA7.pos.y = oy + s * 8; HB7.pos.x = ox + s * p / 2; HB7.pos.y = oy + s * 8; } else { HA7.pos.x = 99; HB7.pos.x = 99; }
    if (9 <= h) { VA8.pos.x = ox + s * 9; VA8.pos.y = oy; VB8.pos.x = ox + s * 9; VB8.pos.y = oy + s * q / 2; } else { VA8.pos.x = 99; VB8.pos.x = 99; }
    if (9 <= k) { HA8.pos.x = ox; HA8.pos.y = oy + s * 9; HB8.pos.x = ox + s * p / 2; HB8.pos.y = oy + s * 9; } else { HA8.pos.x = 99; HB8.pos.x = 99; }
    if (10 <= h) { VA9.pos.x = ox + s * 10; VA9.pos.y = oy; VB9.pos.x = ox + s * 10; VB9.pos.y = oy + s * q / 2; } else { VA9.pos.x = 99; VB9.pos.x = 99; }
    if (10 <= k) { HA9.pos.x = ox; HA9.pos.y = oy + s * 10; HB9.pos.x = ox + s * p / 2; HB9.pos.y = oy + s * 10; } else { HA9.pos.x = 99; HB9.pos.x = 99; }
    if (11 <= h) { VA10.pos.x = ox + s * 11; VA10.pos.y = oy; VB10.pos.x = ox + s * 11; VB10.pos.y = oy + s * q / 2; } else { VA10.pos.x = 99; VB10.pos.x = 99; }
    if (11 <= k) { HA10.pos.x = ox; HA10.pos.y = oy + s * 11; HB10.pos.x = ox + s * p / 2; HB10.pos.y = oy + s * 11; } else { HA10.pos.x = 99; HB10.pos.x = 99; }
    if (12 <= h) { VA11.pos.x = ox + s * 12; VA11.pos.y = oy; VB11.pos.x = ox + s * 12; VB11.pos.y = oy + s * q / 2; } else { VA11.pos.x = 99; VB11.pos.x = 99; }
    if (12 <= k) { HA11.pos.x = ox; HA11.pos.y = oy + s * 12; HB11.pos.x = ox + s * p / 2; HB11.pos.y = oy + s * 12; } else { HA11.pos.x = 99; HB11.pos.x = 99; }
    ga = newGraph(); gb = newGraph(); A = 0; B = 0;
    repeat (h) { float x = i + 1; repeat (k) { float y = i + 1;
      string nm = format(x, 0) + "_" + format(y, 0);
      if (y * p < q * x) { addNode(ga, nm, [ox + s * x, oy + s * y]); A = A + 1; }
      else { addNode(gb, nm, [ox + s * x, oy + s * y]); B = B + 1; }
    } }
    if (p != q) { lp = leg(q, p); lq = leg(p, q); }
    key = p * 100 + q;
  }
  info = "**Закон квадратичной взаимности:** для различных нечётных простых p и q символы Лежандра связаны равенством (p/q)·(q/p) = (−1)^(((p−1)/2)·((q−1)/2)). Значит, q — квадрат по модулю p тогда и только тогда, когда p — квадрат по модулю q, кроме случая p ≡ q ≡ 3 (mod 4), когда ровно одно из двух верно.\n\n**Доказательство Эйзенштейна:** (q/p) = (−1)^A, где A — число целых точек прямоугольника под диагональю, а (p/q) = (−1)^B, где B — число точек над ней. Всего точек A + B = ((p−1)/2)·((q−1)/2), откуда и получается закон.\n\n";
  if (p == q) { info = info + "Выберите два различных простых числа."; }
  else {
    info = info + "p = " + format(p, 0) + ", q = " + format(q, 0) + ":   A = " + format(A, 0) + " (" + par(A) + "), (q/p) = " + sg(lp) + ";   B = " + format(B, 0) + " (" + par(B) + "), (p/q) = " + sg(lq) + ";   A + B = " + format((p - 1) / 2, 0) + "·" + format((q - 1) / 2, 0) + " = " + format(A + B, 0) + ", (p/q)(q/p) = " + sg(lp * lq) + ".";
    info = info + " Символы вычислены независимо, по критерию Эйлера (a/p) ≡ a^((p−1)/2) (mod p).";
  }
}
]
