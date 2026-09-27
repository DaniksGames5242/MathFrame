[
description = "{info}"
field width = 20; field height = 8;
camera type = fixed;
float start = 9; float end = 14.5; float wrap = 0; string info = "";
Function hm(t) { float h = floor(t + 0.001); float m = round((t - h) * 60); if (m >= 60) { m = 0; h = h + 1; } string hs = format(h, 0); if (h < 10) { hs = "0" + hs; } string ms = format(m, 0); if (m < 10) { ms = "0" + ms; } return hs + ":" + ms; }
draw Graph { name = "ticks"; graph = "gt"; nodeRadius = 0; edgeWidth = 1; labels = true; interactive = false }
new Line { name = "axisL"; pos = ((-9, 0), (9, 0)) }
new Point { name = "S"; pos = (0, 0); dynamic = false; collision = false; color = #3b82f6 }
new Point { name = "E"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "P0"; pos = (-9, 0); dynamic = false; collision = false; active = false }
new Point { name = "P24"; pos = (9, 0); dynamic = false; collision = false; active = false }
new Line { name = "segDirect"; pos = (S, E); color = #22c55e; active = wrap < 0.5 }
new Line { name = "segA"; pos = (S, P24); color = #22c55e; active = wrap > 0.5 }
new Line { name = "segB"; pos = (P0, E); color = #22c55e; active = wrap > 0.5 }
draw Text { name = "ls"; pos = (S.pos.x, 1); text = hm(start); size = 0.8 }
draw Text { name = "le"; pos = (E.pos.x, -1.2); text = hm(end); size = 0.8 }
new UI { type = slider; label = "начало"; variable = start; min = 0; max = 23.75; step = 0.25; default = 9 }
new UI { type = slider; label = "конец"; variable = end; min = 0; max = 23.75; step = 0.25; default = 14.5 }
Update {
  S.pos.x = -9 + start * 0.75; E.pos.x = -9 + end * 0.75;
  wrap = 0; if (end < start) { wrap = 1; }
  gt = newGraph(); repeat (5) { float h = i * 6; float x = -9 + h * 0.75; addNode(gt, "t" + i, [x, -0.3], format(h, 0)); }
  float dur = end - start; if (dur < 0) { dur = dur + 24; }
  info = "**Продолжительность = конец − начало**, а если конец раньше начала — интервал переходит через полночь (к концу прибавляют 24 ч).\n\nС " + hm(start) + " до " + hm(end) + " прошло " + format(floor(dur), 0) + " ч " + format(round((dur - floor(dur)) * 60), 0) + " мин.";
}
]
