[
description = "{info}"

field width = 9;
field height = 7;
field depth = 7;
show grid = false;
show axes = false;
camera start rot = (12, 72);
camera start zoom = 1.35;

// ---- Буква F (асимметричная фигура) повёрнута кватернионами: слева — q₁q₂ (сначала q₂,
// потом q₁), справа — q₂q₁. Серая F — исходное положение, пунктирные оси — оси поворотов. ----
new Point3D { name = "lA"; pos = (-2.3, -1, 0); dynamic = false; active = false }
new Point3D { name = "glA"; pos = (-2.3, -1, 0); dynamic = false; active = false }
new Point3D { name = "lB"; pos = (-2.3, 1, 0); dynamic = false; active = false }
new Point3D { name = "glB"; pos = (-2.3, 1, 0); dynamic = false; active = false }
new Point3D { name = "lC"; pos = (-1.5, 1, 0); dynamic = false; active = false }
new Point3D { name = "glC"; pos = (-1.5, 1, 0); dynamic = false; active = false }
new Point3D { name = "lD"; pos = (-2.3, 0.2, 0); dynamic = false; active = false }
new Point3D { name = "glD"; pos = (-2.3, 0.2, 0); dynamic = false; active = false }
new Point3D { name = "lE"; pos = (-1.75, 0.2, 0); dynamic = false; active = false }
new Point3D { name = "glE"; pos = (-1.75, 0.2, 0); dynamic = false; active = false }
new Point3D { name = "lF"; pos = (-2.3, -1, 0.6); dynamic = false; active = false }
new Point3D { name = "glF"; pos = (-2.3, -1, 0.6); dynamic = false; active = false }
new Line3D { name = "lAB"; pos = (lA, lB); color = #3b82f6; thickness = 5 }
new Line3D { name = "glAB"; pos = (glA, glB); color = #6b7280; thickness = 1.5 }
new Line3D { name = "lBC"; pos = (lB, lC); color = #3b82f6; thickness = 5 }
new Line3D { name = "glBC"; pos = (glB, glC); color = #6b7280; thickness = 1.5 }
new Line3D { name = "lDE"; pos = (lD, lE); color = #3b82f6; thickness = 5 }
new Line3D { name = "glDE"; pos = (glD, glE); color = #6b7280; thickness = 1.5 }
new Line3D { name = "lAF"; pos = (lA, lF); color = #3b82f6; thickness = 5 }
new Line3D { name = "glAF"; pos = (glA, glF); color = #6b7280; thickness = 1.5 }
new Point3D { name = "lC0"; pos = (-2.3, 0, 0); dynamic = false; size = 0.5 }
new Point3D { name = "rA"; pos = (2.3, -1, 0); dynamic = false; active = false }
new Point3D { name = "grA"; pos = (2.3, -1, 0); dynamic = false; active = false }
new Point3D { name = "rB"; pos = (2.3, 1, 0); dynamic = false; active = false }
new Point3D { name = "grB"; pos = (2.3, 1, 0); dynamic = false; active = false }
new Point3D { name = "rC"; pos = (3.1, 1, 0); dynamic = false; active = false }
new Point3D { name = "grC"; pos = (3.1, 1, 0); dynamic = false; active = false }
new Point3D { name = "rD"; pos = (2.3, 0.2, 0); dynamic = false; active = false }
new Point3D { name = "grD"; pos = (2.3, 0.2, 0); dynamic = false; active = false }
new Point3D { name = "rE"; pos = (2.85, 0.2, 0); dynamic = false; active = false }
new Point3D { name = "grE"; pos = (2.85, 0.2, 0); dynamic = false; active = false }
new Point3D { name = "rF"; pos = (2.3, -1, 0.6); dynamic = false; active = false }
new Point3D { name = "grF"; pos = (2.3, -1, 0.6); dynamic = false; active = false }
new Line3D { name = "rAB"; pos = (rA, rB); color = #3b82f6; thickness = 5 }
new Line3D { name = "grAB"; pos = (grA, grB); color = #6b7280; thickness = 1.5 }
new Line3D { name = "rBC"; pos = (rB, rC); color = #3b82f6; thickness = 5 }
new Line3D { name = "grBC"; pos = (grB, grC); color = #6b7280; thickness = 1.5 }
new Line3D { name = "rDE"; pos = (rD, rE); color = #3b82f6; thickness = 5 }
new Line3D { name = "grDE"; pos = (grD, grE); color = #6b7280; thickness = 1.5 }
new Line3D { name = "rAF"; pos = (rA, rF); color = #3b82f6; thickness = 5 }
new Line3D { name = "grAF"; pos = (grA, grF); color = #6b7280; thickness = 1.5 }
new Point3D { name = "rC0"; pos = (2.3, 0, 0); dynamic = false; size = 0.5 }
draw Text { name = "tl"; pos = (-2.3, 2.2, 0); text = "q₁·q₂"; size = 1.4 }
draw Text { name = "tr"; pos = (2.3, 2.2, 0); text = "q₂·q₁"; size = 1.4 }

new UI { name = "sA1"; type = select; label = "ось q₁"; variable = ax1; options = (0, 1, 2); labels = ("x", "y", "z"); default = 1 }
new UI { name = "sB1"; type = slider; label = "угол q₁"; variable = an1; min = 0; max = 180; step = 5; default = 90 }
new UI { name = "sA2"; type = select; label = "ось q₂"; variable = ax2; options = (0, 1, 2); labels = ("x", "y", "z"); default = 0 }
new UI { name = "sB2"; type = slider; label = "угол q₂"; variable = an2; min = 0; max = 180; step = 5; default = 90 }

// ---- Логика ----
float ax1 = 1; float an1 = 90; float ax2 = 0; float an2 = 90;
float m11 = 1; float m12 = 0; float m13 = 0; float m21 = 0; float m22 = 1; float m23 = 0; float m31 = 0; float m32 = 0; float m33 = 1;
float pw = 1; float px = 0; float py = 0; float pz = 0;
string info = "";

// Матрица поворота единичного кватерниона (w, x, y, z) → m11…m33
Function mat(w, x, y, z) {
  m11 = 1 - 2 * (y * y + z * z); m12 = 2 * (x * y - w * z); m13 = 2 * (x * z + w * y);
  m21 = 2 * (x * y + w * z); m22 = 1 - 2 * (x * x + z * z); m23 = 2 * (y * z - w * x);
  m31 = 2 * (x * z - w * y); m32 = 2 * (y * z + w * x); m33 = 1 - 2 * (x * x + y * y);
  return 0;
}
// Произведение кватернионов (a1 + b1i + c1j + d1k)(a2 + b2i + c2j + d2k) → pw, px, py, pz
Function qmul(a1, b1, c1, d1, a2, b2, c2, d2) {
  pw = a1 * a2 - b1 * b2 - c1 * c2 - d1 * d2;
  px = a1 * b2 + b1 * a2 + c1 * d2 - d1 * c2;
  py = a1 * c2 - b1 * d2 + c1 * a2 + d1 * b2;
  pz = a1 * d2 + b1 * c2 - c1 * b2 + d1 * a2;
  return 0;
}
Function num(v) { if (abs(v) < 0.005) { return "0"; } if (v < 0) { return "−" + format(abs(v), 2); } return format(v, 2); }
Function term(v, u) { if (abs(v) < 0.005) { return ""; } if (v < 0) { return " − " + format(abs(v), 2) + u; } return " + " + format(v, 2) + u; }
Function qstr() { return num(pw) + term(px, "i") + term(py, "j") + term(pz, "k"); }
Function axn(a) { if (a == 0) { return "i"; } if (a == 1) { return "j"; } return "k"; }

Update {
  // q = cos(φ/2) + sin(φ/2)·(ось)
  float h1 = radians(an1) / 2; float h2 = radians(an2) / 2;
  float a1 = cos(h1); float b1 = 0; float c1 = 0; float d1 = 0;
  if (ax1 == 0) { b1 = sin(h1); } if (ax1 == 1) { c1 = sin(h1); } if (ax1 == 2) { d1 = sin(h1); }
  float a2 = cos(h2); float b2 = 0; float c2 = 0; float d2 = 0;
  if (ax2 == 0) { b2 = sin(h2); } if (ax2 == 1) { c2 = sin(h2); } if (ax2 == 2) { d2 = sin(h2); }

  qmul(a2, b2, c2, d2, a1, b1, c1, d1); mat(pw, px, py, pz); string s21 = qstr();
  rA.pos.x = 2.3 + m11 * 0 + m12 * -1 + m13 * 0; rA.pos.y = m21 * 0 + m22 * -1 + m23 * 0; rA.pos.z = m31 * 0 + m32 * -1 + m33 * 0;
  rB.pos.x = 2.3 + m11 * 0 + m12 * 1 + m13 * 0; rB.pos.y = m21 * 0 + m22 * 1 + m23 * 0; rB.pos.z = m31 * 0 + m32 * 1 + m33 * 0;
  rC.pos.x = 2.3 + m11 * 0.8 + m12 * 1 + m13 * 0; rC.pos.y = m21 * 0.8 + m22 * 1 + m23 * 0; rC.pos.z = m31 * 0.8 + m32 * 1 + m33 * 0;
  rD.pos.x = 2.3 + m11 * 0 + m12 * 0.2 + m13 * 0; rD.pos.y = m21 * 0 + m22 * 0.2 + m23 * 0; rD.pos.z = m31 * 0 + m32 * 0.2 + m33 * 0;
  rE.pos.x = 2.3 + m11 * 0.55 + m12 * 0.2 + m13 * 0; rE.pos.y = m21 * 0.55 + m22 * 0.2 + m23 * 0; rE.pos.z = m31 * 0.55 + m32 * 0.2 + m33 * 0;
  rF.pos.x = 2.3 + m11 * 0 + m12 * -1 + m13 * 0.6; rF.pos.y = m21 * 0 + m22 * -1 + m23 * 0.6; rF.pos.z = m31 * 0 + m32 * -1 + m33 * 0.6;
  qmul(a1, b1, c1, d1, a2, b2, c2, d2); mat(pw, px, py, pz); string s12 = qstr();
  lA.pos.x = -2.3 + m11 * 0 + m12 * -1 + m13 * 0; lA.pos.y = m21 * 0 + m22 * -1 + m23 * 0; lA.pos.z = m31 * 0 + m32 * -1 + m33 * 0;
  lB.pos.x = -2.3 + m11 * 0 + m12 * 1 + m13 * 0; lB.pos.y = m21 * 0 + m22 * 1 + m23 * 0; lB.pos.z = m31 * 0 + m32 * 1 + m33 * 0;
  lC.pos.x = -2.3 + m11 * 0.8 + m12 * 1 + m13 * 0; lC.pos.y = m21 * 0.8 + m22 * 1 + m23 * 0; lC.pos.z = m31 * 0.8 + m32 * 1 + m33 * 0;
  lD.pos.x = -2.3 + m11 * 0 + m12 * 0.2 + m13 * 0; lD.pos.y = m21 * 0 + m22 * 0.2 + m23 * 0; lD.pos.z = m31 * 0 + m32 * 0.2 + m33 * 0;
  lE.pos.x = -2.3 + m11 * 0.55 + m12 * 0.2 + m13 * 0; lE.pos.y = m21 * 0.55 + m22 * 0.2 + m23 * 0; lE.pos.z = m31 * 0.55 + m32 * 0.2 + m33 * 0;
  lF.pos.x = -2.3 + m11 * 0 + m12 * -1 + m13 * 0.6; lF.pos.y = m21 * 0 + m22 * -1 + m23 * 0.6; lF.pos.z = m31 * 0 + m32 * -1 + m33 * 0.6;
  float same = abs(pw - (a2 * a1 - b2 * b1 - c2 * c1 - d2 * d1)) + abs(px - (a2 * b1 + b2 * a1 + c2 * d1 - d2 * c1)) + abs(py - (a2 * c1 - b2 * d1 + c2 * a1 + d2 * b1)) + abs(pz - (a2 * d1 + b2 * c1 - c2 * b1 + d2 * a1));

  info = "**Умножение кватернионов некоммутативно:** i·j = k, но j·i = −k. Единичный кватернион q = cos(φ/2) + sin(φ/2)·(ось) задаёт поворот пространства на угол φ вокруг оси (v ↦ q·v·q⁻¹), а произведение q₁q₂ — композицию поворотов: сначала q₂, потом q₁. Поэтому некоммутативность кватернионов — это некоммутативность поворотов в пространстве.\n\nq₁ = поворот на " + format(an1, 0) + "° вокруг оси " + axn(ax1) + ", q₂ — на " + format(an2, 0) + "° вокруг оси " + axn(ax2) + ":\nq₁·q₂ = " + s12 + ",   q₂·q₁ = " + s21 + ".";
  if (same < 0.001) { info = info + " Здесь произведения совпали — повороты вокруг одной оси (или на 0°) перестановочны."; }
  else { info = info + " Произведения различны — и буквы F слева и справа повёрнуты по-разному."; }
  info = info + "\n\nСцену можно вращать мышью.";
}
]
