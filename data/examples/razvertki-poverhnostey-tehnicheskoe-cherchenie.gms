[
description = "{info}"

field width = 24;
field height = 16;
camera type = fixed;

// ---- Слева — вид тела (фронтальный вид и вид сверху с точкой M на основании), справа —
// развёртка боковой поверхности с полным комплектом: цилиндр (прямоугольник) или конус
// (сектор). Точка M на окружности основания переходит в точку на краю развёртки, а
// образующая через неё — в отрезок. ----
draw Graph { name = "gL"; graph = "gl"; edgeWidth = 2; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #3b82f6; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false }
draw Graph { name = "gG"; graph = "gg"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 1 }
new Point { name = "Md"; pos = (0, 0); text = true("M"); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "Mt"; pos = (0, 0); text = true("M"); dynamic = false; collision = false; color = #f59e0b }

new UI { name = "btnCyl"; type = button; label = "Цилиндр"; action = "tab = 1" }
new UI { name = "btnCone"; type = button; label = "Конус"; action = "tab = 2" }
new UI { name = "sR"; type = slider; label = "радиус основания R"; variable = R; min = 0.5; max = 1.6; step = 0.1; default = 1.2 }
new UI { name = "sH"; type = slider; label = "высота H"; variable = H; min = 1; max = 6; step = 0.5; default = 4; active = tab == 1 }
new UI { name = "sL"; type = slider; label = "образующая l"; variable = L; min = 2.2 * R; max = 6; step = 0.1; default = 4.5; active = tab == 2 }
new UI { name = "sAl"; type = slider; label = "положение M на основании α°"; variable = al; min = 0; max = 360; step = 5; default = 110 }

float tab = 1; float R = 1.2; float H = 4; float L = 4.5; float al = 110;
float pt = -1; float pr = -1; float ph = -1; float pl = -1; float pa = -1;
string info = "";
float xL = -7.5; float xD = 3.5; float eb = -1; float cyT = -4.5;

Function arc(g, pre, cx, cy, r, a0, a1) {
  repeat (41) {
    float t = a0 + (a1 - a0) * i / 40;
    addNode(g, pre + i, [cx + r * cos(t), cy + r * sin(t)]);
    if (i > 0) { addEdge(g, pre + (i - 1), pre + i); }
  }
}

Update {
  if (pt != tab || pr != R || ph != H || pl != L || pa != al) {
    pt = tab; pr = R; ph = H; pl = L; pa = al;
    float a = radians(al);
    gl = newGraph(); gd = newGraph(); gg = newGraph();
    // вид сверху: окружность основания, засечка разреза и точка M
    arc(gl, "c", xL, cyT, R, 0, 6.2832);
    addNode(gl, "z1", [xL + R - 0.2, cyT]); addNode(gl, "z2", [xL + R + 0.4, cyT]); addEdge(gl, "z1", "z2");
    Mt.pos.x = xL + R * cos(a); Mt.pos.y = cyT + R * sin(a);
    if (tab == 1) {
      // фронтальный вид: прямоугольник 2R × H
      addNode(gl, "e1", [xL - R, eb]); addNode(gl, "e2", [xL + R, eb]); addNode(gl, "e3", [xL + R, eb + H]); addNode(gl, "e4", [xL - R, eb + H]);
      addEdge(gl, "e1", "e2"); addEdge(gl, "e2", "e3"); addEdge(gl, "e3", "e4"); addEdge(gl, "e4", "e1");
      // развёртка: прямоугольник 2πR × H и два круга основания
      float w = 6.2832 * R; float x0 = xD - w / 2;
      addNode(gd, "d1", [x0, -H / 2]); addNode(gd, "d2", [x0 + w, -H / 2]); addNode(gd, "d3", [x0 + w, H / 2]); addNode(gd, "d4", [x0, H / 2]);
      addEdge(gd, "d1", "d2"); addEdge(gd, "d2", "d3"); addEdge(gd, "d3", "d4"); addEdge(gd, "d4", "d1");
      arc(gd, "u", xD, H / 2 + R, R, 0, 6.2832);
      arc(gd, "v", xD, -H / 2 - R, R, 0, 6.2832);
      float mx = x0 + R * a;
      addNode(gg, "g1", [mx, -H / 2]); addNode(gg, "g2", [mx, H / 2]); addEdge(gg, "g1", "g2");
      Md.pos.x = mx; Md.pos.y = -H / 2;
    } else {
      float h = sqrt(L * L - R * R); float phi = R / L * 6.2832;
      addNode(gl, "e1", [xL - R, eb]); addNode(gl, "e2", [xL + R, eb]); addNode(gl, "e3", [xL, eb + h]);
      addEdge(gl, "e1", "e2"); addEdge(gl, "e2", "e3"); addEdge(gl, "e3", "e1");
      // развёртка: сектор радиуса l с углом 2πR/l и круг основания, касающийся дуги
      float cy = (L + 2 * R) / 2; float a0 = -1.5708 - phi / 2;
      addNode(gd, "s0", [xD, cy]); addNode(gd, "s1", [xD + L * cos(a0), cy + L * sin(a0)]); addEdge(gd, "s0", "s1");
      arc(gd, "a", xD, cy, L, a0, a0 + phi);
      addNode(gd, "s2", [xD + L * cos(a0 + phi), cy + L * sin(a0 + phi)]); addEdge(gd, "s2", "s0");
      arc(gd, "b", xD, cy - L - R, R, 0, 6.2832);
      float am = a0 + R * a / L;
      addNode(gg, "g1", [xD, cy]); addNode(gg, "g2", [xD + L * cos(am), cy + L * sin(am)]); addEdge(gg, "g1", "g2");
      Md.pos.x = xD + L * cos(am); Md.pos.y = cy + L * sin(am);
    }
  }
  float s = R * radians(al);
  if (tab == 1) {
    info = "**Развёртка цилиндра** — прямоугольник со сторонами 2πR = " + format(6.2832 * R, 2) + " и H = " + format(H, 1) + ": площадь боковой поверхности 2πRH = " + format(6.2832 * R * H, 2) + " сохраняется, длины кривых тоже.\n\nТочка M на окружности основания на дуге s = R · α = " + format(s, 2) + " от разреза попадает на нижнюю сторону прямоугольника на расстоянии s от края, а образующая через неё становится вертикальным отрезком длины H.\n\nЦилиндр и конус развёртываются потому, что их гауссова кривизна равна нулю; сфера и тор не развёртываются без искажений.";
  } else {
    info = "**Развёртка конуса** — круговой сектор радиуса l = " + format(L, 1) + " (длина образующей) с центральным углом φ = 360° · R / l = " + format(360 * R / L, 1) + "°; его дуга длины 2πR = " + format(6.2832 * R, 2) + " — развёрнутая окружность основания.\n\nПлощадь боковой поверхности πRl = " + format(3.1416 * R * L, 2) + " сохраняется. Точка M на дуге s = R · α = " + format(s, 2) + " от разреза попадает на дугу сектора на том же расстоянии s от края, а образующая через неё — на радиус сектора.\n\nКонус и цилиндр развёртываются потому, что их гауссова кривизна равна нулю; сфера и тор не развёртываются без искажений.";
  }
}
]
