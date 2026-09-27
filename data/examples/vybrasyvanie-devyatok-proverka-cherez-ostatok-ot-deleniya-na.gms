[
description = "{info}"
field width = 12; field height = 8;
camera type = fixed;
float N = 4578; string info = ""; float m1 = 0; float m2 = 0; float ds = 0;
new UI { type = slider; label = "число N"; variable = N; min = 0; max = 9999; step = 1; default = 4578 }
draw Text { name = "t1"; text = "N mod 9 = " + format(m1, 0); pos = (-3, 1); size = 1.1; color = #3b82f6 }
draw Text { name = "t2"; text = "Σцифр mod 9 = " + format(m2, 0); pos = (3, 1); size = 1.1; color = #f59e0b }
Update {
  float n = round(N);
  float s = 0; float t = n; repeat (10) { if (t >= 1) { s = s + (t - floor(t / 10) * 10); t = floor(t / 10); } }
  ds = s; m1 = n - floor(n / 9) * 9; m2 = s - floor(s / 9) * 9;
  info = "**Выбрасывание девяток:** остаток числа " + format(n, 0) + " от деления на 9 равен " + format(m1, 0) + ", а остаток суммы его цифр (" + format(ds, 0) + ") от деления на 9 равен " + format(m2, 0) + " — они совпадают, потому что 10 ≡ 1 (mod 9). Это позволяет проверять вычисления по остаткам.";
}
]
