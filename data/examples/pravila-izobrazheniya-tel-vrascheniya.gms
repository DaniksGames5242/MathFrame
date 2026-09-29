[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Тело вращения (ось вертикальна) при ортогональном проектировании: наклон взгляда ε — угол между направлением взгляда и плоскостью,
// перпендикулярной оси. Видимые линии — сплошные, невидимые — бледные; жёлтая параллель — сечение, перпендикулярное оси. ----
draw Graph { name = "gAx"; graph = "gax"; edgeColor = #3b82f6; edgeWidth = 1; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Graph { name = "gD"; graph = "gd"; edgeColor = #3b82f6cc; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gPh"; graph = "gph"; edgeColor = #f59e0b88; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gS"; graph = "gs"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gP"; graph = "gp"; edgeColor = #f59e0b; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 11 }

new UI { name = "sB"; type = select; label = "тело"; variable = bd; options = (0, 1, 2); labels = ("цилиндр", "конус", "шар"); default = 0 }
new UI { name = "sE"; type = slider; label = "угол взгляда ε, °"; variable = el; min = 0; max = 90; step = 1; default = 30 }
new UI { name = "sH"; type = slider; label = "параллель на высоте"; variable = hf; min = 0.05; max = 0.95; step = 0.01; default = 0.4 }

float bd = 0; float el = 30; float hf = 0.4; float key = -1; string info = "";
float ce = 1; float se = 0; float R = 2.3; float H = 5;

// кольцо радиуса r на высоте y: в graph g — видимые дуги, в gh — невидимые; nr, ny — компоненты нормали поверхности (лицевая часть: ny·sinε + nr·sin t·cosε > 0)
Function ring(g, gh, name, y, r, nr, ny, force) {
  float n = 72;
  repeat (n + 1) {
    float t = 2 * pi * i / n;
    string s = name + format(i, 0);
    addNode(g, s, [r * cos(t), y * ce - r * sin(t) * se]); addNode(gh, s, [r * cos(t), y * ce - r * sin(t) * se]);
  }
  repeat (n) {
    float tm = 2 * pi * (i + 0.5) / n;
    string a = name + format(i, 0); string b = name + format(i + 1, 0);
    if (force > 0.5 || ny * se + nr * sin(tm) * ce > 0) { addEdge(g, a, b); } else { addEdge(gh, a, b); }
  }
}
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  float nk = bd * 100000 + el * 1000 + hf * 100;
  if (key != nk) {
    key = nk;
    ce = cos(el * pi / 180); se = sin(el * pi / 180);
    gs = newGraph(); gd = newGraph(); gp = newGraph(); gph = newGraph(); gax = newGraph();
    float y0 = 0; float rp = 0; float yp = 0; float ext = 0;
    if (bd < 0.5) {
      R = 2.3; H = 5; yp = -H / 2 + hf * H; rp = R;
      ring(gs, gd, "t", H / 2, R, 1, 0, 1); ring(gs, gd, "b", -H / 2, R, 1, 0, 0);
      addNode(gs, "l1", [-R, H / 2 * ce]); addNode(gs, "l2", [-R, -H / 2 * ce]); addEdge(gs, "l1", "l2");
      addNode(gs, "r1", [R, H / 2 * ce]); addNode(gs, "r2", [R, -H / 2 * ce]); addEdge(gs, "r1", "r2");
      ext = H / 2 + 0.6;
      ring(gp, gph, "p", yp, rp, 1, 0, 0);
    }
    if (bd > 0.5 && bd < 1.5) {
      R = 2.4; H = 5.2; yp = -H / 2 + hf * H; rp = R * (1 - hf);
      ring(gs, gd, "b", -H / 2, R, H, R, 0);
      float q = R * se / (H * ce + 0.000001);
      if (ce > 0.001 && q <= 1) {
        float t1 = asin(-q); float t2 = pi - t1;
        addNode(gs, "ap", [0, H / 2 * ce]);
        addNode(gs, "c1", [R * cos(t1), -H / 2 * ce - R * sin(t1) * se]); addEdge(gs, "ap", "c1");
        addNode(gs, "c2", [R * cos(t2), -H / 2 * ce - R * sin(t2) * se]); addEdge(gs, "ap", "c2");
      }
      ext = H / 2 + 0.6;
      ring(gp, gph, "p", yp, rp, H, R, 0);
    }
    if (bd > 1.5) {
      R = 3; H = 2 * R; yp = -R + hf * 2 * R; rp = sqrt(R * R - yp * yp);
      ring(gs, gd, "e", 0, R, R, 0, 0);
      ring(gs, gs, "c", 0, R, 0, 0, 1);
      ring(gp, gph, "p", yp, rp, rp, yp, 0);
      ext = R + 0.6;
    }
    if (ce > 0.02) { addNode(gax, "x1", [0, ext * ce]); addNode(gax, "x2", [0, -ext * ce]); addEdge(gax, "x1", "x2"); }
    // параллель — эллипс с полуосями rp и rp·sin ε
    string nm = "цилиндра"; if (bd > 0.5) { nm = "конуса"; } if (bd > 1.5) { nm = "шара"; }
    info = "**Параллель** радиуса " + format(rp, 2) + " лежит в плоскости, перпендикулярной оси. При ε = " + format(el, 0) + "° она изображается эллипсом с полуосями " + format(rp, 2) + " и " + format(rp * se, 2) + " (жёлтая линия): его большая ось — истинный диаметр параллели, горизонтальна и перпендикулярна изображению оси. При ε = 90° (взгляд вдоль оси) это окружность, при ε = 0° — отрезок длины 2r.\n\n";
    if (bd < 0.5) { info = info + "**Цилиндр:** контур — два отрезка-образующих длины " + format(H * ce, 2) + " и эллипсы оснований; невидимая часть нижнего основания показана бледной дугой."; }
    if (bd > 0.5 && bd < 1.5) {
      if (ce > 0.001 && R * se / (H * ce) <= 1) { info = info + "**Конус:** контур — две образующие, касательные к эллипсу основания (проведены из вершины), и видимая часть эллипса."; }
      else { info = info + "**Конус:** при таком угле взгляда вершина проецируется внутрь эллипса основания, и образующих в контуре нет — контур совпадает с эллипсом основания."; }
    }
    if (bd > 1.5) { info = info + "**Шар:** контур — окружность радиуса " + format(R, 2) + " при любом положении наблюдателя; экватор — эллипс с полуосями " + format(R, 2) + " и " + format(R * se, 2) + ", его невидимая половина показана бледной дугой."; }
  }
}
]
