[
description = "{info}"

field width = 14; field height = 10;
camera type = fixed;

// ---- Луч OB совершает полный оборот вокруг O. Ползунок задаёт долю пройденного
// оборота: при 0 и при 1 стороны OA и OB совпадают, но при 1 луч прошёл всю окружность —
// это полный угол, а не нулевой. Дуга-траектория отмечает пройденный путь. ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "A"; pos = (5, 0); dynamic = false; collision = false; text = true("A") }
new Circle { name = "path"; center = O; radius = 5; active = false; interact = false }
new Point { name = "B"; pos = (5, 0.0001); dynamic = false; collision = false }
new Line { name = "oa"; pos = (O, A); interact = false }
new Line { name = "ob"; pos = (O, B); interact = false }
draw Text { name = "lblB"; pos = (bx, by); text = "B" }

new UI { name = "sK"; type = slider; label = "доля оборота k"; variable = k; min = 0; max = 1; step = 0.002; default = 0.001 }
draw Graph { name = "trace"; graph = "g"; nodeRadius = 0; edgeWidth = 3; color = #f59e0b }

// ---- Логика ----
float k = 0.001;
float bx = 5.9; float by = 0.5;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float rad = k * 6.2831853071795864;
  B.pos.x = O.pos.x + 5 * cos(rad); B.pos.y = O.pos.y + 5 * sin(rad);
  bx = O.pos.x + 5.9 * cos(rad); by = O.pos.y + 5.9 * sin(rad);

  // Дуга, пройденная лучом: 33 точки от 0 до текущей доли — рисуем как граф-ломаную.
  g = newGraph();
  repeat (33) {
    float f = k * i / 32;
    float a = f * 6.2831853071795864;
    addNode(g, "p" + format(i, 0), [O.pos.x + 5.3 * cos(a), O.pos.y + 5.3 * sin(a)]);
  }

  float deg = k * 360;
  if (k < 0.0015) {
    info = "**Нулевой угол (k = 0):** сторона OB ещё не сдвинулась с OA — стороны совпадают, луч не сделал ни одного оборота.";
  } else if (k > 0.999) {
    info = "**Полный угол (k = 1): 360°.** Луч OB прошёл всю окружность и вернулся на OA — стороны снова совпадают, но, в отличие от нулевого угла, это результат целого оборота, а не отсутствия движения.";
  } else {
    info = "**Пройдено " + num(deg, 0) + "° из 360°** (k = " + num(k, 3) + "). Полный угол — это доля k = 1: он вдвое больше развёрнутого (180°) и является верхней границей величины угла на плоскости.";
  }
}
]
