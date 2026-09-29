[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Чертёж многогранника при параллельном проектировании: видимые рёбра — сплошные, невидимые — бледные,
// рёбра, параллельные выбранному, — жёлтые (на чертеже они остаются параллельными). ----
draw Graph { name = "gH"; graph = "gh"; edgeColor = #3b82f6cc; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gHa"; graph = "gha"; edgeColor = #f59e0b88; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gV"; graph = "gv"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gVa"; graph = "gva"; edgeColor = #f59e0b; edgeWidth = 4.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 11 }
draw Graph { name = "gN"; graph = "gn"; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Text { name = "tv0"; pos = (lx(0), ly(0)); text = lab(0); size = 1.1; active = 0 < nv && vs[0] > 0.5; layer = 25 }
draw Text { name = "tv1"; pos = (lx(1), ly(1)); text = lab(1); size = 1.1; active = 1 < nv && vs[1] > 0.5; layer = 25 }
draw Text { name = "tv2"; pos = (lx(2), ly(2)); text = lab(2); size = 1.1; active = 2 < nv && vs[2] > 0.5; layer = 25 }
draw Text { name = "tv3"; pos = (lx(3), ly(3)); text = lab(3); size = 1.1; active = 3 < nv && vs[3] > 0.5; layer = 25 }
draw Text { name = "tv4"; pos = (lx(4), ly(4)); text = lab(4); size = 1.1; active = 4 < nv && vs[4] > 0.5; layer = 25 }
draw Text { name = "tv5"; pos = (lx(5), ly(5)); text = lab(5); size = 1.1; active = 5 < nv && vs[5] > 0.5; layer = 25 }
draw Text { name = "tv6"; pos = (lx(6), ly(6)); text = lab(6); size = 1.1; active = 6 < nv && vs[6] > 0.5; layer = 25 }
draw Text { name = "tv7"; pos = (lx(7), ly(7)); text = lab(7); size = 1.1; active = 7 < nv && vs[7] > 0.5; layer = 25 }
draw Text { name = "tv8"; pos = (lx(8), ly(8)); text = lab(8); size = 1.1; active = 8 < nv && vs[8] > 0.5; layer = 25 }
draw Text { name = "tv9"; pos = (lx(9), ly(9)); text = lab(9); size = 1.1; active = 9 < nv && vs[9] > 0.5; layer = 25 }
draw Text { name = "tv10"; pos = (lx(10), ly(10)); text = lab(10); size = 1.1; active = 10 < nv && vs[10] > 0.5; layer = 25 }
draw Text { name = "tv11"; pos = (lx(11), ly(11)); text = lab(11); size = 1.1; active = 11 < nv && vs[11] > 0.5; layer = 25 }

new UI { name = "sSh"; type = select; label = "тело"; variable = sh; options = (0, 1, 2, 3, 4); labels = ("тетраэдр", "куб", "октаэдр", "призма", "пирамида"); default = 1 }
new UI { name = "sAz"; type = slider; label = "поворот вокруг вертикали"; variable = az; min = -180; max = 180; step = 1; default = 35 }
new UI { name = "sEl"; type = slider; label = "высота взгляда"; variable = el; min = 0; max = 90; step = 1; default = 25 }
new UI { name = "sK"; type = slider; label = "ребро №"; variable = k; min = 1; max = ne; step = 1; default = 1 }

float az = 35; float el = 25; float k = 1; float key = -1; string info = "";
float S = 2.6;
list sx = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list sy = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list vs = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
Function lx(v) { float d = sqrt(sx[v] * sx[v] + sy[v] * sy[v]) + 0.001; return sx[v] + 0.6 * sx[v] / d; }
Function ly(v) { float d = sqrt(sx[v] * sx[v] + sy[v] * sy[v]) + 0.001; return sy[v] + 0.6 * sy[v] / d; }

list gx = (0.9, 0.9, -0.9, -0.9, -0.9, -0.9, -0.9, -0.9, 0.9, 0.9, 0.9, 0.9, 1.25, -1.25, 0, 0, 0, 0, -1.1, 1.1, 0, -1.1, 1.1, 0, -1, 1, 1, -1, 0, -1.2, 1.2, 1.2, 0, 0, -1.2, -1.2, 1.2, 1.2, 0, 0, -1.2);
list gy = (0.9, -0.9, 0.9, -0.9, -0.9, -0.9, 0.9, 0.9, -0.9, -0.9, 0.9, 0.9, 0, 0, 1.25, -1.25, 0, 0, -0.9, -0.9, -0.9, 0.9, 0.9, 0.9, -0.8, -0.8, -0.8, -0.8, 1.2, -0.7, -0.7, -0.7, -0.7, -0.7, -0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7);
list gz = (0.9, -0.9, -0.9, 0.9, -0.9, 0.9, -0.9, 0.9, -0.9, 0.9, -0.9, 0.9, 0, 0, 0, 0, 1.25, -1.25, -0.7, -0.7, 1, -0.7, -0.7, 1, -1, -1, 1, 1, 0, -1.2, -1.2, 0, 0, 1.2, 1.2, -1.2, -1.2, 0, 0, 1.2, 1.2);
list fl = (3, 0, 1, 2, 3, 3, 1, 0, 3, 0, 2, 3, 3, 3, 2, 1, 4, 0, 1, 3, 2, 4, 6, 7, 5, 4, 4, 0, 4, 5, 1, 4, 3, 7, 6, 2, 4, 2, 6, 4, 0, 4, 1, 5, 7, 3, 3, 0, 2, 4, 3, 5, 2, 0, 3, 4, 3, 0, 3, 0, 3, 5, 3, 4, 2, 1, 3, 1, 2, 5, 3, 1, 3, 4, 3, 5, 3, 1, 3, 0, 1, 2, 3, 5, 4, 3, 4, 3, 4, 1, 0, 4, 4, 5, 2, 1, 4, 5, 3, 0, 2, 4, 0, 1, 2, 3, 3, 4, 1, 0, 3, 4, 2, 1, 3, 4, 3, 2, 3, 4, 0, 3, 6, 0, 1, 2, 3, 4, 5, 6, 6, 7, 8, 9, 10, 11, 4, 6, 7, 1, 0, 4, 7, 8, 2, 1, 4, 8, 9, 3, 2, 4, 9, 10, 4, 3, 4, 10, 11, 5, 4, 4, 11, 6, 0, 5);
list fnx = (0.5774, 0.5774, -0.5774, -0.5774, -1, 1, 0, 0, 0, 0, 0.5774, 0.5774, 0.5774, 0.5774, -0.5774, -0.5774, -0.5774, -0.5774, 0, 0, 0, 0.8396, -0.8396, 0, 0, 0.8944, 0, -0.8944, 0, 0, 0, 1, 0, 1, 0, -1);
list fny = (0.5774, -0.5774, 0.5774, -0.5774, 0, 0, -1, 1, 0, 0, 0.5774, 0.5774, -0.5774, -0.5774, 0.5774, 0.5774, -0.5774, -0.5774, -1, 1, 0, 0, 0, -1, 0.4472, 0.4472, 0.4472, 0.4472, -1, -1, 0, 0, 0, 0, 0, 0);
list fnz = (-0.5774, 0.5774, 0.5774, -0.5774, 0, 0, 0, 0, -1, 1, 0.5774, -0.5774, 0.5774, -0.5774, 0.5774, -0.5774, 0.5774, -0.5774, 0, 0, -1, 0.5433, 0.5433, 0, -0.8944, 0, 0.8944, 0, 0, 0, -1, 0, 1, 0, 1, 0);
list snv = (4, 8, 6, 6, 5, 12);
list snf = (4, 6, 8, 5, 5, 8);
list sfl = (16, 30, 32, 23, 21, 44);

// ---- общая часть: данные тел и вспомогательные функции ----
float sh = 1; float shKey = -1; float ov = 0; float ol = 0; float fo = 0; float nv = 0; float nfc = 0; float ne = 0;
list fp = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list ea = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list eb = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list ef = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list eg = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
float ca = 1; float sa = 0; float ce = 1; float se = 0;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function lab(k) { if (k < 1) { return "A"; } if (k < 2) { return "B"; } if (k < 3) { return "C"; } if (k < 4) { return "D"; } if (k < 5) { return "E"; } if (k < 6) { return "F"; } if (k < 7) { return "G"; } if (k < 8) { return "H"; } if (k < 9) { return "I"; } if (k < 10) { return "J"; } if (k < 11) { return "K"; } return "L"; }
Function shName(s) { if (s < 1) { return "тетраэдр"; } if (s < 2) { return "куб"; } if (s < 3) { return "октаэдр"; } if (s < 4) { return "треугольная призма"; } if (s < 5) { return "четырёхугольная пирамида"; } return "Г-образная призма"; }
Function vX(k) { return gx[ov + k]; }
Function vY(k) { return gy[ov + k]; }
Function vZ(k) { return gz[ov + k]; }
Function prx(x, y, z) { return x * ca + z * sa; }
Function pry(x, y, z) { return y * ce - (z * ca - x * sa) * se; }
Function prz(x, y, z) { return y * se + (z * ca - x * sa) * ce; }
Function nzv(f) { return fny[fo + f] * se + (fnz[fo + f] * ca - fnx[fo + f] * sa) * ce; }
Function hasVert(g, v) {
  float q = fp[g]; float n = fl[q]; float r = 0;
  repeat (n) { if (fl[q + 1 + i] == v) { r = 1; } }
  return r;
}
// направлено ли ребро a→b в грани g
Function hasEdge(g, a, b) {
  float q = fp[g]; float n = fl[q]; float r = 0;
  repeat (n) { if (fl[q + 1 + i] == a && fl[q + 1 + (i + 1) - n * floor((i + 1) / n)] == b) { r = 1; } }
  return r;
}
// загрузить тело sh: смещения, позиции граней, список рёбер (a < b) и двух граней каждого ребра
Function load() {
  ov = 0; ol = 0; fo = 0;
  repeat (sh) { ov = ov + snv[i]; ol = ol + sfl[i]; fo = fo + snf[i]; }
  nv = snv[sh]; nfc = snf[sh];
  float p = ol;
  repeat (nfc) { fp[i] = p; p = p + fl[p] + 1; }
  ne = 0;
  repeat (nfc) {
    float f = i; float q = fp[f]; float n = fl[q];
    repeat (n) {
      float a = fl[q + 1 + i]; float b = fl[q + 1 + (i + 1) - n * floor((i + 1) / n)];
      if (a < b) {
        ea[ne] = a; eb[ne] = b; ef[ne] = f;
        repeat (nfc) { if (hasEdge(i, b, a) > 0.5) { eg[ne] = i; } }
        ne = ne + 1;
      }
    }
  }
}

Update {
  if (shKey != sh) { load(); shKey = sh; key = -1; }
  if (k > ne) { k = ne; }
  float kk = k - 1;
  float nk = az * 1000000 + el * 1000 + sh * 100 + k;
  if (key != nk) {
    key = nk;
    ca = cos(az * pi / 180); sa = sin(az * pi / 180); ce = cos(el * pi / 180); se = sin(el * pi / 180);
    gh = newGraph(); gha = newGraph(); gv = newGraph(); gva = newGraph(); gn = newGraph();
    repeat (nv) {
      string s = "v" + format(i, 0);
      float x = prx(vX(i), vY(i), vZ(i)) * S; float y = pry(vX(i), vY(i), vZ(i)) * S; sx[i] = x; sy[i] = y; vs[i] = 0;
      addNode(gh, s, [x, y]); addNode(gha, s, [x, y]); addNode(gv, s, [x, y]); addNode(gva, s, [x, y]);
    }
    // выбранное ребро и его направление
    float dx0 = vX(eb[kk]) - vX(ea[kk]); float dy0 = vY(eb[kk]) - vY(ea[kk]); float dz0 = vZ(eb[kk]) - vZ(ea[kk]);
    float nvis = 0; float npar = 0; float npt = 0;
    repeat (ne) {
      float a = ea[i]; float b = eb[i];
      float vis = 0; if (nzv(ef[i]) > 0 || nzv(eg[i]) > 0) { vis = 1; }
      float dx = vX(b) - vX(a); float dy = vY(b) - vY(a); float dz = vZ(b) - vZ(a);
      float cx = dy * dz0 - dz * dy0; float cy = dz * dx0 - dx * dz0; float cz = dx * dy0 - dy * dx0;
      float par = 0; if (cx * cx + cy * cy + cz * cz < 0.0001) { par = 1; }
      float ex = (prx(vX(b), vY(b), vZ(b)) - prx(vX(a), vY(a), vZ(a))) * S; float ey = (pry(vX(b), vY(b), vZ(b)) - pry(vX(a), vY(a), vZ(a))) * S;
      if (ex * ex + ey * ey < 0.01) { npt = npt + 1; }
      if (vis > 0.5) { nvis = nvis + 1; }
      if (par > 0.5) { npar = npar + 1; }
      string ka = "v" + format(a, 0); string kb = "v" + format(b, 0);
      if (vis > 0.5 && par < 0.5) { addEdge(gv, ka, kb); }
      if (vis > 0.5 && par > 0.5) { addEdge(gva, ka, kb); }
      if (vis < 0.5 && par < 0.5) { addEdge(gh, ka, kb); }
      if (vis < 0.5 && par > 0.5) { addEdge(gha, ka, kb); }
    }
    // видимые вершины — принадлежат хотя бы одной лицевой грани
    repeat (nv) {
      float v = i; float seen = 0;
      repeat (nfc) { if (nzv(i) > 0 && hasVert(i, v) > 0.5) { seen = 1; } }
      vs[v] = seen;
      if (seen > 0.5) { addNode(gn, "n" + format(v, 0), [prx(vX(v), vY(v), vZ(v)) * S, pry(vX(v), vY(v), vZ(v)) * S], lab(v)); }
    }
    info = "**" + shName(sh) + ":** " + format(nv, 0) + " вершин, " + format(ne, 0) + " рёбер, " + format(nfc, 0) + " граней. На чертеже все рёбра на месте: " + format(nvis, 0) + " видимых (сплошные) и " + format(ne - nvis, 0) + " невидимых (бледные), причём связность вершин и рёбер та же, что у тела.\n\n";
    info = info + "**Параллельность сохраняется.** Рёбер тела, параллельных ребру " + lab(ea[kk]) + lab(eb[kk]) + ", кроме него самого: " + format(npar - 1, 0) + " (жёлтые). При параллельном проектировании параллельные прямые изображаются параллельными, а отношение длин параллельных отрезков не меняется.";
    if (npt > 0.5) { info = info + " Рёбер, параллельных направлению проектирования, — " + format(npt, 0) + ": они изображаются точками."; }
  }
}
]
