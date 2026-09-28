[
description = "{info}"

field width = 18;
field height = 11;
camera type = fixed;

// ---- Три ползунка задают длины отрезков a, b, c. Они откладываются подряд на нижней
// прямой (наглядно — как ломаная); если неравенство треугольника выполняется, из них
// строится настоящий треугольник (пересечение окружностей радиусов a и c вокруг концов
// стороны b), иначе треугольник скрывается и видно, что отрезки не могут сомкнуться. ----
new UI { name = "sa"; type = slider; label = "a"; variable = av; min = 1; max = 9; step = 0.1; default = 4 }
new UI { name = "sb"; type = slider; label = "b"; variable = bv; min = 1; max = 9; step = 0.1; default = 5 }
new UI { name = "sc"; type = slider; label = "c"; variable = cv; min = 1; max = 9; step = 0.1; default = 6 }

new Point { name = "A"; pos = (-7, -3); dynamic = false; collision = false; text = true("A") }
new Point { name = "B"; pos = (0, -3); dynamic = false; collision = false; text = true("B") }
new Point { name = "C"; pos = (0, 0); dynamic = false; collision = false; text = true("C"); active = ok > 0.5 }

new Line { name = "ab"; pos = (A, B); interact = false }
new Line { name = "bc"; pos = (B, C); interact = false; active = ok > 0.5 }
new Line { name = "ca"; pos = (C, A); interact = false; active = ok > 0.5 }
new Figure { name = "abc"; elements = (ab, bc, ca); active = ok > 0.5 }

// ---- Логика ----
float av = 4; float bv = 5; float cv = 6;
float ok = 0;
string info = "";

Update {
  // b — основание, лежит от A до B; a — сторона BC, c — сторона CA.
  B.pos.x = A.pos.x + bv;
  float sum = av + bv + cv;
  float longest = max(av, max(bv, cv));
  ok = 0; if (longest < sum - longest) { ok = 1; }

  if (ok > 0.5) {
    // Вершина C — пересечение окружности радиуса cv вокруг A и радиуса av вокруг B.
    float d = bv;
    float x = (d * d + cv * cv - av * av) / (2 * d);
    float y2 = cv * cv - x * x;
    float y = sqrt(max(0, y2));
    C.pos.x = A.pos.x + x; C.pos.y = A.pos.y + y;
  } else {
    C.pos.x = A.pos.x + bv * 0.5; C.pos.y = A.pos.y + 1.5;
  }

  string sName = "a"; float sVal = av;
  if (bv >= av && bv >= cv) { sName = "b"; sVal = bv; }
  if (cv >= av && cv >= bv) { sName = "c"; sVal = cv; }

  info = "**Стороны:** a = " + format(av, 1) + ", b = " + format(bv, 1) + ", c = " + format(cv, 1) + ". Сумма двух меньших сторон — " + format(sum - sVal, 1) + ", наибольшая сторона " + sName + " = " + format(sVal, 1) + ".\n\n";
  if (ok > 0.5) {
    info = info + "**Неравенство треугольника выполнено** (сумма любых двух сторон больше третьей): треугольник существует и построен по трём сторонам.";
  } else if (abs(sum - 2 * sVal) < 0.05) {
    info = info + "**Равенство, а не строгое неравенство:** сумма двух меньших сторон равна наибольшей — точки лежат на одной прямой, треугольник вырожден.";
  } else {
    info = info + "**Неравенство треугольника нарушено:** сумма двух меньших сторон меньше наибольшей — отрезки такой длины не могут сомкнуться в треугольник.";
  }
}
]
