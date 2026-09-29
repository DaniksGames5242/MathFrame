[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Календарь выбранного месяца: дни недели — по остатку от деления числа дней на 7. ----
draw Graph { name = "gC"; graph = "gc"; nodeRadius = 13; nodeColor = #3b82f6; labels = true; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gW"; graph = "gw"; nodeRadius = 13; nodeColor = #f59e0b; labels = true; interactive = false; showWeights = false; layer = 5 }
draw Text { name = "t0"; pos = (-4.5, 4.3); text = "Пн"; size = 0.9 }
draw Text { name = "t1"; pos = (-3, 4.3); text = "Вт"; size = 0.9 }
draw Text { name = "t2"; pos = (-1.5, 4.3); text = "Ср"; size = 0.9 }
draw Text { name = "t3"; pos = (0, 4.3); text = "Чт"; size = 0.9 }
draw Text { name = "t4"; pos = (1.5, 4.3); text = "Пт"; size = 0.9 }
draw Text { name = "t5"; pos = (3, 4.3); text = "Сб"; size = 0.9 }
draw Text { name = "t6"; pos = (4.5, 4.3); text = "Вс"; size = 0.9 }
draw Text { name = "ttl"; pos = (-7.7, 4.3); text = mname(mo) + " " + format(yr, 0); size = 1; align = left }

new UI { name = "sY"; type = slider; label = "год"; variable = yr; min = 1580; max = 2400; step = 1; default = 2024 }
new UI { name = "sM"; type = slider; label = "месяц"; variable = mo; min = 1; max = 12; step = 1; default = 2 }
new UI { name = "sS"; type = slider; label = "интервал, с"; variable = secs; min = 0; max = 400000; step = 1; default = 100000 }

// ---- Логика ----
float yr = 2024; float mo = 2; float secs = 100000; float key = -1;
string info = "";

Function md(a, b) { return a - floor(a / b) * b; }
Function leap(y) { if (md(y, 400) == 0) { return 1; } if (md(y, 100) == 0) { return 0; } if (md(y, 4) == 0) { return 1; } return 0; }
Function dim(y, m) {
  if (m == 2) { return 28 + leap(y); }
  if (m == 4 || m == 6 || m == 9 || m == 11) { return 30; }
  return 31;
}
Function mname(m) {
  if (m == 1) { return "январь"; } if (m == 2) { return "февраль"; } if (m == 3) { return "март"; } if (m == 4) { return "апрель"; }
  if (m == 5) { return "май"; } if (m == 6) { return "июнь"; } if (m == 7) { return "июль"; } if (m == 8) { return "август"; }
  if (m == 9) { return "сентябрь"; } if (m == 10) { return "октябрь"; } if (m == 11) { return "ноябрь"; } return "декабрь";
}
Function dname(w) {
  if (w == 0) { return "понедельник"; } if (w == 1) { return "вторник"; } if (w == 2) { return "среда"; } if (w == 3) { return "четверг"; }
  if (w == 4) { return "пятница"; } if (w == 5) { return "суббота"; } return "воскресенье";
}
// число дней от 01.01.0001 (понедельник) до 1-го числа месяца m года y
Function first(y, m) {
  float d = 365 * (y - 1) + floor((y - 1) / 4) - floor((y - 1) / 100) + floor((y - 1) / 400);
  repeat (m - 1) { d = d + dim(y, i + 1); }
  return d;
}

Update {
  if (key != yr * 100 + mo) {
    gc = newGraph(); gw = newGraph();
    float w0 = md(first(yr, mo), 7); float n = dim(yr, mo);
    repeat (n) {
      float c = md(w0 + i, 7); float r = floor((w0 + i) / 7);
      if (c >= 5) { addNode(gw, "d" + format(i, 0), [-4.5 + 1.5 * c, 3.0 - 1.25 * r], format(i + 1, 0)); }
      else { addNode(gc, "d" + format(i, 0), [-4.5 + 1.5 * c, 3.0 - 1.25 * r], format(i + 1, 0)); }
    }
    key = yr * 100 + mo;
  }
  float ly = leap(yr); float n = dim(yr, mo);
  info = "**Год " + format(yr, 0) + ": ";
  if (ly == 1) { info = info + "високосный**, 366 дней"; } else { info = info + "невисокосный**, 365 дней"; }
  info = info + " (";
  if (md(yr, 400) == 0) { info = info + "делится на 400"; }
  else { if (md(yr, 100) == 0) { info = info + "делится на 100, но не на 400"; } else { if (md(yr, 4) == 0) { info = info + "делится на 4, но не на 100"; } else { info = info + "не делится на 4"; } } }
  info = info + "). В феврале " + format(28 + ly, 0) + " дн.; " + mname(mo) + " — **" + format(n, 0) + " дн.** = " + format(floor(n / 7), 0) + " нед. + " + format(md(n, 7), 0) + " дн., поэтому первое число следующего месяца сдвигается по дням недели на " + format(md(n, 7), 0) + ". Первое число — **" + dname(md(first(yr, mo), 7)) + "**.\n\n";
  float d = floor(secs / 86400); float h = floor(md(secs, 86400) / 3600); float mi = floor(md(secs, 3600) / 60); float s = md(secs, 60);
  info = info + "**Единицы времени неоднородны:** " + format(secs, 0) + " с = " + format(d, 0) + " сут " + format(h, 0) + " ч " + format(mi, 0) + " мин " + format(s, 0) + " с (основания 60, 60, 24 — и лишь потом 7, 28…31, 365/366). В 400-летнем цикле 97 високосных лет, 146 097 дней = 20 871 неделя: календарь повторяется точно.";
}
]
