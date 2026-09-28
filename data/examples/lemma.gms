[
description = "{info}"

field width = 16;
field height = 9;
camera type = fixed;

// ---- Лемма L(n): «n(n + 1) чётно» — одно и то же вспомогательное утверждение,
// доказательство которого не меняется, используется в двух разных теоремах.
// Числовая прямая показывает n и n+1 и их произведение; переключатель — какая
// теорема сейчас опирается на лемму. ----
draw Graph { name = "gline"; graph = "gl"; nodeRadius = 0; labels = false; edgeColor = #3b82f655; edgeWidth = 1 }
draw Text { name = "t0"; pos = (nx(0), -1.9); text = "0"; size = 0.8; color = #3b82f6 }
draw Text { name = "t2"; pos = (nx(2), -1.9); text = "2"; size = 0.8; color = #3b82f6 }
draw Text { name = "t4"; pos = (nx(4), -1.9); text = "4"; size = 0.8; color = #3b82f6 }
draw Text { name = "t6"; pos = (nx(6), -1.9); text = "6"; size = 0.8; color = #3b82f6 }
draw Text { name = "t8"; pos = (nx(8), -1.9); text = "8"; size = 0.8; color = #3b82f6 }
draw Text { name = "t10"; pos = (nx(10), -1.9); text = "10"; size = 0.8; color = #3b82f6 }
draw Graph { name = "gn"; graph = "gn"; nodeColor = #3b82f6; nodeRadius = 14; interactive = false; showWeights = false }

new UI { name = "sN"; type = slider; label = "n"; variable = N; min = 0; max = 10; step = 1; default = 5 }
new UI { name = "sT"; type = select; label = "теорема"; variable = sr; options = ("sum", "sq"); labels = ("сумма 1+…+n — целая", "n² + n — чётно"); default = "sum" }

float N = 5;
string sr = "sum";
string info = "";

Function nx(i) { return -7 + i * 1.4; }

Update {
  gl = newGraph(); addNode(gl, "l0", [nx(0), 0]); addNode(gl, "l1", [nx(10), 0]); addEdge(gl, "l0", "l1");
  gn = newGraph();
  addNode(gn, "a", [nx(N), 0], format(N, 0));
  addNode(gn, "b", [nx(N + 1), 0], format(N + 1, 0));

  float prod = N * (N + 1);
  float even = 1;
  if (prod - floor(prod / 2) * 2 > 0.5) { even = 0; }

  info = "**Лемма** — вспомогательное утверждение, доказательство которого выносится из основного хода доказательства теоремы и может использоваться в нескольких теоремах. Лемма L(n): «n(n + 1) — произведение двух соседних целых чисел — чётно», n = " + format(N, 0) + ".\n\n";
  info = info + "n(n + 1) = " + format(N, 0) + " · " + format(N + 1, 0) + " = " + format(prod, 0) + " — **чётно**, потому что среди n и n + 1 одно число всегда чётно, а произведение с чётным множителем чётно.\n\n";

  if (sr == "sum") {
    info = info + "**Теорема (сумма 1 + 2 + … + n = n(n + 1) / 2):** значение целое, потому что по лемме L(n) числитель n(n + 1) чётен, а значит делится на 2 без остатка. 1 + … + " + format(N, 0) + " = " + format(prod / 2, 0) + ".";
  } else {
    info = info + "**Теорема (n² + n чётно при любом целом n):** n² + n = n(n + 1) — то же выражение, что и в лемме, поэтому чётность следует из L(n) без нового доказательства. " + format(N, 0) + "² + " + format(N, 0) + " = " + format(prod, 0) + ".";
  }
  info = info + "\n\nСама лемма доказывается один раз и одинакова для обеих теорем — меняется только то, как её заключение применяется дальше.";
}
]
