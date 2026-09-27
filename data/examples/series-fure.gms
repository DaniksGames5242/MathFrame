[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true;

// ---- Периодическая функция f (период 2π) и частичная сумма ряда Фурье S_N ----
// Точка K лежит на графике f: перетаскивая её по вертикали, меняем амплитуду h —
// график и все коэффициенты перестраиваются.
func f(x) = fval(x);
func sN(x) = sval(x);
draw Function { name = "gf"; f = "f"; xmin = -8; xmax = 8; segments = 1200; thickness = 2; grid = true }
draw Function { name = "gs"; f = "sN"; xmin = -8; xmax = 8; segments = 800; color = #f59e0b; thickness = 3 }
new Point { name = "K"; pos = (1.5708, 3); text = true("K"); pauseOnDrag = false; color = #3b82f6 }

new UI { name = "sN"; type = slider; label = "N гармоник"; variable = N; min = 1; max = 30; step = 1; default = 3 }
new UI { name = "sF"; type = select; label = "функция"; variable = kind; options = ("square", "saw", "tri"); labels = ("меандр", "пила", "треугольник"); default = "square" }

// ---- Логика ----
float N = 3;
string kind = "square";
float h = 3;
string info = "";

// Приведение x к периоду (−π; π]
Function red(x) { return x - 2 * pi * floor((x + pi) / (2 * pi)); }
// Форма функции при h = 1
Function shape(x) {
  float r = red(x);
  if (kind == "square") { if (r > 0) { return 1; } if (r < 0) { return -1; } return 0; }
  if (kind == "saw") { return r / pi; }
  return 1 - 2 * abs(r) / pi;
}
Function fval(x) { return h * shape(x); }
// Частичная сумма: первые N гармоник (k = 1…N)
Function sval(x) {
  float s = 0;
  repeat (N) {
    float k = i + 1;
    if (kind == "square") { if (k - 2 * floor(k / 2) == 1) { s = s + 4 / (pi * k) * sin(k * x); } }
    else if (kind == "saw") { float sg = 1; if (k - 2 * floor(k / 2) == 0) { sg = -1; } s = s + sg * 2 / (pi * k) * sin(k * x); }
    else { if (k - 2 * floor(k / 2) == 1) { s = s + 8 / (pi * pi * k * k) * cos(k * x); } }
  }
  return h * s;
}

Update {
  // K — на графике f в фиксированной точке x0 (где форма функции равна 1 или 1/2);
  // по вертикали — амплитуда, |h| от 0.5 до 4.5
  float x0 = pi / 2;
  if (kind == "tri") { x0 = 0; }
  float sh = shape(x0);
  h = K.pos.y / sh;
  if (abs(h) < 0.5) { if (h < 0) { h = -0.5; } else { h = 0.5; } }
  h = min(max(h, -4.5), 4.5);
  K.pos.x = x0; K.pos.y = h * sh;

  string name = "меандра";
  string series = "h · 4/π · (sin x + sin 3x/3 + sin 5x/5 + …)";
  if (kind == "saw") { name = "пилы"; series = "h · 2/π · (sin x − sin 2x/2 + sin 3x/3 − …)"; }
  if (kind == "tri") { name = "треугольной волны"; series = "h · 8/π² · (cos x + cos 3x/9 + cos 5x/25 + …)"; }
  info = "**Ряд Фурье** раскладывает периодическую функцию в сумму гармоник. Для " + name + " с амплитудой h = " + format(h, 2) + ": f(x) ∼ " + series + ".\n\nОранжевая кривая — частичная сумма S_N из первых N = " + format(N, 0) + " гармоник. С ростом N она всё точнее повторяет функцию.";
  if (kind != "tri") { info = info + " Около разрывов остаётся выброс примерно в 9 % от скачка — явление Гиббса: с ростом N он не уменьшается, а только сужается."; }
}
]
