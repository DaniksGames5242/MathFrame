[
description = "{info}"
field width = 14; field height = 14;
camera type = fixed;
float k = 3; string info = "";
new Curve { name = "rose"; type = parametric; x = "cos(k * t * 6.2832) * cos(t * 6.2832) * 6"; y = "cos(k * t * 6.2832) * sin(t * 6.2832) * 6"; color = #3b82f6; thickness = 3 }
new UI { type = slider; label = "k (лепестков)"; variable = k; min = 2; max = 7; step = 1; default = 3 }
show axes = true;
Update {
  float n = k; if (k - 2 * floor(k / 2) == 0) { n = 2 * k; }
  info = "**Полярное уравнение линии** r = a·cos(kθ) при k = " + format(k, 0) + " задаёт розу с " + format(n, 0) + " лепестками.\n\nРадиус r зависит только от угла θ: при нечётном k получается k лепестков, при чётном — 2k.";
}
]
