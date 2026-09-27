[
description = "{info}"
field width = 16; field height = 5;
camera type = fixed;
list ns = [3, 7, 9, 11, 13, 17];
float idx = 1; float m = 1; string info = ""; string info2 = "";
draw Text { name = "t1"; pos = (0, 0); text = info2; size = 1.1 }
new UI { type = slider; label = "знаменатель (номер из списка)"; variable = idx; min = 0; max = 5; step = 1; default = 1 }
new UI { type = slider; label = "числитель m"; variable = m; min = 1; max = 16; step = 1; default = 1 }
Update {
  float n = ns[round(idx)];
  if (m > n - 1) { m = n - 1; }
  string digs = ""; float r = m;
  repeat (12) { r = r * 10; float d = floor(r / n); digs = digs + format(d, 0); r = r - d * n; }
  info2 = format(m, 0) + "/" + format(n, 0) + " = 0,(" + digs + ")...";
  info = "**" + info2 + "** — после запятой бесконечно повторяется один и тот же блок цифр (период), поэтому дробь периодическая.";
}
]
