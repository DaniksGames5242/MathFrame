[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Расстояние |AB| — инвариант для одной группы преобразований и не инвариант для
// другой. A, B перетаскиваются свободно; A', B' — их образ под выбранным преобразованием
// (вращение/отражение — движения; масштабирование — не движение). ----
new Point { name = "A"; pos = (-2.8, -1); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (1.8, 2.6); text = true("B"); pauseOnDrag = false }
new Point { name = "O"; pos = (0, 0); text = true("O"); dynamic = false; collision = false }
new Line { name = "ab"; pos = (A, B); interact = false }
new Point { name = "A2"; pos = (0, 0); text = true("A′"); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "B2"; pos = (0, 0); text = true("B′"); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "a2b2"; pos = (A2, B2); interact = false; color = #f59e0b }

draw Text { name = "tAB"; pos = (-7.6, 4.3); text = "|AB| = " + format(ab.length, 2); size = 1.1; align = left }
draw Text { name = "tA2B2"; pos = (-7.6, 3.4); text = "|A′B′| = " + format(a2b2.length, 2); size = 1.1; align = left; color = #f59e0b }
draw Text { name = "tRes"; pos = (-7.6, 2.4); text = resText; size = 1.1; align = left; color = resCol }

new UI { name = "sT"; type = select; label = "преобразование"; variable = tr; options = ("rot", "refl", "scale"); labels = ("поворот вокруг O", "отражение от оси x = 0", "растяжение от O в k раз"); default = "rot" }
new UI { name = "sA"; type = slider; label = "угол"; variable = ang; min = 0; max = 360; step = 1; default = 60 }
new UI { name = "sK"; type = slider; label = "k"; variable = k; min = 0.3; max = 1.4; step = 0.05; default = 1.2 }

string tr = "rot"; float ang = 60; float k = 1.2;
float rMax = 3.4;
string resText = ""; string resCol = "#6b7280";
string info = "";

Function info2() {
  if (tr == "scale") { return "При растяжении в k раз (k ≠ 1) расстояние умножается на |k| — оно уже не сохраняется, потому что растяжение не входит в группу движений."; }
  return "Двигайте A и B и меняйте параметр преобразования — |AB| и |A′B′| остаются равны при любом повороте или отражении.";
}

Update {
  float ox = O.pos.x; float oy = O.pos.y;
  // Держим A, B в круге радиуса rMax вокруг O — тогда их образ под любым поворотом или
  // растяжением (в допустимом диапазоне k) не выйдет за поле.
  float rA = sqrt((A.pos.x - ox) * (A.pos.x - ox) + (A.pos.y - oy) * (A.pos.y - oy));
  if (rA > rMax) { A.pos.x = ox + (A.pos.x - ox) * rMax / rA; A.pos.y = oy + (A.pos.y - oy) * rMax / rA; }
  float rB = sqrt((B.pos.x - ox) * (B.pos.x - ox) + (B.pos.y - oy) * (B.pos.y - oy));
  if (rB > rMax) { B.pos.x = ox + (B.pos.x - ox) * rMax / rB; B.pos.y = oy + (B.pos.y - oy) * rMax / rB; }
  if (tr == "rot") {
    float r = ang * pi / 180;
    float ax = A.pos.x - ox; float ay = A.pos.y - oy;
    float bx = B.pos.x - ox; float by = B.pos.y - oy;
    A2.pos.x = ox + ax * cos(r) - ay * sin(r); A2.pos.y = oy + ax * sin(r) + ay * cos(r);
    B2.pos.x = ox + bx * cos(r) - by * sin(r); B2.pos.y = oy + bx * sin(r) + by * cos(r);
  } else if (tr == "refl") {
    A2.pos.x = -A.pos.x; A2.pos.y = A.pos.y;
    B2.pos.x = -B.pos.x; B2.pos.y = B.pos.y;
  } else {
    A2.pos.x = ox + (A.pos.x - ox) * k; A2.pos.y = oy + (A.pos.y - oy) * k;
    B2.pos.x = ox + (B.pos.x - ox) * k; B2.pos.y = oy + (B.pos.y - oy) * k;
  }

  if (abs(ab.length - a2b2.length) < 0.01) { resText = "расстояние сохранилось — инвариант этого преобразования"; resCol = "#22c55e"; }
  else { resText = "расстояние изменилось — не инвариант этого преобразования"; resCol = "#f59e0b"; }

  info = "**Инвариант** — свойство объекта, сохраняющееся при определённом классе преобразований; для другого класса оно может и не сохраняться. Расстояние |AB| между двумя точками — инвариант **движений** плоскости (поворотов, отражений): оно не меняется, какую бы точку A или B ни взять и на какой угол ни повернуть.\n\n" + info2();
}
]
