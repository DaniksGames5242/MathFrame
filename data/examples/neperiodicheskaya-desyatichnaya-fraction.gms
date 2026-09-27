[
description = "{info}"
field width = 16; field height = 5;
camera type = fixed;
list ks = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13];
float idx = 0; string info = ""; string info2 = "";
draw Text { name = "t1"; pos = (0, 0); text = info2; size = 1.1 }
new UI { type = slider; label = "число под корнем (номер из списка)"; variable = idx; min = 0; max = 9; step = 1; default = 0 }
Function sq(x) { float g = x; repeat (30) { g = (g + x / g) / 2; } return g; }
Update {
  float k = ks[round(idx)];
  float s = sq(k);
  string digs = ""; float r = s - floor(s);
  repeat (10) { r = r * 10; float d = floor(r); digs = digs + format(d, 0); r = r - d; }
  info2 = "√" + format(k, 0) + " ≈ " + format(floor(s), 0) + "," + digs + "...";
  info = "**" + info2 + "** — цифры после запятой не образуют повторяющегося блока, дробь бесконечная непериодическая, а число √" + format(k, 0) + " иррационально.";
}
]
