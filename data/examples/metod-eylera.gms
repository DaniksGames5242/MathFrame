[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true;

// ---- Поле направлений уравнения y' = f(x, y) (нормированные чёрточки) ----
draw Field { name = "fld"; P = "fdx(x, y)"; Q = "fdy(x, y)"; xmin = -8; xmax = 8; ymin = -5; ymax = 5; grid = 17; scale = 0.45 }

// ---- Точное решение через начальную точку M₀ и ломаная Эйлера ----
func exact(x) = exactVal(x);
draw Function { name = "gEx"; f = "exact"; xmin = -8; xmax = 8; segments = 400; color = #3b82f6; thickness = 3 }
draw Graph { name = "gEu"; graph = "ge"; nodeColor = #f59e0b; edgeColor = #f59e0b; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 30 }
new Point { name = "M0"; pos = (-7, 3); text = true("M₀"); pauseOnDrag = false; layer = 60 }

new UI { name = "sEq"; type = select; label = "уравнение"; variable = eq; options = ("lin", "exp", "gauss"); labels = ("y′ = x − y", "y′ = 0,3y", "y′ = −xy/2"); default = "lin" }
new UI { name = "sH"; type = slider; label = "шаг h"; variable = h; min = 0.1; max = 2; step = 0.05; default = 0.6 }

// ---- Логика ----
string eq = "lin";
float h = 0.6;
float x0 = -7; float y0 = 3;
float yEnd = 0; float yExEnd = 0;
string info = "";

Function f(x, y) {
  if (eq == "lin") { return x - y; }
  if (eq == "exp") { return 0.3 * y; }
  return -x * y / 2;
}
Function fdx(x, y) { return 1 / sqrt(1 + f(x, y) ^ 2); }
Function fdy(x, y) { return f(x, y) / sqrt(1 + f(x, y) ^ 2); }
// Точное решение задачи Коши y(x₀) = y₀
Function exactVal(x) {
  if (eq == "lin") { return x - 1 + (y0 - x0 + 1) * exp(-(x - x0)); }
  if (eq == "exp") { return y0 * exp(0.3 * (x - x0)); }
  return y0 * exp(-(x * x - x0 * x0) / 4);
}

Update {
  x0 = M0.pos.x; y0 = M0.pos.y;
  // Ломаная Эйлера: xₖ₊₁ = xₖ + h, yₖ₊₁ = yₖ + h·f(xₖ, yₖ) — до правого края поля
  ge = newGraph();
  float x = x0; float y = y0;
  addNode(ge, "p0", [x, y]);
  float k = 0;
  repeat (200) {
    if (x + h <= 8.0001 && abs(y) < 40) {
      float yn = y + h * f(x, y);
      x = x + h; y = yn; k = k + 1;
      addNode(ge, "p" + k, [x, y]); addEdge(ge, "p" + (k - 1), "p" + k);
    }
  }
  yEnd = y; yExEnd = exactVal(x);
  info = "**Метод Эйлера** — простейший численный метод решения задачи Коши y′ = f(x, y), y(x₀) = y₀: из текущей точки делается шаг h вдоль касательной, заданной полем направлений: yₖ₊₁ = yₖ + h·f(xₖ, yₖ).\n\nh = " + format(h, 2) + ", шагов " + format(k, 0) + ":   в точке x = " + format(x, 2) + " метод даёт y ≈ " + format(yEnd, 3) + ", точное значение " + format(yExEnd, 3) + ", погрешность " + format(abs(yEnd - yExEnd), 3) + ".\n\nГлобальная погрешность метода пропорциональна h: уменьшите шаг вдвое — ошибка примерно вдвое уменьшится.";
}
]
