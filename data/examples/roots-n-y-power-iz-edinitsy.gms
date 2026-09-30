[
description = "{info}"
field width = 5.6; field height = 3.5;
camera type = fixed;
show axes = true; show grid = true;
string info = ""; float n = 6; float k = 1; float pn = 0; float pk = 0;

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "cr"; center = O; radius = 1; interact = false }
draw Graph { name = "gstar"; graph = "gs"; nodeRadius = 0; edgeWidth = 2; edgeColor = #f59e0b; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gall"; graph = "ga"; nodeRadius = 5; nodeColor = #3b82f6; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gsub"; graph = "gb"; nodeRadius = 8; nodeColor = #22c55e; labels = false; interactive = false; showWeights = false; layer = 6 }
draw Graph { name = "gprim"; graph = "gp"; nodeColor = #f59e0b; nodeRadius = 10; labels = false; interactive = false; showWeights = false; layer = 7 }
new UI { name = "sn"; type = slider; label = "n"; variable = n; min = 1; max = 12; step = 1; default = 6 }
new UI { name = "sk"; type = slider; label = "k"; variable = k; min = 1; max = 12; step = 1; default = 1 }

Function num(v) { if (v < 0) { return "−" + format(-v, 2); } return format(v, 2); }
Function term(v) { if (v < 0) { return " − " + format(-v, 2); } return " + " + format(v, 2); }
Function gcd(x, y) { float p = x; float q = y;
  repeat (20) { if (q > 0.5) { float t = q; q = p - q * floor(p / q); p = t; } }
  return p; }

Update {
  if (n != pn || k != pk) {
    pn = n; pk = k;
    float kk = k - n * floor(k / n);
    float d = gcd(kk, n);
    ga = newGraph(); gb = newGraph(); gs = newGraph(); gp = newGraph();
    float j = 0;
    repeat (12) {
      if (j < n) {
        float ang = 6.283185307 * j / n;
        addNode(ga, "a" + format(j, 0), [cos(ang), sin(ang)]);
        float md = j - d * floor(j / d);
        if (md < 0.5) { addNode(gb, "b" + format(j, 0), [cos(ang), sin(ang)]); }
        if (kk > 0.5) { addNode(gs, "s" + format(j, 0), [cos(ang), sin(ang)]); }
      }
      j = j + 1;
    }
    j = 0;
    repeat (12) {
      if (j < n && kk > 0.5) {
        float jn = j + kk - n * floor((j + kk) / n);
        addEdge(gs, "s" + format(j, 0), "s" + format(jn, 0), 1);
      }
      j = j + 1;
    }
    addNode(gp, "z", [cos(6.283185307 / n), sin(6.283185307 / n)]);
  }
  float kk2 = k - n * floor(k / n);
  float d2 = gcd(kk2, n);
  float ang1 = 6.283185307 / n;
  float angk = ang1 * kk2;
  info = "**Корни n-й степени из единицы** — решения уравнения zⁿ = 1. Их ровно n, все они лежат на единичной окружности и образуют правильный n-угольник; соседние корни отличаются поворотом на 360°/n = " + format(360 / n, 1) + "°.\n\n";
  info = info + "Первообразный корень ζ = cos(360°/n) + i·sin(360°/n) = " + num(cos(ang1)) + term(sin(ang1)) + "i (оранжевая точка); остальные корни — ζ⁰, ζ¹, …, ζⁿ⁻¹.\n\n";
  if (kk2 < 0.5) {
    info = info + "При k = " + format(k, 0) + " показатель кратен n: ζᵏ = 1, результат — одна точка.";
  } else {
    info = info + "При k = " + format(k, 0) + ": ζᵏ = " + num(cos(angk)) + term(sin(angk)) + "i. Степени ζᵏ пробегают " + format(n / d2, 0) + " различных корней (n / НОД(k, n) = " + format(n, 0) + " / " + format(d2, 0) + ") — они зелёные, ломаная соединяет ζʲ с ζʲ⁺ᵏ.";
  }
}
]
