[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Число записывается набором знаков; его значение — просто сумма значений знаков (позиция не важна).
// Слева — знаки по группам, справа — вклад группы. ----
draw Text { name = "g0"; pos = (-7.5, 3.6); text = grow(0); size = 1.9; color = #3b82f6; align = left; active = 0 < nr }
draw Text { name = "v0"; pos = (-0.5, 3.6); text = vrow(0); size = 1.1; align = left; active = 0 < nr }
draw Text { name = "g1"; pos = (-7.5, 2.1); text = grow(1); size = 1.9; color = #3b82f6; align = left; active = 1 < nr }
draw Text { name = "v1"; pos = (-0.5, 2.1); text = vrow(1); size = 1.1; align = left; active = 1 < nr }
draw Text { name = "g2"; pos = (-7.5, 0.6); text = grow(2); size = 1.9; color = #3b82f6; align = left; active = 2 < nr }
draw Text { name = "v2"; pos = (-0.5, 0.6); text = vrow(2); size = 1.1; align = left; active = 2 < nr }
draw Text { name = "g3"; pos = (-7.5, -0.9); text = grow(3); size = 1.9; color = #3b82f6; align = left; active = 3 < nr }
draw Text { name = "v3"; pos = (-0.5, -0.9); text = vrow(3); size = 1.1; align = left; active = 3 < nr }
draw Text { name = "g4"; pos = (-7.5, -2.4); text = grow(4); size = 1.9; color = #3b82f6; align = left; active = 4 < nr }
draw Text { name = "v4"; pos = (-0.5, -2.4); text = vrow(4); size = 1.1; align = left; active = 4 < nr }
draw Text { name = "tot"; pos = (0, -3.9); text = "сумма значений = " + format(N, 0); size = 1.6; color = #f59e0b }

new UI { name = "sS"; type = select; label = "система"; variable = sys; options = ("egypt", "attic", "ionic"); labels = ("египетская (условные знаки)", "аттическая (без знаков 50, 500)", "ионийская (буквенная)"); default = "egypt" }
new UI { name = "sO"; type = select; label = "порядок знаков"; variable = ord; options = ("0", "1", "2"); labels = ("старшие сверху", "младшие сверху", "по кругу"); default = "0" }
new UI { name = "sN"; type = slider; label = "число"; variable = N; min = 1; max = 9999; step = 1; default = 2467 }

// ---- Логика ----
string sys = "egypt"; string ord = "0"; float N = 2467;
list cnt = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
list rw = (0, 0, 0, 0, 0);
float nr = 0; float ns = 4; string info = "";

Function gly(s) {
  if (sys == "egypt" && s == 0) { return "✱"; } if (sys == "egypt" && s == 1) { return "◎"; } if (sys == "egypt" && s == 2) { return "∩"; } if (sys == "egypt" && s == 3) { return "|"; }
  if (sys == "attic" && s == 0) { return "Χ"; } if (sys == "attic" && s == 1) { return "Η"; } if (sys == "attic" && s == 2) { return "Δ"; } if (sys == "attic" && s == 3) { return "Π"; } if (sys == "attic" && s == 4) { return "Ι"; }
  if (sys == "ionic" && s == 0) { return "͵θ"; } if (sys == "ionic" && s == 1) { return "͵η"; } if (sys == "ionic" && s == 2) { return "͵ζ"; } if (sys == "ionic" && s == 3) { return "͵ϛ"; } if (sys == "ionic" && s == 4) { return "͵ε"; } if (sys == "ionic" && s == 5) { return "͵δ"; } if (sys == "ionic" && s == 6) { return "͵γ"; } if (sys == "ionic" && s == 7) { return "͵β"; } if (sys == "ionic" && s == 8) { return "͵α"; } if (sys == "ionic" && s == 9) { return "ϡ"; } if (sys == "ionic" && s == 10) { return "ω"; } if (sys == "ionic" && s == 11) { return "ψ"; } if (sys == "ionic" && s == 12) { return "χ"; } if (sys == "ionic" && s == 13) { return "φ"; } if (sys == "ionic" && s == 14) { return "υ"; } if (sys == "ionic" && s == 15) { return "τ"; } if (sys == "ionic" && s == 16) { return "σ"; } if (sys == "ionic" && s == 17) { return "ρ"; } if (sys == "ionic" && s == 18) { return "ϙ"; } if (sys == "ionic" && s == 19) { return "π"; } if (sys == "ionic" && s == 20) { return "ο"; } if (sys == "ionic" && s == 21) { return "ξ"; } if (sys == "ionic" && s == 22) { return "ν"; } if (sys == "ionic" && s == 23) { return "μ"; } if (sys == "ionic" && s == 24) { return "λ"; } if (sys == "ionic" && s == 25) { return "κ"; } if (sys == "ionic" && s == 26) { return "ι"; } if (sys == "ionic" && s == 27) { return "θ"; } if (sys == "ionic" && s == 28) { return "η"; } if (sys == "ionic" && s == 29) { return "ζ"; } if (sys == "ionic" && s == 30) { return "ϛ"; } if (sys == "ionic" && s == 31) { return "ε"; } if (sys == "ionic" && s == 32) { return "δ"; } if (sys == "ionic" && s == 33) { return "γ"; } if (sys == "ionic" && s == 34) { return "β"; } if (sys == "ionic" && s == 35) { return "α"; }
  return "";
}
Function sval(s) {
  if (sys == "egypt" && s == 0) { return 1000; } if (sys == "egypt" && s == 1) { return 100; } if (sys == "egypt" && s == 2) { return 10; } if (sys == "egypt" && s == 3) { return 1; }
  if (sys == "attic" && s == 0) { return 1000; } if (sys == "attic" && s == 1) { return 100; } if (sys == "attic" && s == 2) { return 10; } if (sys == "attic" && s == 3) { return 5; } if (sys == "attic" && s == 4) { return 1; }
  if (sys == "ionic" && s == 0) { return 9000; } if (sys == "ionic" && s == 1) { return 8000; } if (sys == "ionic" && s == 2) { return 7000; } if (sys == "ionic" && s == 3) { return 6000; } if (sys == "ionic" && s == 4) { return 5000; } if (sys == "ionic" && s == 5) { return 4000; } if (sys == "ionic" && s == 6) { return 3000; } if (sys == "ionic" && s == 7) { return 2000; } if (sys == "ionic" && s == 8) { return 1000; } if (sys == "ionic" && s == 9) { return 900; } if (sys == "ionic" && s == 10) { return 800; } if (sys == "ionic" && s == 11) { return 700; } if (sys == "ionic" && s == 12) { return 600; } if (sys == "ionic" && s == 13) { return 500; } if (sys == "ionic" && s == 14) { return 400; } if (sys == "ionic" && s == 15) { return 300; } if (sys == "ionic" && s == 16) { return 200; } if (sys == "ionic" && s == 17) { return 100; } if (sys == "ionic" && s == 18) { return 90; } if (sys == "ionic" && s == 19) { return 80; } if (sys == "ionic" && s == 20) { return 70; } if (sys == "ionic" && s == 21) { return 60; } if (sys == "ionic" && s == 22) { return 50; } if (sys == "ionic" && s == 23) { return 40; } if (sys == "ionic" && s == 24) { return 30; } if (sys == "ionic" && s == 25) { return 20; } if (sys == "ionic" && s == 26) { return 10; } if (sys == "ionic" && s == 27) { return 9; } if (sys == "ionic" && s == 28) { return 8; } if (sys == "ionic" && s == 29) { return 7; } if (sys == "ionic" && s == 30) { return 6; } if (sys == "ionic" && s == 31) { return 5; } if (sys == "ionic" && s == 32) { return 4; } if (sys == "ionic" && s == 33) { return 3; } if (sys == "ionic" && s == 34) { return 2; } if (sys == "ionic" && s == 35) { return 1; }
  return 0;
}
Function rep(s, c) { string r = ""; repeat (c) { r = r + gly(s); } return r; }
Function pick(k) {
  if (ord == "1") { return rw[nr - 1 - k]; }
  if (ord == "2") { return rw[md(k + 1, nr)]; }
  return rw[k];
}
Function md(a, m) { return a - floor(a / m) * m; }
Function grow(k) { if (k >= nr) { return ""; } return rep(pick(k), cnt[pick(k)]); }
Function vrow(k) { if (k >= nr) { return ""; } float s = pick(k); return "= " + format(cnt[s], 0) + " × " + format(sval(s), 0) + " = " + format(cnt[s] * sval(s), 0); }

Update {
  ns = 4; if (sys == "attic") { ns = 5; } if (sys == "ionic") { ns = 36; }
  float rem = N; nr = 0;
  repeat (36) { cnt[i] = 0; }
  repeat (ns) {
    float v = sval(i); float c = floor(rem / v);
    if (sys == "ionic") { c = min(c, 1); }
    cnt[i] = c; rem = rem - c * v;
    if (c > 0) { rw[nr] = i; nr = nr + 1; }
  }
  if (sys == "egypt") { info = "**Египетская запись** (знаки условно: ✱ = 1000, ◎ = 100, ∩ = 10, | = 1). "; }
  if (sys == "attic") { info = "**Аттическая (геродианова) запись** (Χ = 1000, Η = 100, Δ = 10, Π = 5, Ι = 1; составные знаки 50, 500, … здесь опущены). "; }
  if (sys == "ionic") { info = "**Ионийская (алфавитная) запись:** каждая из 27 букв — своё число: α…θ = 1…9, ι…ϙ = 10…90, ρ…ϡ = 100…900, тысячи — те же буквы со знаком ͵ слева. "; }
  info = info + "Значение числа — **сумма значений всех знаков**: " + format(N, 0) + " = ";
  string sm = "";
  repeat (nr) { float s = rw[i]; if (i > 0) { sm = sm + " + "; } sm = sm + format(cnt[s] * sval(s), 0); }
  info = info + sm + ".\n\n";
  info = info + "Знак означает одно и то же на любом месте — поэтому порядок групп можно менять, сумма остаётся " + format(N, 0) + ", и не нужен знак для пустого разряда: если разряда нет, его просто не пишут. Сложение сводится к приписыванию знаков и замене старших групп (10 одинаковых знаков — одним следующего достоинства).";
}
]
