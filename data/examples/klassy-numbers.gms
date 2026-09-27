[
description = "{info}"
field width = 16; field height = 8;
camera type = fixed;
float N = 234567891; string info = ""; float mln = 0; float tys = 0; float ed = 0;
draw Text { name = "t1"; text = format(mln, 0); pos = (-4.5, 0); size = 1.6; color = #3b82f6 }
draw Text { name = "t2"; text = format(tys, 0); pos = (0, 0); size = 1.6; color = #f59e0b }
draw Text { name = "t3"; text = format(ed, 0); pos = (4.5, 0); size = 1.6; color = #22c55e }
draw Text { name = "l1"; text = "класс млн."; pos = (-4.5, -1.6); size = 0.8 }
draw Text { name = "l2"; text = "класс тыс."; pos = (0, -1.6); size = 0.8 }
draw Text { name = "l3"; text = "класс ед."; pos = (4.5, -1.6); size = 0.8 }
new UI { type = slider; label = "число N"; variable = N; min = 0; max = 999999999; step = 1; default = 234567891 }
Update {
  float n = round(N);
  mln = floor(n / 1000000); tys = floor((n - mln * 1000000) / 1000); ed = n - mln * 1000000 - tys * 1000;
  info = "**" + format(n, 0) + "** разбивается на классы по три разряда, считая справа: класс единиц = " + format(ed, 0) + ", класс тысяч = " + format(tys, 0) + ", класс миллионов = " + format(mln, 0) + ".";
}
]
