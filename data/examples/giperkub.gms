[
description = "{info}"

field width = 8;
field height = 8;
field depth = 8;
show grid = false;
show axes = false;

// ---- Тессеракт: 16 вершин (±½, ±½, ±½, ±½), 32 ребра. Поворот в плоскостях xw и yw,
// затем перспективная проекция из 4D в 3D: чем больше w, тем ближе вершина к «глазу». ----
new Point3D { name = "V0"; pos = (0, 0, 0); dynamic = false; size = 0.6; text = true("0000") }
new Point3D { name = "V1"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V2"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V3"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V4"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V5"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V6"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V7"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V8"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V9"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V10"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V11"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V12"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V13"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V14"; pos = (0, 0, 0); dynamic = false; size = 0.6 }
new Point3D { name = "V15"; pos = (0, 0, 0); dynamic = false; size = 0.6; text = true("1111") }
new Line3D { name = "e0"; pos = (V0, V1); color = #3b82f6; thickness = 2 }
new Line3D { name = "e1"; pos = (V0, V2); color = #3b82f6; thickness = 2 }
new Line3D { name = "e2"; pos = (V0, V4); color = #3b82f6; thickness = 2 }
new Line3D { name = "e3"; pos = (V0, V8); color = #f59e0b; thickness = 2 }
new Line3D { name = "e4"; pos = (V1, V3); color = #3b82f6; thickness = 2 }
new Line3D { name = "e5"; pos = (V1, V5); color = #3b82f6; thickness = 2 }
new Line3D { name = "e6"; pos = (V1, V9); color = #f59e0b; thickness = 2 }
new Line3D { name = "e7"; pos = (V2, V3); color = #3b82f6; thickness = 2 }
new Line3D { name = "e8"; pos = (V2, V6); color = #3b82f6; thickness = 2 }
new Line3D { name = "e9"; pos = (V2, V10); color = #f59e0b; thickness = 2 }
new Line3D { name = "e10"; pos = (V3, V7); color = #3b82f6; thickness = 2 }
new Line3D { name = "e11"; pos = (V3, V11); color = #f59e0b; thickness = 2 }
new Line3D { name = "e12"; pos = (V4, V5); color = #3b82f6; thickness = 2 }
new Line3D { name = "e13"; pos = (V4, V6); color = #3b82f6; thickness = 2 }
new Line3D { name = "e14"; pos = (V4, V12); color = #f59e0b; thickness = 2 }
new Line3D { name = "e15"; pos = (V5, V7); color = #3b82f6; thickness = 2 }
new Line3D { name = "e16"; pos = (V5, V13); color = #f59e0b; thickness = 2 }
new Line3D { name = "e17"; pos = (V6, V7); color = #3b82f6; thickness = 2 }
new Line3D { name = "e18"; pos = (V6, V14); color = #f59e0b; thickness = 2 }
new Line3D { name = "e19"; pos = (V7, V15); color = #f59e0b; thickness = 2 }
new Line3D { name = "e20"; pos = (V8, V9); color = #3b82f6; thickness = 2 }
new Line3D { name = "e21"; pos = (V8, V10); color = #3b82f6; thickness = 2 }
new Line3D { name = "e22"; pos = (V8, V12); color = #3b82f6; thickness = 2 }
new Line3D { name = "e23"; pos = (V9, V11); color = #3b82f6; thickness = 2 }
new Line3D { name = "e24"; pos = (V9, V13); color = #3b82f6; thickness = 2 }
new Line3D { name = "e25"; pos = (V10, V11); color = #3b82f6; thickness = 2 }
new Line3D { name = "e26"; pos = (V10, V14); color = #3b82f6; thickness = 2 }
new Line3D { name = "e27"; pos = (V11, V15); color = #3b82f6; thickness = 2 }
new Line3D { name = "e28"; pos = (V12, V13); color = #3b82f6; thickness = 2 }
new Line3D { name = "e29"; pos = (V12, V14); color = #3b82f6; thickness = 2 }
new Line3D { name = "e30"; pos = (V13, V15); color = #3b82f6; thickness = 2 }
new Line3D { name = "e31"; pos = (V14, V15); color = #3b82f6; thickness = 2 }
new Point3D { name = "H0"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "H1"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "H2"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "H3"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "H4"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "H5"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "H6"; pos = (0, 0, 0); dynamic = false; active = false }
new Point3D { name = "H7"; pos = (0, 0, 0); dynamic = false; active = false }
new Line3D { name = "h0"; pos = (H0, H1); color = #22c55e; thickness = 6 }
new Line3D { name = "h1"; pos = (H0, H2); color = #22c55e; thickness = 6 }
new Line3D { name = "h2"; pos = (H0, H4); color = #22c55e; thickness = 6 }
new Line3D { name = "h3"; pos = (H1, H3); color = #22c55e; thickness = 6 }
new Line3D { name = "h4"; pos = (H1, H5); color = #22c55e; thickness = 6 }
new Line3D { name = "h5"; pos = (H2, H3); color = #22c55e; thickness = 6 }
new Line3D { name = "h6"; pos = (H2, H6); color = #22c55e; thickness = 6 }
new Line3D { name = "h7"; pos = (H3, H7); color = #22c55e; thickness = 6 }
new Line3D { name = "h8"; pos = (H4, H5); color = #22c55e; thickness = 6 }
new Line3D { name = "h9"; pos = (H4, H6); color = #22c55e; thickness = 6 }
new Line3D { name = "h10"; pos = (H5, H7); color = #22c55e; thickness = 6 }
new Line3D { name = "h11"; pos = (H6, H7); color = #22c55e; thickness = 6 }

new UI { name = "sA"; type = slider; label = "поворот xw"; variable = aDeg; min = 0; max = 360; step = 1; default = 25 }
new UI { name = "sB"; type = slider; label = "поворот yw"; variable = bDeg; min = 0; max = 360; step = 1; default = 15 }
new UI { name = "tS"; type = toggle; label = "вращать"; variable = spin; default = false }
new UI { name = "sC"; type = select; label = "выделить куб"; variable = cell; options = (0, 1, 2, 3, 4, 5, 6, 7, 8); labels = ("нет", "x = 0", "x = 1", "y = 0", "y = 1", "z = 0", "z = 1", "w = 0", "w = 1"); default = 8 }

// ---- Логика ----
float aDeg = 25; float bDeg = 15;
bool spin = false;
float cell = 8;
float S = 3.3; float D = 2.4;
string info = "";

Update {
  if (spin) { aDeg = aDeg + 0.4; bDeg = bDeg + 0.25; if (aDeg > 360) { aDeg = aDeg - 360; } if (bDeg > 360) { bDeg = bDeg - 360; } }
  float ca = cos(radians(aDeg)); float sa = sin(radians(aDeg)); float cb = cos(radians(bDeg)); float sb = sin(radians(bDeg));
  float x = 0; float y = 0; float w = 0; float k = 0;
  x = -0.5 * ca - -0.5 * sa; w = -0.5 * sa + -0.5 * ca; y = -0.5 * cb - w * sb; w = -0.5 * sb + w * cb; k = S * D / (D - w);
  V0.pos.x = k * x; V0.pos.y = k * y; V0.pos.z = k * -0.5;
  x = 0.5 * ca - -0.5 * sa; w = 0.5 * sa + -0.5 * ca; y = -0.5 * cb - w * sb; w = -0.5 * sb + w * cb; k = S * D / (D - w);
  V1.pos.x = k * x; V1.pos.y = k * y; V1.pos.z = k * -0.5;
  x = -0.5 * ca - -0.5 * sa; w = -0.5 * sa + -0.5 * ca; y = 0.5 * cb - w * sb; w = 0.5 * sb + w * cb; k = S * D / (D - w);
  V2.pos.x = k * x; V2.pos.y = k * y; V2.pos.z = k * -0.5;
  x = 0.5 * ca - -0.5 * sa; w = 0.5 * sa + -0.5 * ca; y = 0.5 * cb - w * sb; w = 0.5 * sb + w * cb; k = S * D / (D - w);
  V3.pos.x = k * x; V3.pos.y = k * y; V3.pos.z = k * -0.5;
  x = -0.5 * ca - -0.5 * sa; w = -0.5 * sa + -0.5 * ca; y = -0.5 * cb - w * sb; w = -0.5 * sb + w * cb; k = S * D / (D - w);
  V4.pos.x = k * x; V4.pos.y = k * y; V4.pos.z = k * 0.5;
  x = 0.5 * ca - -0.5 * sa; w = 0.5 * sa + -0.5 * ca; y = -0.5 * cb - w * sb; w = -0.5 * sb + w * cb; k = S * D / (D - w);
  V5.pos.x = k * x; V5.pos.y = k * y; V5.pos.z = k * 0.5;
  x = -0.5 * ca - -0.5 * sa; w = -0.5 * sa + -0.5 * ca; y = 0.5 * cb - w * sb; w = 0.5 * sb + w * cb; k = S * D / (D - w);
  V6.pos.x = k * x; V6.pos.y = k * y; V6.pos.z = k * 0.5;
  x = 0.5 * ca - -0.5 * sa; w = 0.5 * sa + -0.5 * ca; y = 0.5 * cb - w * sb; w = 0.5 * sb + w * cb; k = S * D / (D - w);
  V7.pos.x = k * x; V7.pos.y = k * y; V7.pos.z = k * 0.5;
  x = -0.5 * ca - 0.5 * sa; w = -0.5 * sa + 0.5 * ca; y = -0.5 * cb - w * sb; w = -0.5 * sb + w * cb; k = S * D / (D - w);
  V8.pos.x = k * x; V8.pos.y = k * y; V8.pos.z = k * -0.5;
  x = 0.5 * ca - 0.5 * sa; w = 0.5 * sa + 0.5 * ca; y = -0.5 * cb - w * sb; w = -0.5 * sb + w * cb; k = S * D / (D - w);
  V9.pos.x = k * x; V9.pos.y = k * y; V9.pos.z = k * -0.5;
  x = -0.5 * ca - 0.5 * sa; w = -0.5 * sa + 0.5 * ca; y = 0.5 * cb - w * sb; w = 0.5 * sb + w * cb; k = S * D / (D - w);
  V10.pos.x = k * x; V10.pos.y = k * y; V10.pos.z = k * -0.5;
  x = 0.5 * ca - 0.5 * sa; w = 0.5 * sa + 0.5 * ca; y = 0.5 * cb - w * sb; w = 0.5 * sb + w * cb; k = S * D / (D - w);
  V11.pos.x = k * x; V11.pos.y = k * y; V11.pos.z = k * -0.5;
  x = -0.5 * ca - 0.5 * sa; w = -0.5 * sa + 0.5 * ca; y = -0.5 * cb - w * sb; w = -0.5 * sb + w * cb; k = S * D / (D - w);
  V12.pos.x = k * x; V12.pos.y = k * y; V12.pos.z = k * 0.5;
  x = 0.5 * ca - 0.5 * sa; w = 0.5 * sa + 0.5 * ca; y = -0.5 * cb - w * sb; w = -0.5 * sb + w * cb; k = S * D / (D - w);
  V13.pos.x = k * x; V13.pos.y = k * y; V13.pos.z = k * 0.5;
  x = -0.5 * ca - 0.5 * sa; w = -0.5 * sa + 0.5 * ca; y = 0.5 * cb - w * sb; w = 0.5 * sb + w * cb; k = S * D / (D - w);
  V14.pos.x = k * x; V14.pos.y = k * y; V14.pos.z = k * 0.5;
  x = 0.5 * ca - 0.5 * sa; w = 0.5 * sa + 0.5 * ca; y = 0.5 * cb - w * sb; w = 0.5 * sb + w * cb; k = S * D / (D - w);
  V15.pos.x = k * x; V15.pos.y = k * y; V15.pos.z = k * 0.5;
  // Выделенная трёхмерная грань: 8 вершин с фиксированной координатой
  if (cell == 1) { H0.pos.x = V0.pos.x; H0.pos.y = V0.pos.y; H0.pos.z = V0.pos.z; H1.pos.x = V2.pos.x; H1.pos.y = V2.pos.y; H1.pos.z = V2.pos.z; H2.pos.x = V4.pos.x; H2.pos.y = V4.pos.y; H2.pos.z = V4.pos.z; H3.pos.x = V6.pos.x; H3.pos.y = V6.pos.y; H3.pos.z = V6.pos.z; H4.pos.x = V8.pos.x; H4.pos.y = V8.pos.y; H4.pos.z = V8.pos.z; H5.pos.x = V10.pos.x; H5.pos.y = V10.pos.y; H5.pos.z = V10.pos.z; H6.pos.x = V12.pos.x; H6.pos.y = V12.pos.y; H6.pos.z = V12.pos.z; H7.pos.x = V14.pos.x; H7.pos.y = V14.pos.y; H7.pos.z = V14.pos.z; }
  if (cell == 2) { H0.pos.x = V1.pos.x; H0.pos.y = V1.pos.y; H0.pos.z = V1.pos.z; H1.pos.x = V3.pos.x; H1.pos.y = V3.pos.y; H1.pos.z = V3.pos.z; H2.pos.x = V5.pos.x; H2.pos.y = V5.pos.y; H2.pos.z = V5.pos.z; H3.pos.x = V7.pos.x; H3.pos.y = V7.pos.y; H3.pos.z = V7.pos.z; H4.pos.x = V9.pos.x; H4.pos.y = V9.pos.y; H4.pos.z = V9.pos.z; H5.pos.x = V11.pos.x; H5.pos.y = V11.pos.y; H5.pos.z = V11.pos.z; H6.pos.x = V13.pos.x; H6.pos.y = V13.pos.y; H6.pos.z = V13.pos.z; H7.pos.x = V15.pos.x; H7.pos.y = V15.pos.y; H7.pos.z = V15.pos.z; }
  if (cell == 3) { H0.pos.x = V0.pos.x; H0.pos.y = V0.pos.y; H0.pos.z = V0.pos.z; H1.pos.x = V1.pos.x; H1.pos.y = V1.pos.y; H1.pos.z = V1.pos.z; H2.pos.x = V4.pos.x; H2.pos.y = V4.pos.y; H2.pos.z = V4.pos.z; H3.pos.x = V5.pos.x; H3.pos.y = V5.pos.y; H3.pos.z = V5.pos.z; H4.pos.x = V8.pos.x; H4.pos.y = V8.pos.y; H4.pos.z = V8.pos.z; H5.pos.x = V9.pos.x; H5.pos.y = V9.pos.y; H5.pos.z = V9.pos.z; H6.pos.x = V12.pos.x; H6.pos.y = V12.pos.y; H6.pos.z = V12.pos.z; H7.pos.x = V13.pos.x; H7.pos.y = V13.pos.y; H7.pos.z = V13.pos.z; }
  if (cell == 4) { H0.pos.x = V2.pos.x; H0.pos.y = V2.pos.y; H0.pos.z = V2.pos.z; H1.pos.x = V3.pos.x; H1.pos.y = V3.pos.y; H1.pos.z = V3.pos.z; H2.pos.x = V6.pos.x; H2.pos.y = V6.pos.y; H2.pos.z = V6.pos.z; H3.pos.x = V7.pos.x; H3.pos.y = V7.pos.y; H3.pos.z = V7.pos.z; H4.pos.x = V10.pos.x; H4.pos.y = V10.pos.y; H4.pos.z = V10.pos.z; H5.pos.x = V11.pos.x; H5.pos.y = V11.pos.y; H5.pos.z = V11.pos.z; H6.pos.x = V14.pos.x; H6.pos.y = V14.pos.y; H6.pos.z = V14.pos.z; H7.pos.x = V15.pos.x; H7.pos.y = V15.pos.y; H7.pos.z = V15.pos.z; }
  if (cell == 5) { H0.pos.x = V0.pos.x; H0.pos.y = V0.pos.y; H0.pos.z = V0.pos.z; H1.pos.x = V1.pos.x; H1.pos.y = V1.pos.y; H1.pos.z = V1.pos.z; H2.pos.x = V2.pos.x; H2.pos.y = V2.pos.y; H2.pos.z = V2.pos.z; H3.pos.x = V3.pos.x; H3.pos.y = V3.pos.y; H3.pos.z = V3.pos.z; H4.pos.x = V8.pos.x; H4.pos.y = V8.pos.y; H4.pos.z = V8.pos.z; H5.pos.x = V9.pos.x; H5.pos.y = V9.pos.y; H5.pos.z = V9.pos.z; H6.pos.x = V10.pos.x; H6.pos.y = V10.pos.y; H6.pos.z = V10.pos.z; H7.pos.x = V11.pos.x; H7.pos.y = V11.pos.y; H7.pos.z = V11.pos.z; }
  if (cell == 6) { H0.pos.x = V4.pos.x; H0.pos.y = V4.pos.y; H0.pos.z = V4.pos.z; H1.pos.x = V5.pos.x; H1.pos.y = V5.pos.y; H1.pos.z = V5.pos.z; H2.pos.x = V6.pos.x; H2.pos.y = V6.pos.y; H2.pos.z = V6.pos.z; H3.pos.x = V7.pos.x; H3.pos.y = V7.pos.y; H3.pos.z = V7.pos.z; H4.pos.x = V12.pos.x; H4.pos.y = V12.pos.y; H4.pos.z = V12.pos.z; H5.pos.x = V13.pos.x; H5.pos.y = V13.pos.y; H5.pos.z = V13.pos.z; H6.pos.x = V14.pos.x; H6.pos.y = V14.pos.y; H6.pos.z = V14.pos.z; H7.pos.x = V15.pos.x; H7.pos.y = V15.pos.y; H7.pos.z = V15.pos.z; }
  if (cell == 7) { H0.pos.x = V0.pos.x; H0.pos.y = V0.pos.y; H0.pos.z = V0.pos.z; H1.pos.x = V1.pos.x; H1.pos.y = V1.pos.y; H1.pos.z = V1.pos.z; H2.pos.x = V2.pos.x; H2.pos.y = V2.pos.y; H2.pos.z = V2.pos.z; H3.pos.x = V3.pos.x; H3.pos.y = V3.pos.y; H3.pos.z = V3.pos.z; H4.pos.x = V4.pos.x; H4.pos.y = V4.pos.y; H4.pos.z = V4.pos.z; H5.pos.x = V5.pos.x; H5.pos.y = V5.pos.y; H5.pos.z = V5.pos.z; H6.pos.x = V6.pos.x; H6.pos.y = V6.pos.y; H6.pos.z = V6.pos.z; H7.pos.x = V7.pos.x; H7.pos.y = V7.pos.y; H7.pos.z = V7.pos.z; }
  if (cell == 8) { H0.pos.x = V8.pos.x; H0.pos.y = V8.pos.y; H0.pos.z = V8.pos.z; H1.pos.x = V9.pos.x; H1.pos.y = V9.pos.y; H1.pos.z = V9.pos.z; H2.pos.x = V10.pos.x; H2.pos.y = V10.pos.y; H2.pos.z = V10.pos.z; H3.pos.x = V11.pos.x; H3.pos.y = V11.pos.y; H3.pos.z = V11.pos.z; H4.pos.x = V12.pos.x; H4.pos.y = V12.pos.y; H4.pos.z = V12.pos.z; H5.pos.x = V13.pos.x; H5.pos.y = V13.pos.y; H5.pos.z = V13.pos.z; H6.pos.x = V14.pos.x; H6.pos.y = V14.pos.y; H6.pos.z = V14.pos.z; H7.pos.x = V15.pos.x; H7.pos.y = V15.pos.y; H7.pos.z = V15.pos.z; }
  if (cell == 0) { H0.pos.x = 0; H0.pos.y = 0; H0.pos.z = 0; H1.pos.x = 0; H1.pos.y = 0; H1.pos.z = 0; H2.pos.x = 0; H2.pos.y = 0; H2.pos.z = 0; H3.pos.x = 0; H3.pos.y = 0; H3.pos.z = 0; H4.pos.x = 0; H4.pos.y = 0; H4.pos.z = 0; H5.pos.x = 0; H5.pos.y = 0; H5.pos.z = 0; H6.pos.x = 0; H6.pos.y = 0; H6.pos.z = 0; H7.pos.x = 0; H7.pos.y = 0; H7.pos.z = 0; }

  info = "**Гиперкуб** — n-мерный аналог куба; его вершины — все наборы из n нулей и единиц. Четырёхмерный гиперкуб (тессеракт) имеет 16 вершин, 32 ребра, 24 квадратные грани и 8 трёхмерных кубов-граней. Ребро соединяет вершины, отличающиеся одной координатой; расстояние между вершинами по рёбрам — число различающихся координат.\n\nНа экране — перспективная проекция из 4D в 3D, как тень куба на плоскости: синие рёбра идут вдоль x, y, z, оранжевые — вдоль четвёртой оси w. Поворот в плоскостях xw и yw выворачивает «внутренний» куб наружу: все 8 кубов-граней равноправны, хотя в проекции одни кажутся больше других.";
  if (cell > 0) { info = info + " Зелёным выделен один из 8 кубов-граней."; }
  info = info + "\n\nСцену можно вращать мышью.";
}
]
