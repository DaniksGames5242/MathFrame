[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Свойство — прямая характеристика объекта (числа), а не связь между утверждениями:
// каждое из четырёх свойств либо выполняется у n, либо нет, независимо от остальных. ----
draw Text { name = "tn"; pos = (0, 4); text = "n = " + format(n, 0); size = 1.8 }
draw Text { name = "l1"; pos = (-6.5, 1.8); text = "чётное"; size = 1.15; align = left }
draw Text { name = "v1"; pos = (3, 1.8); text = mark(isEven); size = 1.15; align = right; color = cEven }
draw Text { name = "l2"; pos = (-6.5, 0.5); text = "простое"; size = 1.15; align = left }
draw Text { name = "v2"; pos = (3, 0.5); text = mark(isPrime); size = 1.15; align = right; color = cPrime }
draw Text { name = "l3"; pos = (-6.5, -0.8); text = "точный квадрат"; size = 1.15; align = left }
draw Text { name = "v3"; pos = (3, -0.8); text = mark(isSquare); size = 1.15; align = right; color = cSquare }
draw Text { name = "l4"; pos = (-6.5, -2.1); text = "точный куб"; size = 1.15; align = left }
draw Text { name = "v4"; pos = (3, -2.1); text = mark(isCube); size = 1.15; align = right; color = cCube }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 1; max = 60; step = 1; default = 12 }

float n = 12;
float isEven = 0; float isPrime = 0; float isSquare = 0; float isCube = 0;
string cEven = "#6b7280"; string cPrime = "#6b7280"; string cSquare = "#6b7280"; string cCube = "#6b7280";
string info = "";

Function isPrimeF(v) {
  if (v < 2) { return 0; }
  float ok = 1; float d = 2;
  repeat (60) { if (d * d <= v && ok == 1) { if (v - floor(v / d) * d == 0) { ok = 0; } } d = d + 1; }
  return ok;
}
Function mark(b) { if (b > 0.5) { return "да"; } return "нет"; }
Function col(b) { if (b > 0.5) { return "#22c55e"; } return "#6b7280"; }

Update {
  isEven = 0; if (n - floor(n / 2) * 2 == 0) { isEven = 1; }
  isPrime = isPrimeF(n);
  float r = round(sqrt(n)); isSquare = 0; if (r * r == n) { isSquare = 1; }
  float c = round(pow(n, 1 / 3)); isCube = 0; if (c * c * c == n) { isCube = 1; }

  cEven = "#6b7280"; if (isEven > 0.5) { cEven = "#22c55e"; }
  cPrime = "#6b7280"; if (isPrime > 0.5) { cPrime = "#22c55e"; }
  cSquare = "#6b7280"; if (isSquare > 0.5) { cSquare = "#22c55e"; }
  cCube = "#6b7280"; if (isCube > 0.5) { cCube = "#22c55e"; }

  string yes = ""; float any = 0;
  if (isEven > 0.5) { if (any > 0.5) { yes = yes + ", "; } yes = yes + "чётное"; any = 1; }
  if (isPrime > 0.5) { if (any > 0.5) { yes = yes + ", "; } yes = yes + "простое"; any = 1; }
  if (isSquare > 0.5) { if (any > 0.5) { yes = yes + ", "; } yes = yes + "точный квадрат"; any = 1; }
  if (isCube > 0.5) { if (any > 0.5) { yes = yes + ", "; } yes = yes + "точный куб"; any = 1; }
  if (any < 0.5) { yes = "ни одного из перечисленных"; }

  info = "**Свойство** — характеристика, которой объект (здесь — число n) либо обладает, либо нет. Каждое свойство относится к самому объекту и не связывает его с другими утверждениями, поэтому свойства перечисляются независимо друг от друга — в отличие от теоремы, соединяющей разные факты в вывод.\n\nУ n = " + format(n, 0) + " выполняются: " + yes + ".";
}
]
