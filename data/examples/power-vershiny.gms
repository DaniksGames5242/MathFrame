[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Граф «по расстоянию»: две вершины соединены ребром, если они ближе, чем r.
// Вершины перетаскиваются — рёбра и степени пересчитываются каждый кадр. ----
new Point { name = "V1"; pos = (-6.2, 3.2); text = true("1") }
new Point { name = "V2"; pos = (-2.6, 4.0); text = true("2") }
new Point { name = "V3"; pos = (2.2, 3.6); text = true("3") }
new Point { name = "V4"; pos = (6.6, 2.2); text = true("4") }
new Point { name = "V5"; pos = (-5.4, -2.2); text = true("5") }
new Point { name = "V6"; pos = (0.0, -0.4); text = true("6") }
new Point { name = "V7"; pos = (5.2, -3.4); text = true("7") }
new Line { name = "e12"; pos = (V1, V2); thickness = 2.5; interact = false; layer = 5; active = a12 == 1 }
new Line { name = "e13"; pos = (V1, V3); thickness = 2.5; interact = false; layer = 5; active = a13 == 1 }
new Line { name = "e14"; pos = (V1, V4); thickness = 2.5; interact = false; layer = 5; active = a14 == 1 }
new Line { name = "e15"; pos = (V1, V5); thickness = 2.5; interact = false; layer = 5; active = a15 == 1 }
new Line { name = "e16"; pos = (V1, V6); thickness = 2.5; interact = false; layer = 5; active = a16 == 1 }
new Line { name = "e17"; pos = (V1, V7); thickness = 2.5; interact = false; layer = 5; active = a17 == 1 }
new Line { name = "e23"; pos = (V2, V3); thickness = 2.5; interact = false; layer = 5; active = a23 == 1 }
new Line { name = "e24"; pos = (V2, V4); thickness = 2.5; interact = false; layer = 5; active = a24 == 1 }
new Line { name = "e25"; pos = (V2, V5); thickness = 2.5; interact = false; layer = 5; active = a25 == 1 }
new Line { name = "e26"; pos = (V2, V6); thickness = 2.5; interact = false; layer = 5; active = a26 == 1 }
new Line { name = "e27"; pos = (V2, V7); thickness = 2.5; interact = false; layer = 5; active = a27 == 1 }
new Line { name = "e34"; pos = (V3, V4); thickness = 2.5; interact = false; layer = 5; active = a34 == 1 }
new Line { name = "e35"; pos = (V3, V5); thickness = 2.5; interact = false; layer = 5; active = a35 == 1 }
new Line { name = "e36"; pos = (V3, V6); thickness = 2.5; interact = false; layer = 5; active = a36 == 1 }
new Line { name = "e37"; pos = (V3, V7); thickness = 2.5; interact = false; layer = 5; active = a37 == 1 }
new Line { name = "e45"; pos = (V4, V5); thickness = 2.5; interact = false; layer = 5; active = a45 == 1 }
new Line { name = "e46"; pos = (V4, V6); thickness = 2.5; interact = false; layer = 5; active = a46 == 1 }
new Line { name = "e47"; pos = (V4, V7); thickness = 2.5; interact = false; layer = 5; active = a47 == 1 }
new Line { name = "e56"; pos = (V5, V6); thickness = 2.5; interact = false; layer = 5; active = a56 == 1 }
new Line { name = "e57"; pos = (V5, V7); thickness = 2.5; interact = false; layer = 5; active = a57 == 1 }
new Line { name = "e67"; pos = (V6, V7); thickness = 2.5; interact = false; layer = 5; active = a67 == 1 }
draw Text { name = "t1"; pos = (V1.pos.x, V1.pos.y - 0.85); text = lab(1) }
draw Text { name = "t2"; pos = (V2.pos.x, V2.pos.y - 0.85); text = lab(2) }
draw Text { name = "t3"; pos = (V3.pos.x, V3.pos.y - 0.85); text = lab(3) }
draw Text { name = "t4"; pos = (V4.pos.x, V4.pos.y - 0.85); text = lab(4) }
draw Text { name = "t5"; pos = (V5.pos.x, V5.pos.y - 0.85); text = lab(5) }
draw Text { name = "t6"; pos = (V6.pos.x, V6.pos.y - 0.85); text = lab(6) }
draw Text { name = "t7"; pos = (V7.pos.x, V7.pos.y - 0.85); text = lab(7) }

new UI { name = "btn1"; type = button; label = "Степени"; action = "tab = 1" }
new UI { name = "btn2"; type = button; label = "Виды вершин"; action = "tab = 2" }
new UI { name = "sR"; type = slider; label = "радиус связи r"; variable = R; min = 1; max = 12; step = 0.1; default = 5.5 }

float tab = 1;
float R = 5.5;
string info = "";
float a12 = 0; float a13 = 0; float a14 = 0; float a15 = 0; float a16 = 0; float a17 = 0; float a23 = 0; float a24 = 0; float a25 = 0; float a26 = 0; float a27 = 0; float a34 = 0; float a35 = 0; float a36 = 0; float a37 = 0; float a45 = 0; float a46 = 0; float a47 = 0; float a56 = 0; float a57 = 0; float a67 = 0; 
list dg = [0, 0, 0, 0, 0, 0, 0];

Function lab(k) {
  float d = dg[k - 1];
  if (tab == 1) { return "степень " + format(d, 0); }
  if (d == 0) { return "изолированная"; }
  if (d == 1) { return "висячая"; }
  if (d == 6) { return "доминирующая"; }
  return "";
}
Function lst() {
  string t = "";
  repeat (7) { if (i > 0) { t = t + ", "; } t = t + format(dg[i], 0); }
  return t;
}

Update {
  a12 = 0; if ((V1.pos.x - V2.pos.x) * (V1.pos.x - V2.pos.x) + (V1.pos.y - V2.pos.y) * (V1.pos.y - V2.pos.y) <= R * R) { a12 = 1; }
  a13 = 0; if ((V1.pos.x - V3.pos.x) * (V1.pos.x - V3.pos.x) + (V1.pos.y - V3.pos.y) * (V1.pos.y - V3.pos.y) <= R * R) { a13 = 1; }
  a14 = 0; if ((V1.pos.x - V4.pos.x) * (V1.pos.x - V4.pos.x) + (V1.pos.y - V4.pos.y) * (V1.pos.y - V4.pos.y) <= R * R) { a14 = 1; }
  a15 = 0; if ((V1.pos.x - V5.pos.x) * (V1.pos.x - V5.pos.x) + (V1.pos.y - V5.pos.y) * (V1.pos.y - V5.pos.y) <= R * R) { a15 = 1; }
  a16 = 0; if ((V1.pos.x - V6.pos.x) * (V1.pos.x - V6.pos.x) + (V1.pos.y - V6.pos.y) * (V1.pos.y - V6.pos.y) <= R * R) { a16 = 1; }
  a17 = 0; if ((V1.pos.x - V7.pos.x) * (V1.pos.x - V7.pos.x) + (V1.pos.y - V7.pos.y) * (V1.pos.y - V7.pos.y) <= R * R) { a17 = 1; }
  a23 = 0; if ((V2.pos.x - V3.pos.x) * (V2.pos.x - V3.pos.x) + (V2.pos.y - V3.pos.y) * (V2.pos.y - V3.pos.y) <= R * R) { a23 = 1; }
  a24 = 0; if ((V2.pos.x - V4.pos.x) * (V2.pos.x - V4.pos.x) + (V2.pos.y - V4.pos.y) * (V2.pos.y - V4.pos.y) <= R * R) { a24 = 1; }
  a25 = 0; if ((V2.pos.x - V5.pos.x) * (V2.pos.x - V5.pos.x) + (V2.pos.y - V5.pos.y) * (V2.pos.y - V5.pos.y) <= R * R) { a25 = 1; }
  a26 = 0; if ((V2.pos.x - V6.pos.x) * (V2.pos.x - V6.pos.x) + (V2.pos.y - V6.pos.y) * (V2.pos.y - V6.pos.y) <= R * R) { a26 = 1; }
  a27 = 0; if ((V2.pos.x - V7.pos.x) * (V2.pos.x - V7.pos.x) + (V2.pos.y - V7.pos.y) * (V2.pos.y - V7.pos.y) <= R * R) { a27 = 1; }
  a34 = 0; if ((V3.pos.x - V4.pos.x) * (V3.pos.x - V4.pos.x) + (V3.pos.y - V4.pos.y) * (V3.pos.y - V4.pos.y) <= R * R) { a34 = 1; }
  a35 = 0; if ((V3.pos.x - V5.pos.x) * (V3.pos.x - V5.pos.x) + (V3.pos.y - V5.pos.y) * (V3.pos.y - V5.pos.y) <= R * R) { a35 = 1; }
  a36 = 0; if ((V3.pos.x - V6.pos.x) * (V3.pos.x - V6.pos.x) + (V3.pos.y - V6.pos.y) * (V3.pos.y - V6.pos.y) <= R * R) { a36 = 1; }
  a37 = 0; if ((V3.pos.x - V7.pos.x) * (V3.pos.x - V7.pos.x) + (V3.pos.y - V7.pos.y) * (V3.pos.y - V7.pos.y) <= R * R) { a37 = 1; }
  a45 = 0; if ((V4.pos.x - V5.pos.x) * (V4.pos.x - V5.pos.x) + (V4.pos.y - V5.pos.y) * (V4.pos.y - V5.pos.y) <= R * R) { a45 = 1; }
  a46 = 0; if ((V4.pos.x - V6.pos.x) * (V4.pos.x - V6.pos.x) + (V4.pos.y - V6.pos.y) * (V4.pos.y - V6.pos.y) <= R * R) { a46 = 1; }
  a47 = 0; if ((V4.pos.x - V7.pos.x) * (V4.pos.x - V7.pos.x) + (V4.pos.y - V7.pos.y) * (V4.pos.y - V7.pos.y) <= R * R) { a47 = 1; }
  a56 = 0; if ((V5.pos.x - V6.pos.x) * (V5.pos.x - V6.pos.x) + (V5.pos.y - V6.pos.y) * (V5.pos.y - V6.pos.y) <= R * R) { a56 = 1; }
  a57 = 0; if ((V5.pos.x - V7.pos.x) * (V5.pos.x - V7.pos.x) + (V5.pos.y - V7.pos.y) * (V5.pos.y - V7.pos.y) <= R * R) { a57 = 1; }
  a67 = 0; if ((V6.pos.x - V7.pos.x) * (V6.pos.x - V7.pos.x) + (V6.pos.y - V7.pos.y) * (V6.pos.y - V7.pos.y) <= R * R) { a67 = 1; }
  dg[0] = a12 + a13 + a14 + a15 + a16 + a17;
  dg[1] = a12 + a23 + a24 + a25 + a26 + a27;
  dg[2] = a13 + a23 + a34 + a35 + a36 + a37;
  dg[3] = a14 + a24 + a34 + a45 + a46 + a47;
  dg[4] = a15 + a25 + a35 + a45 + a56 + a57;
  dg[5] = a16 + a26 + a36 + a46 + a56 + a67;
  dg[6] = a17 + a27 + a37 + a47 + a57 + a67;
  float E = a12 + a13 + a14 + a15 + a16 + a17 + a23 + a24 + a25 + a26 + a27 + a34 + a35 + a36 + a37 + a45 + a46 + a47 + a56 + a57 + a67;
  float sum = 0; float odd = 0; float mn = 99; float mx = 0; float iso = 0; float leaf = 0; float dom = 0;
  repeat (7) {
    float d = dg[i];
    sum = sum + d; if (d % 2 == 1) { odd = odd + 1; }
    mn = min(mn, d); mx = max(mx, d);
    if (d == 0) { iso = iso + 1; } if (d == 1) { leaf = leaf + 1; } if (d == 6) { dom = dom + 1; }
  }
  if (tab == 1) {
    info = "**Степень вершины** — число инцидентных ей рёбер (число соседей). Здесь степени вершин 1…7: " + lst() + ".\n\n**Сумма степеней равна удвоенному числу рёбер:** \\(\\sum \\deg(v) = 2|E|\\), " + format(sum, 0) + " = 2 · " + format(E, 0) + ". Каждое ребро вносит вклад ровно в две степени, поэтому число вершин нечётной степени всегда чётно — сейчас их " + format(odd, 0) + ".";
  } else {
    string reg = "";
    if (mn == mx) { reg = " Все степени равны, граф регулярный степени " + format(mn, 0) + "."; }
    info = "**Наименьшая и наибольшая степень:** \\(\\delta(G) = " + format(mn, 0) + "\\), \\(\\Delta(G) = " + format(mx, 0) + "\\)." + reg + "\n\n**Изолированных** вершин (степень 0): " + format(iso, 0) + "; **висячих** (степень 1, листьев): " + format(leaf, 0) + "; **доминирующих** (смежных со всеми остальными, степень \\(n - 1 = 6\\)): " + format(dom, 0) + ".";
  }
}
]
