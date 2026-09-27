[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
float x = 3.4; float y = 3.7; string info = "";
show axes = true; show grid = true;
new Point { name = "A"; pos = (3.4, 0); collision = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "B"; pos = (3.7, 0); collision = false; collideWithPoints = false; color = #f59e0b }
Update {
  x = round(A.pos.x * 100) / 100; y = round(B.pos.x * 100) / 100;
  A.pos.y = 0; B.pos.y = 0;
  string rel = "="; if (x > y) { rel = ">"; } if (x < y) { rel = "<"; }
  info = "Синяя точка x = " + format(x, 2) + ", оранжевая y = " + format(y, 2) + ": x " + rel + " y.\n\nСравнение начинают с целой части, затем сравнивают цифры дробной части слева направо; правее на числовой прямой — большее число.";
}
]
