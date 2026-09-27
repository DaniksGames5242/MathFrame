[
description = "{info}"

field width = 16;
field height = 11;
camera type = fixed;

// ---- Неподвижная окружность радиуса a и катящаяся по ней снаружи окружность того же радиуса ----
// Центр C катящейся окружности перетаскивается по своей траектории (окружность радиуса 2a),
// точка P на её ободе рисует кардиоиду. Кнопка «Прокатить» запускает качение.
float a = 1.6;
float phi = 1.2;
float playing = 0;
new Point { name = "O"; pos = (1, 0); dynamic = false; collision = false; size = 0.6; text = true("O") }
new Circle { name = "fixed"; center = O; radius = 1.6; thickness = 2 }
new Point { name = "PR"; pos = (4.2, 0); dynamic = false; collision = false; active = false }
new Circle { name = "path"; center = O; radius = PR; active = false }
new Point { name = "C"; circle = "path"; t = 0.19; text = true("C"); pauseOnDrag = false; collideWithPoints = false }
new Circle { name = "roll"; center = C; radius = 1.6; color = #f59e0b; thickness = 2 }
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; text = true("P"); color = #3b82f6 }
new Line { name = "cp"; pos = (C, P); color = #f59e0b; interact = false }

// След точки P — кардиоида от начального положения до текущего угла φ
new Curve { name = "trace"; type = parametric; x = "1 + 2 * a * cos(t * phi) - a * cos(2 * t * phi)"; y = "2 * a * sin(t * phi) - a * sin(2 * t * phi)"; segments = 300; color = #3b82f6; thickness = 3 }

new UI { name = "btnPlay"; type = button; label = "Прокатить"; action = "playing = 1 - playing" }
new UI { name = "btnReset"; type = button; label = "Сначала"; action = "phi = 0.001; playing = 0; C.t = 0.0002" }

// ---- Логика ----
string info = "";
float lastT = 0.19;

Update {
  PR.pos.x = O.pos.x + 2 * a; PR.pos.y = 0;
  if (playing == 1) {
    phi = phi + 0.02;
    if (phi >= 2 * pi) { phi = 2 * pi; playing = 0; }
    C.t = phi / (2 * pi);
  } else if (abs(C.t - lastT) > 0.000001) {
    // Пользователь тянет C: угол φ — угол положения центра катящейся окружности
    phi = C.t * 2 * pi;
    if (phi < 0.001) { phi = 0.001; }
  }
  lastT = C.t;
  // Точка на ободе: катящаяся окружность повернулась на 2φ
  P.pos.x = C.pos.x - a * cos(2 * phi); P.pos.y = C.pos.y - a * sin(2 * phi);

  info = "**Кардиоида** — траектория точки окружности радиуса a, катящейся без скольжения снаружи по неподвижной окружности того же радиуса.\n\nУравнения: x = 2a·cos φ − a·cos 2φ, y = 2a·sin φ − a·sin 2φ (центр — в центре неподвижной окружности). Пройдено φ = " + format(degrees(phi), 0) + "°; за полный оборот катящаяся окружность поворачивается дважды, а кривая замыкается в «сердечко» с точкой возврата.";
}
]
