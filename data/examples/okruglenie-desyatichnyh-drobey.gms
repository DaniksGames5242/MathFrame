[
description = "{info}"
field width = 20; field height = 6;
camera type = fixed;
float x = 3; string info = "";
show axes = true; show grid = true;
new Point { name = "A"; pos = (3, 0); collision = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "R"; pos = (3, 0); dynamic = false; collision = false; collideWithPoints = false; color = #f59e0b }
Update {
  x = A.pos.x; A.pos.y = 0;
  float r = round(x); R.pos.x = r; R.pos.y = 0.6;
  float frac = x - floor(x);
  string cmp = "меньше 0,5, поэтому целая часть остаётся без изменения"; if (frac >= 0.5) { cmp = "не меньше 0,5, поэтому целая часть увеличивается на 1"; }
  info = "Синяя точка x = " + format(x, 2) + " округляется до ближайшего целого: **" + format(r, 0) + "**.\n\nОтбрасываемая часть " + cmp + ".";
}
]
