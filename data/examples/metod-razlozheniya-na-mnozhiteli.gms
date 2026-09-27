[
description = "{info}"
field width = 12.6; field height = 8;
camera type = fixed;
float k = 0.5; string info = "";
func f(x) = sin(x) * (sin(x) - k);
draw Function { name = "gf"; f = "f"; xmin = -6.28; xmax = 6.28; grid = true; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "k"; variable = k; min = -0.95; max = 0.95; step = 0.05; default = 0.5 }
Update {
  info = "**sin x·(sin x − " + format(k, 2) + ") = 0** разложено на множители: произведение равно нулю, если хотя бы один множитель равен нулю.\n\nЛибо sin x = 0 (x = πn), либо sin x = " + format(k, 2) + " (x = arcsin(" + format(k, 2) + ") + 2πn или x = π − arcsin(" + format(k, 2) + ") + 2πn), n ∈ ℤ.";
}
]
