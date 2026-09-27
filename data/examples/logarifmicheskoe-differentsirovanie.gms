[
description = "{info}"
field width = 20; field height = 12;
camera type = fixed;
float x0 = 2; string info = "";
func f(x) = pow(x, x);
draw Function { name = "gr"; f = "f"; xmin = 0.001; xmax = 10; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "точка x₀"; variable = x0; min = 0.1; max = 5; step = 0.05; default = 2 }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Update {
  float fx = pow(x0, x0);
  float dh = fx * (log(x0) + 1);
  info = "f(x) = xˣ (x > 0) — переменная и в основании, и в показателе, обычные правила (степенная и показательная функция) не подходят напрямую.\n\n**Логарифмическое дифференцирование:** прологарифмируем — ln f = x·ln x, продифференцируем обе части — (ln f)' = f'/f = ln x + 1, отсюда f' = f·(ln x + 1). При x₀ = " + num(x0, 2) + " f(x₀) = " + num(fx, 2) + ", f'(x₀) = " + num(dh, 2) + ".";
}
]
