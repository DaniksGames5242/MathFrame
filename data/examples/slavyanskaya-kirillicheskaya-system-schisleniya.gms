[
description = "{info}"

field width = 20;
field height = 9;
camera type = fixed;

// ---- Вверху — таблица букв-цифр. В записи числа каждая буква несёт своё значение; тысячи помечены титлом (~) ----
draw Text { name = "r1"; pos = (-9.5, 3.7); text = "единицы:  а=1  в=2  г=3  д=4  е=5  ѕ=6  з=7  и=8  ѳ=9"; size = 0.85; align = left }
draw Text { name = "r2"; pos = (-9.5, 2.9); text = "десятки:  і=10  к=20  л=30  м=40  н=50  ѯ=60  о=70  п=80  ч=90"; size = 0.85; align = left }
draw Text { name = "r3"; pos = (-9.5, 2.1); text = "сотни:  р=100  с=200  т=300  у=400  ф=500  х=600  ѱ=700  ѡ=800  ц=900"; size = 0.85; align = left }
draw Text { name = "L0"; pos = (xs(0), -0.2); text = lt(0); size = 2.4; active = 0 < nt }
draw Text { name = "L1"; pos = (xs(1), -0.2); text = lt(1); size = 2.4; active = 1 < nt }
draw Text { name = "L2"; pos = (xs(2), -0.2); text = lt(2); size = 2.4; active = 2 < nt }
draw Text { name = "L3"; pos = (xs(3), -0.2); text = lt(3); size = 2.4; active = 3 < nt }
draw Text { name = "L4"; pos = (xs(4), -0.2); text = lt(4); size = 2.4; active = 4 < nt }
draw Text { name = "L5"; pos = (xs(5), -0.2); text = lt(5); size = 2.4; active = 5 < nt }
draw Text { name = "T0"; pos = (xs(0), 1.1); text = "~"; size = 1.6; active = 0 < nt && tk[0] > 0.5 }
draw Text { name = "T1"; pos = (xs(1), 1.1); text = "~"; size = 1.6; active = 1 < nt && tk[1] > 0.5 }
draw Text { name = "T2"; pos = (xs(2), 1.1); text = "~"; size = 1.6; active = 2 < nt && tk[2] > 0.5 }
draw Text { name = "T3"; pos = (xs(3), 1.1); text = "~"; size = 1.6; active = 3 < nt && tk[3] > 0.5 }
draw Text { name = "T4"; pos = (xs(4), 1.1); text = "~"; size = 1.6; active = 4 < nt && tk[4] > 0.5 }
draw Text { name = "T5"; pos = (xs(5), 1.1); text = "~"; size = 1.6; active = 5 < nt && tk[5] > 0.5 }
draw Text { name = "V0"; pos = (xs(0), -1.9); text = format(tv[0], 0); size = 0.9; active = 0 < nt }
draw Text { name = "V1"; pos = (xs(1), -1.9); text = format(tv[1], 0); size = 0.9; active = 1 < nt }
draw Text { name = "V2"; pos = (xs(2), -1.9); text = format(tv[2], 0); size = 0.9; active = 2 < nt }
draw Text { name = "V3"; pos = (xs(3), -1.9); text = format(tv[3], 0); size = 0.9; active = 3 < nt }
draw Text { name = "V4"; pos = (xs(4), -1.9); text = format(tv[4], 0); size = 0.9; active = 4 < nt }
draw Text { name = "V5"; pos = (xs(5), -1.9); text = format(tv[5], 0); size = 0.9; active = 5 < nt }

new UI { name = "sN"; type = slider; label = "число"; variable = N; min = 1; max = 999999; step = 1; default = 1994 }
new UI { name = "sO"; type = select; label = "порядок букв"; variable = od; options = ("desc", "asc", "mix"); labels = ("от большего к меньшему", "от меньшего к большему", "как попало"); default = "desc" }

// ---- Логика ----
float N = 1994; string od = "desc"; float key = -1; float nt = 0; string info = "";
list tv = [0, 0, 0, 0, 0, 0]; list tk = [0, 0, 0, 0, 0, 0]; list mk = [3, 0, 5, 1, 4, 2];

Function lt1(v) {
  if (v == 1) { return "а"; } if (v == 2) { return "в"; } if (v == 3) { return "г"; } if (v == 4) { return "д"; } if (v == 5) { return "е"; }
  if (v == 6) { return "ѕ"; } if (v == 7) { return "з"; } if (v == 8) { return "и"; } return "ѳ";
}
Function lt10(v) {
  if (v == 1) { return "і"; } if (v == 2) { return "к"; } if (v == 3) { return "л"; } if (v == 4) { return "м"; } if (v == 5) { return "н"; }
  if (v == 6) { return "ѯ"; } if (v == 7) { return "о"; } if (v == 8) { return "п"; } return "ч";
}
Function lt100(v) {
  if (v == 1) { return "р"; } if (v == 2) { return "с"; } if (v == 3) { return "т"; } if (v == 4) { return "у"; } if (v == 5) { return "ф"; }
  if (v == 6) { return "х"; } if (v == 7) { return "ѱ"; } if (v == 8) { return "ѡ"; } return "ц";
}
Function sym(v) { if (v >= 100) { return lt100(v / 100); } if (v >= 10) { return lt10(v / 10); } return lt1(v); }
Function ord(k) { if (od == "desc") { return k; } if (od == "asc") { return 100 - k; } return mk[k]; }
Function rk(k) { float r = 0; repeat (6) { if (i < nt && ord(i) < ord(k)) { r = r + 1; } } return r; }
Function xs(k) { return (rk(k) - (nt - 1) / 2) * 2.6; }
// слот k хранит k-е слагаемое по убыванию
Function lt(k) { if (tk[k] > 0.5) { return sym(tv[k] / 1000); } return sym(tv[k]); }
Function add(v, isk) { tv[nt] = v; tk[nt] = isk; nt = nt + 1; }

Update {
  float oc = 0; if (od == "asc") { oc = 1; } if (od == "mix") { oc = 2; }
  if (key != N * 10 + oc) {
    nt = 0; float th = floor(N / 1000); float lo = N - 1000 * th;
    float h = floor(th / 100); float t = floor((th - 100 * h) / 10); float u = th - 100 * h - 10 * t;
    if (h > 0) { add(h * 100000, 1); } if (t > 0) { add(t * 10000, 1); } if (u > 0) { add(u * 1000, 1); }
    h = floor(lo / 100); t = floor((lo - 100 * h) / 10); u = lo - 100 * h - 10 * t;
    if (h > 0) { add(h * 100, 0); } if (t > 0) { add(t * 10, 0); } if (u > 0) { add(u, 0); }
    string s = ""; string w = "";
    repeat (6) { if (i < nt) { if (i > 0) { s = s + " + "; } s = s + format(tv[i], 0); } }
    info = "**" + format(N, 0) + " = " + s + ".** Каждая буква означает своё число, значение записи — сумма этих чисел, поэтому порядок букв на результат не влияет: система **непозиционная**. Букв в записи: **" + format(nt, 0) + "**.";
    info = info + "\n\nСлагаемое от 1000 — это буква единиц, десятков или сотен с **титлом** (~) над ней: ~а = 1000, ~т = 300 000. Ноля нет: пустой разряд не записывается.";
    key = N * 10 + oc;
  }
}
]
