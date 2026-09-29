[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

draw Graph { name = "gH0"; graph = "gh0"; edgeColor = #3b82f6cc; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 4 }
draw Graph { name = "gH1"; graph = "gh1"; edgeColor = #f59e0b88; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gH2"; graph = "gh2"; edgeColor = #3b82f688; edgeWidth = 2.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gV0"; graph = "gv0"; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gV2"; graph = "gv2"; edgeColor = #3b82f6; edgeWidth = 4; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 11 }
draw Graph { name = "gV1"; graph = "gv1"; edgeColor = #f59e0b; edgeWidth = 5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 12 }
draw Graph { name = "gN3"; graph = "gn3"; nodeColor = #3b82f6cc; nodeRadius = 3; labels = false; interactive = false; showWeights = false; layer = 20 }
draw Graph { name = "gN0"; graph = "gn0"; nodeRadius = 4; labels = false; interactive = false; showWeights = false; layer = 21 }
draw Graph { name = "gN2"; graph = "gn2"; nodeColor = #3b82f6; nodeRadius = 6; labels = false; interactive = false; showWeights = false; layer = 22 }
draw Graph { name = "gN1"; graph = "gn1"; nodeColor = #f59e0b; nodeRadius = 8; labels = false; interactive = false; showWeights = false; layer = 23 }
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

new UI { name = "sSh"; type = select; label = "тело"; variable = sh; options = (0, 1, 2, 3, 4, 5); labels = ("тетраэдр", "куб", "октаэдр", "призма", "пирамида", "Г-образная призма"); default = 1 }
new UI { name = "sAz"; type = slider; label = "поворот вокруг вертикали"; variable = az; min = -180; max = 180; step = 1; default = 35 }
new UI { name = "sEl"; type = slider; label = "высота взгляда"; variable = el; min = 0; max = 90; step = 1; default = 25 }
new UI { name = "sK"; type = slider; label = "вершина №"; variable = k; min = 1; max = nv; step = 1; default = 1 }

float az = 35; float el = 25; float key = -1; string info = "";
float S = 2.6;
list sx = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list sy = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list vs = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list gx = (0.9, 0.9, -0.9, -0.9, -0.9, -0.9, -0.9, -0.9, 0.9, 0.9, 0.9, 0.9, 1.25, -1.25, 0, 0, 0, 0, -1.1, 1.1, 0, -1.1, 1.1, 0, -1, 1, 1, -1, 0, -1.2, 1.2, 1.2, 0, 0, -1.2, -1.2, 1.2, 1.2, 0, 0, -1.2);
list gy = (0.9, -0.9, 0.9, -0.9, -0.9, -0.9, 0.9, 0.9, -0.9, -0.9, 0.9, 0.9, 0, 0, 1.25, -1.25, 0, 0, -0.9, -0.9, -0.9, 0.9, 0.9, 0.9, -0.8, -0.8, -0.8, -0.8, 1.2, -0.7, -0.7, -0.7, -0.7, -0.7, -0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7);
list gz = (0.9, -0.9, -0.9, 0.9, -0.9, 0.9, -0.9, 0.9, -0.9, 0.9, -0.9, 0.9, 0, 0, 0, 0, 1.25, -1.25, -0.7, -0.7, 1, -0.7, -0.7, 1, -1, -1, 1, 1, 0, -1.2, -1.2, 0, 0, 1.2, 1.2, -1.2, -1.2, 0, 0, 1.2, 1.2);
list fl = (3, 0, 1, 2, 3, 3, 1, 0, 3, 0, 2, 3, 3, 3, 2, 1, 4, 0, 1, 3, 2, 4, 6, 7, 5, 4, 4, 0, 4, 5, 1, 4, 3, 7, 6, 2, 4, 2, 6, 4, 0, 4, 1, 5, 7, 3, 3, 0, 2, 4, 3, 5, 2, 0, 3, 4, 3, 0, 3, 0, 3, 5, 3, 4, 2, 1, 3, 1, 2, 5, 3, 1, 3, 4, 3, 5, 3, 1, 3, 0, 1, 2, 3, 5, 4, 3, 4, 3, 4, 1, 0, 4, 4, 5, 2, 1, 4, 5, 3, 0, 2, 4, 0, 1, 2, 3, 3, 4, 1, 0, 3, 4, 2, 1, 3, 4, 3, 2, 3, 4, 0, 3, 6, 11, 10, 9, 8, 7, 6, 6, 0, 1, 2, 3, 4, 5, 4, 10, 11, 5, 4, 4, 9, 10, 4, 3, 4, 8, 9, 3, 2, 4, 7, 8, 2, 1, 4, 6, 7, 1, 0, 4, 11, 6, 0, 5);
list snv = (4, 8, 6, 6, 5, 12);
list snf = (4, 6, 8, 5, 5, 8);
list sfl = (16, 30, 32, 23, 21, 44);
float sh = 1; float shKey = -1; float ov = 0; float ol = 0; float nv = 8; float nfc = 6; float ne = 12; float cvx = 1; float dy = -1.25;
list fp = (0, 0, 0, 0, 0, 0, 0, 0); list dg = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list vc = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list ar = (0, 0, 0, 0, 0, 0, 0, 0);
list nx = (0, 0, 0, 0, 0, 0, 0, 0); list ny = (0, 0, 0, 0, 0, 0, 0, 0); list nz = (0, 0, 0, 0, 0, 0, 0, 0);
list ea = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list eb = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list ef = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list eg = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); list ec = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
float ca = 1; float sa = 0; float ce = 1; float se = 0;
float k = 1;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function lab(k) { if (k < 1) { return "A"; } if (k < 2) { return "B"; } if (k < 3) { return "C"; } if (k < 4) { return "D"; } if (k < 5) { return "E"; } if (k < 6) { return "F"; } if (k < 7) { return "G"; } if (k < 8) { return "H"; } if (k < 9) { return "I"; } if (k < 10) { return "J"; } if (k < 11) { return "K"; } return "L"; }
Function shName(s) { if (s < 1) { return "Тетраэдр"; } if (s < 2) { return "Куб"; } if (s < 3) { return "Октаэдр"; } if (s < 4) { return "Треугольная призма"; } if (s < 5) { return "Четырёхугольная пирамида"; } return "Г-образная призма"; }
Function vX(k) { return gx[ov + k]; }
Function vY(k) { if (sh > 1.5 && sh < 2.5 && k > 2.5 && k < 3.5) { return dy; } return gy[ov + k]; }
Function vZ(k) { return gz[ov + k]; }
Function faceStr(f) { string s = ""; float q = fp[f]; float n = fl[q]; repeat (n) { s = s + lab(fl[q + 1 + i]); } return s; }
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
// нормали и площади граней (формула Ньютона), выпуклость тела: все вершины по одну сторону от плоскости каждой грани
Function geom() {
  repeat (nfc) {
    float f = i; float q = fp[f]; float n = fl[q]; float ax = 0; float ay = 0; float az0 = 0;
    repeat (n) {
      float a = fl[q + 1 + i]; float b = fl[q + 1 + (i + 1) - n * floor((i + 1) / n)];
      ax = ax + (vY(a) - vY(b)) * (vZ(a) + vZ(b));
      ay = ay + (vZ(a) - vZ(b)) * (vX(a) + vX(b));
      az0 = az0 + (vX(a) - vX(b)) * (vY(a) + vY(b));
    }
    float l = sqrt(ax * ax + ay * ay + az0 * az0);
    nx[f] = ax / l; ny[f] = ay / l; nz[f] = az0 / l; ar[f] = l / 2;
  }
  cvx = 1;
  repeat (nfc) { if (side(i) > 0) { cvx = 0; } }
}
// число вершин по «внешнюю» сторону плоскости грани f
Function side(f) {
  float p = fl[fp[f] + 1]; float c = 0;
  repeat (nv) { if (nx[f] * (vX(i) - vX(p)) + ny[f] * (vY(i) - vY(p)) + nz[f] * (vZ(i) - vZ(p)) > 0.0001) { c = c + 1; } }
  return c;
}
// загрузить тело sh: смещения, позиции граней, рёбра (a < b): грань ef содержит a→b, грань eg — b→a; порядки вершин
Function load() {
  ov = 0; ol = 0; float fo = 0;
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
  repeat (nv) { dg[i] = 0; }
  repeat (ne) { dg[ea[i]] = dg[ea[i]] + 1; dg[eb[i]] = dg[eb[i]] + 1; }
}
Function elen(e) { float a = ea[e]; float b = eb[e]; return sqrt((vX(b) - vX(a)) * (vX(b) - vX(a)) + (vY(b) - vY(a)) * (vY(b) - vY(a)) + (vZ(b) - vZ(a)) * (vZ(b) - vZ(a))); }
// двугранный угол при ребре e, радианы (больше π — при входящем ребре невыпуклого тела)
Function dih(e) {
  float f1 = ef[e]; float f2 = eg[e]; float a = ea[e]; float b = eb[e];
  float c = nx[f1] * nx[f2] + ny[f1] * ny[f2] + nz[f1] * nz[f2];
  if (c > 1) { c = 1; } if (c < -1) { c = -1; }
  float phi = acos(c);
  float sg = (ny[f1] * nz[f2] - nz[f1] * ny[f2]) * (vX(b) - vX(a)) + (nz[f1] * nx[f2] - nx[f1] * nz[f2]) * (vY(b) - vY(a)) + (nx[f1] * ny[f2] - ny[f1] * nx[f2]) * (vZ(b) - vZ(a));
  if (sg < 0) { return pi + phi; }
  return pi - phi;
}
// внутренний угол грани f при вершине v, радианы (от 0 до 2π; больше π — при входящем угле)
Function pang(f, v) {
  float q = fp[f]; float n = fl[q]; float r = 0;
  repeat (n) {
    if (fl[q + 1 + i] == v) {
      float p = fl[q + 1 + (i + n - 1) - n * floor((i + n - 1) / n)]; float s = fl[q + 1 + (i + 1) - n * floor((i + 1) / n)];
      float ux = vX(p) - vX(v); float uy = vY(p) - vY(v); float uz = vZ(p) - vZ(v);
      float wx = vX(s) - vX(v); float wy = vY(s) - vY(v); float wz = vZ(s) - vZ(v);
      float cs = ux * wx + uy * wy + uz * wz; float sn = (wy * uz - wz * uy) * nx[f] + (wz * ux - wx * uz) * ny[f] + (wx * uy - wy * ux) * nz[f];
      r = atan2(sn, cs); if (r < 0) { r = r + 2 * pi; }
    }
  }
  return r;
}
Function angSum(v) { float s = 0; repeat (nfc) { if (hasVert(i, v) > 0.5) { s = s + pang(i, v); } } return s * 180 / pi; }
float S0 = 0;
Function prx(x, y, z) { return x * ca + z * sa; }
Function pry(x, y, z) { return y * ce - (z * ca - x * sa) * se; }
Function nzv(f) { return ny[f] * se + (nz[f] * ca - nx[f] * sa) * ce; }
Function lx(v) { float d = sqrt(sx[v] * sx[v] + sy[v] * sy[v]) + 0.001; return sx[v] + 0.6 * sx[v] / d; }
Function ly(v) { float d = sqrt(sx[v] * sx[v] + sy[v] * sy[v]) + 0.001; return sy[v] + 0.6 * sy[v] / d; }
Function dgMin() { float m = 99; repeat (nv) { if (dg[i] < m) { m = dg[i]; } } return m; }
Function dgMax() { float m = 0; repeat (nv) { if (dg[i] > m) { m = dg[i]; } } return m; }

Update {
  if (shKey != sh) { load(); shKey = sh; key = -1; }
  if (k > nv) { k = nv; } float kk = k - 1;
  float nk = az * 10000000 + el * 100000 + sh * 10000 + k;
  if (key != nk) {
    key = nk;
    ca = cos(az * pi / 180); sa = sin(az * pi / 180); ce = cos(el * pi / 180); se = sin(el * pi / 180);
    geom();
    repeat (ne) { ec[i] = 0; } repeat (nv) { vc[i] = 0; }
    float v0 = kk;
    repeat (ne) { if (ea[i] == v0 || eb[i] == v0) { ec[i] = 1; } }
    vc[v0] = 1;
    gh0 = newGraph(); gh1 = newGraph(); gh2 = newGraph(); gv0 = newGraph(); gv1 = newGraph(); gv2 = newGraph(); gn0 = newGraph(); gn1 = newGraph(); gn2 = newGraph(); gn3 = newGraph();
    repeat (nv) {
      string s = "v" + format(i, 0);
      float x = prx(vX(i), vY(i), vZ(i)) * S; float y = pry(vX(i), vY(i), vZ(i)) * S; sx[i] = x; sy[i] = y; vs[i] = 0;
      addNode(gh0, s, [x, y]); addNode(gh1, s, [x, y]); addNode(gh2, s, [x, y]); addNode(gv0, s, [x, y]); addNode(gv1, s, [x, y]); addNode(gv2, s, [x, y]);
    }
    repeat (ne) {
      float e = i; string ka = "v" + format(ea[e], 0); string kb = "v" + format(eb[e], 0);
      float vis = 0; if (nzv(ef[e]) > 0 || nzv(eg[e]) > 0) { vis = 1; }
      float c = ec[e];
      if (vis > 0.5) { if (c < 0.5) { addEdge(gv0, ka, kb); } if (c > 0.5 && c < 1.5) { addEdge(gv1, ka, kb); } if (c > 1.5) { addEdge(gv2, ka, kb); } }
      else { if (c < 0.5) { addEdge(gh0, ka, kb); } if (c > 0.5 && c < 1.5) { addEdge(gh1, ka, kb); } if (c > 1.5) { addEdge(gh2, ka, kb); } }
    }
    repeat (nv) {
      float v = i; float seen = 0;
      repeat (nfc) { if (nzv(i) > 0 && hasVert(i, v) > 0.5) { seen = 1; } }
      float c = vc[v]; string s = "n" + format(v, 0); float x = sx[v]; float y = sy[v];
      if (seen > 0.5 || c > 0.5) { vs[v] = 1; }
      if (c > 1.5) { addNode(gn2, s, [x, y]); }
      if (c > 0.5 && c < 1.5) { addNode(gn1, s, [x, y]); }
      if (c < 0.5 && seen > 0.5) { addNode(gn0, s, [x, y]); }
      if (c < 0.5 && seen < 0.5) { addNode(gn3, s, [x, y]); }
    }
    string nb = ""; string an = ""; float nf = 0; float sm = 0;
    repeat (ne) { if (ea[i] == v0) { nb = nb + " " + lab(v0) + lab(eb[i]); } if (eb[i] == v0) { nb = nb + " " + lab(v0) + lab(ea[i]); } }
    repeat (nfc) { if (hasVert(i, v0) > 0.5) { if (nf > 0.5) { an = an + " + "; } an = an + format(pang(i, v0) * 180 / pi, 0) + "°"; sm = sm + pang(i, v0) * 180 / pi; nf = nf + 1; } }
    info = "**Вершина " + lab(v0) + "** (жёлтая) — точка, в которой сходятся рёбра:" + nb + ". Их число — порядок вершины: " + format(dg[v0], 0) + " (не меньше трёх); граней при вершине " + format(nf, 0) + ". Координаты (" + num(vX(v0), 2) + "; " + num(vY(v0), 2) + "; " + num(vZ(v0), 2) + ").\n\n";
    info = info + "**Многогранный угол** при вершине образован гранями, примыкающими к ней; его плоские углы: " + an + " = " + format(sm, 0) + "°. ";
    if (sm < 359.9) { info = info + "Сумма меньше 360°, как у вершин выпуклого многогранника."; }
    else { info = info + "Сумма не меньше 360°: такая вершина возможна только у невыпуклого многогранника."; }
    info = info + "\n\nВсего вершин V = " + format(nv, 0) + ", порядки вершин от " + format(dgMin(), 0) + " до " + format(dgMax(), 0) + ".";
  }
}
]
