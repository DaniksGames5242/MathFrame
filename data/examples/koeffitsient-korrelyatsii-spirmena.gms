[
description = "{info}"

field width = 16; field height = 10;
camera type = fixed;

// ---- Восемь наблюдений (xᵢ, yᵢ). Внизу две шкалы рангов: серый отрезок соединяет ранг Rᵢ объекта по x с его рангом Sᵢ по y,
// чем «вертикальнее» отрезки, тем больше согласованность. Ранги считаются отдельно по x и по y. ----
new Point { name = "P1"; pos = (-5.5, -2.2); pauseOnDrag = false }
new Point { name = "P2"; pos = (-4.2, -0.8); pauseOnDrag = false }
new Point { name = "P3"; pos = (-2.6, 1.6); pauseOnDrag = false }
new Point { name = "P4"; pos = (-0.9, -1.4); pauseOnDrag = false }
new Point { name = "P5"; pos = (0.7, 0.9); pauseOnDrag = false }
new Point { name = "P6"; pos = (2.4, 2.4); pauseOnDrag = false }
new Point { name = "P7"; pos = (4.1, 0.2); pauseOnDrag = false }
new Point { name = "P8"; pos = (5.8, 3.3); pauseOnDrag = false }
draw Graph { name = "gS"; graph = "gs"; edgeColor = #3b82f688; edgeWidth = 1.5; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 2 }
draw Graph { name = "gL"; graph = "gl"; edgeColor = #f59e0b; edgeWidth = 3; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 3 }
draw Text { name = "tR"; pos = (-7.6, -3.75); text = "R (ранги x)"; size = 0.8; align = left }
draw Text { name = "tS"; pos = (-7.6, -4.65); text = "S (ранги y)"; size = 0.8; align = left }
new UI { name = "sQ"; type = slider; label = "y → sign(y)·|y/4|^q"; variable = q; min = 1; max = 5; step = 0.5; default = 1 }

// ---- Логика ----
float q = 1; float key = -1; string info = "";
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function px(k) { if (k == 0) { return P1.pos.x; } if (k == 1) { return P2.pos.x; } if (k == 2) { return P3.pos.x; } if (k == 3) { return P4.pos.x; } if (k == 4) { return P5.pos.x; } if (k == 5) { return P6.pos.x; } if (k == 6) { return P7.pos.x; } if (k == 7) { return P8.pos.x; } return 0; }
Function py(k) { if (k == 0) { return P1.pos.y; } if (k == 1) { return P2.pos.y; } if (k == 2) { return P3.pos.y; } if (k == 3) { return P4.pos.y; } if (k == 4) { return P5.pos.y; } if (k == 5) { return P6.pos.y; } if (k == 6) { return P7.pos.y; } if (k == 7) { return P8.pos.y; } return 0; }
Function tr(v) { return sign(v) * pow(abs(v) / 4, q); }
Function rx(k) { float r = 1; repeat (8) { if (px(i) < px(k) - 0.000001) { r = r + 1; } else { if (i != k && abs(px(i) - px(k)) <= 0.000001) { r = r + 0.5; } } } return r; }
Function ry(k) { float r = 1; repeat (8) { if (py(i) < py(k) - 0.000001) { r = r + 1; } else { if (i != k && abs(py(i) - py(k)) <= 0.000001) { r = r + 0.5; } } } return r; }
Function ty(k) { return tr(py(k)); }
Function rt(k) { float r = 1; repeat (8) { if (ty(i) < ty(k) - 0.000001) { r = r + 1; } else { if (i != k && abs(ty(i) - ty(k)) <= 0.000001) { r = r + 0.5; } } } return r; }

Update {
  float k2 = q; repeat (8) { k2 = k2 * 1.0137 + px(i) * (i + 3) + py(i) * (i + 7.3); }
  if (k2 != key) {
    key = k2;
    gs = newGraph(); gl = newGraph();
    float sd = 0; float sdt = 0; string rr = ""; string ss = "";
    repeat (8) {
      float a = rx(i); float b = ry(i);
      sd = sd + (a - b) * (a - b); sdt = sdt + (a - rt(i)) * (a - rt(i));
      rr = rr + format(a, 0); ss = ss + format(b, 0);
      if (i < 7) { rr = rr + ", "; ss = ss + ", "; }
      addNode(gs, "a" + format(i, 0), [-4.5 + 1.3 * (a - 1), -3.3]); addNode(gs, "b" + format(i, 0), [-4.5 + 1.3 * (b - 1), -4.5]); addEdge(gs, "a" + format(i, 0), "b" + format(i, 0));
    }
    float rs = 1 - 6 * sd / (8 * 63);
    // Пирсон по значениям x и y (для сравнения)
    float mx = 0; float my = 0; repeat (8) { mx = mx + px(i) / 8; my = my + py(i) / 8; }
    float cv = 0; float vx = 0; float vy = 0; repeat (8) { cv = cv + (px(i) - mx) * (py(i) - my); vx = vx + (px(i) - mx) * (px(i) - mx); vy = vy + (py(i) - my) * (py(i) - my); }
    float rp = 0; if (vx * vy > 0.000001) { rp = cv / sqrt(vx * vy); }
    // Пирсон для (x, y′), y′ = tr(y)
    float my2 = 0; repeat (8) { my2 = my2 + ty(i) / 8; }
    float cv2 = 0; float vy2 = 0; repeat (8) { cv2 = cv2 + (px(i) - mx) * (ty(i) - my2); vy2 = vy2 + (ty(i) - my2) * (ty(i) - my2); }
    float rp2 = 0; if (vx * vy2 > 0.000001) { rp2 = cv2 / sqrt(vx * vy2); }
    info = "**Ранги** Rᵢ переменной x: " + rr + "; Sᵢ переменной y: " + ss + ". Расхождения dᵢ = Rᵢ − Sᵢ, ∑dᵢ² = " + format(sd, 1) + ".\n\n";
    info = info + "**r_S = 1 − 6·∑dᵢ² / (n(n² − 1)) = 1 − 6·" + format(sd, 1) + " / 504 = " + num(rs, 3) + "**";
    if (rs > 0.999) { info = info + " — ранги совпадают: одна переменная монотонно возрастает вместе с другой."; }
    if (rs < -0.999) { info = info + " — ранги обратно упорядочены: одна переменная монотонно убывает при росте другой."; }
    info = info + "\n\n";
    info = info + "**Коэффициент Пирсона** по значениям: r = " + num(rp, 3) + ", он зависит от самих чисел. Заменим y возрастающей функцией y′ = sign(y)·|y/4|^" + format(q, 1) + ": r(x, y′) = " + num(rp2, 3) + ", а r_S = " + num(1 - 6 * sdt / 504, 3) + " — ранги не изменились.";
  }
}
]
