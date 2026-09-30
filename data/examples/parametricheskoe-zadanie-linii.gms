[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

int tab = 1; string info = "";
float R = 3; float a2 = 0.9;

// ---- Вкладка 1: окружность x = R cos t, y = R sin t ----
new Curve { name = "cv1"; type = parametric; x = "R * cos(6.2831853 * t)"; y = "R * sin(6.2831853 * t)"; segments = 160; color = #3b82f6; thickness = 3 }
new Point { name = "M1"; curve = "cv1"; t = 0.12; text = true("M"); pauseOnDrag = false; color = #f59e0b }
new UI { name = "sR"; type = slider; label = "R"; variable = R; min = 1; max = 4.4; step = 0.1; default = 3 }
new Claster { name = "t1"; elements = (cv1, M1, sR); active = true }

// ---- Вкладка 2: циклоида x = a(t − sin t), y = a(1 − cos t), t ∈ [0; 4π] ----
new Curve { name = "cv2"; type = parametric; x = "a2 * (12.5663706 * t - sin(12.5663706 * t)) - 6.283 * a2"; y = "a2 * (1 - cos(12.5663706 * t)) - 3.5"; segments = 300; color = #3b82f6; thickness = 3 }
new Point { name = "M2"; curve = "cv2"; t = 0.3; text = true("M"); pauseOnDrag = false; color = #f59e0b }
new UI { name = "sA"; type = slider; label = "a"; variable = a2; min = 0.4; max = 1.1; step = 0.05; default = 0.9 }
new Claster { name = "t2"; elements = (cv2, M2, sA); active = false }

// ---- Вкладка 3: одна парабола y = x²/3 − 3.5, две параметризации ----
new Curve { name = "cv3"; type = parametric; x = "4.5 * (2 * t - 1)"; y = "(4.5 * (2 * t - 1)) ^ 2 / 3 - 3.5"; segments = 120; color = #3b82f6; thickness = 3 }
new Point { name = "M3"; curve = "cv3"; t = 0.85; text = true("M"); pauseOnDrag = false; color = #f59e0b; collideWithPoints = false }
new Point { name = "N3"; pos = (0, 0); dynamic = false; collision = false; text = true("N"); color = #22c55e }
new Claster { name = "t3"; elements = (cv3, M3, N3); active = false }

new UI { type = button; name = "bt1"; label = "Окружность"; action = "tab = 1; t1.active = true; t2.active = false; t3.active = false" }
new UI { type = button; name = "bt2"; label = "Циклоида"; action = "tab = 2; t1.active = false; t2.active = true; t3.active = false" }
new UI { type = button; name = "bt3"; label = "Две параметризации"; action = "tab = 3; t1.active = false; t2.active = false; t3.active = true" }

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  if (tab == 1) {
    float t = 6.2831853 * M1.t;
    info = "**Параметрическое задание линии:** координаты точки выражаются через параметр t. Окружность: x = R cos t, y = R sin t, t ∈ [0; 2π), R = " + format(R, 1) + ".\n\nПри t = " + format(t, 2) + " точка M = (" + num(R * cos(t), 2) + "; " + num(R * sin(t), 2) + "). Исключая t (cos² t + sin² t = 1), получаем уравнение x² + y² = " + format(R * R, 2) + "; параметр здесь — угол.";
  }
  if (tab == 2) {
    float t = 12.5663706 * M2.t;
    float x = a2 * (t - sin(t)); float y = a2 * (1 - cos(t));
    info = "**Циклоида** — траектория точки окружности радиуса a = " + format(a2, 2) + ", катящейся по прямой: x = a(t − sin t), y = a(1 − cos t), t — угол поворота.\n\nПри t = " + format(t, 2) + " точка M = (" + num(x, 2) + "; " + num(y, 2) + ") относительно начала арки. Исключить t в элементарных функциях нельзя — y(x) не выражается, и параметрическая форма остаётся единственным простым описанием линии.";
  }
  if (tab == 3) {
    float s = 2 * M3.t - 1;
    float nx = 4.5 * s * s * s;
    N3.pos.x = nx; N3.pos.y = nx * nx / 3 - 3.5;
    info = "**Одна линия — разные параметризации.** Парабола y = x²/3 − 3,5 задана двумя способами: M — x = 4,5 s, y = 4,5² s²/3 − 3,5; N — x = 4,5 s³, y = 4,5² s⁶/3 − 3,5, s ∈ [−1; 1].\n\nПри s = " + num(s, 2) + ": M = (" + num(M3.pos.x, 2) + "; " + num(M3.pos.y, 2) + "), N = (" + num(N3.pos.x, 2) + "; " + num(N3.pos.y, 2) + "). Значение параметра одно, точки разные, а множество точек — одна и та же линия: параметр несёт «скорость» движения, а не сам образ.";
  }
}
]
