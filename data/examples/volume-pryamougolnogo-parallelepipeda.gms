[
description = "{info}"

field width = 10; field height = 8; field depth = 10;
show grid = false; show axes = false;
camera start rot = (-35, 62);
camera start zoom = 1.35;

// Параллелепипед a×b×c (вдоль x, z, y) и единичные кубы: зелёные точки — центры кубов, помещающихся целиком.
new Point3D { name = "V0"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "V1"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "V2"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "V3"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "V4"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "V5"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "V6"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "V7"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5 }
new Point3D { name = "q000"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 0 < floor(b) && 0 < floor(c) }
new Point3D { name = "q001"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 0 < floor(b) && 1 < floor(c) }
new Point3D { name = "q002"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 0 < floor(b) && 2 < floor(c) }
new Point3D { name = "q003"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 0 < floor(b) && 3 < floor(c) }
new Point3D { name = "q010"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 1 < floor(b) && 0 < floor(c) }
new Point3D { name = "q011"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 1 < floor(b) && 1 < floor(c) }
new Point3D { name = "q012"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 1 < floor(b) && 2 < floor(c) }
new Point3D { name = "q013"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 1 < floor(b) && 3 < floor(c) }
new Point3D { name = "q020"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 2 < floor(b) && 0 < floor(c) }
new Point3D { name = "q021"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 2 < floor(b) && 1 < floor(c) }
new Point3D { name = "q022"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 2 < floor(b) && 2 < floor(c) }
new Point3D { name = "q023"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 2 < floor(b) && 3 < floor(c) }
new Point3D { name = "q030"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 3 < floor(b) && 0 < floor(c) }
new Point3D { name = "q031"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 3 < floor(b) && 1 < floor(c) }
new Point3D { name = "q032"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 3 < floor(b) && 2 < floor(c) }
new Point3D { name = "q033"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 0 < floor(a) && 3 < floor(b) && 3 < floor(c) }
new Point3D { name = "q100"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 0 < floor(b) && 0 < floor(c) }
new Point3D { name = "q101"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 0 < floor(b) && 1 < floor(c) }
new Point3D { name = "q102"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 0 < floor(b) && 2 < floor(c) }
new Point3D { name = "q103"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 0 < floor(b) && 3 < floor(c) }
new Point3D { name = "q110"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 1 < floor(b) && 0 < floor(c) }
new Point3D { name = "q111"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 1 < floor(b) && 1 < floor(c) }
new Point3D { name = "q112"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 1 < floor(b) && 2 < floor(c) }
new Point3D { name = "q113"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 1 < floor(b) && 3 < floor(c) }
new Point3D { name = "q120"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 2 < floor(b) && 0 < floor(c) }
new Point3D { name = "q121"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 2 < floor(b) && 1 < floor(c) }
new Point3D { name = "q122"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 2 < floor(b) && 2 < floor(c) }
new Point3D { name = "q123"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 2 < floor(b) && 3 < floor(c) }
new Point3D { name = "q130"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 3 < floor(b) && 0 < floor(c) }
new Point3D { name = "q131"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 3 < floor(b) && 1 < floor(c) }
new Point3D { name = "q132"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 3 < floor(b) && 2 < floor(c) }
new Point3D { name = "q133"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 1 < floor(a) && 3 < floor(b) && 3 < floor(c) }
new Point3D { name = "q200"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 0 < floor(b) && 0 < floor(c) }
new Point3D { name = "q201"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 0 < floor(b) && 1 < floor(c) }
new Point3D { name = "q202"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 0 < floor(b) && 2 < floor(c) }
new Point3D { name = "q203"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 0 < floor(b) && 3 < floor(c) }
new Point3D { name = "q210"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 1 < floor(b) && 0 < floor(c) }
new Point3D { name = "q211"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 1 < floor(b) && 1 < floor(c) }
new Point3D { name = "q212"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 1 < floor(b) && 2 < floor(c) }
new Point3D { name = "q213"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 1 < floor(b) && 3 < floor(c) }
new Point3D { name = "q220"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 2 < floor(b) && 0 < floor(c) }
new Point3D { name = "q221"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 2 < floor(b) && 1 < floor(c) }
new Point3D { name = "q222"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 2 < floor(b) && 2 < floor(c) }
new Point3D { name = "q223"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 2 < floor(b) && 3 < floor(c) }
new Point3D { name = "q230"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 3 < floor(b) && 0 < floor(c) }
new Point3D { name = "q231"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 3 < floor(b) && 1 < floor(c) }
new Point3D { name = "q232"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 3 < floor(b) && 2 < floor(c) }
new Point3D { name = "q233"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 2 < floor(a) && 3 < floor(b) && 3 < floor(c) }
new Point3D { name = "q300"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 0 < floor(b) && 0 < floor(c) }
new Point3D { name = "q301"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 0 < floor(b) && 1 < floor(c) }
new Point3D { name = "q302"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 0 < floor(b) && 2 < floor(c) }
new Point3D { name = "q303"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 0 < floor(b) && 3 < floor(c) }
new Point3D { name = "q310"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 1 < floor(b) && 0 < floor(c) }
new Point3D { name = "q311"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 1 < floor(b) && 1 < floor(c) }
new Point3D { name = "q312"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 1 < floor(b) && 2 < floor(c) }
new Point3D { name = "q313"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 1 < floor(b) && 3 < floor(c) }
new Point3D { name = "q320"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 2 < floor(b) && 0 < floor(c) }
new Point3D { name = "q321"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 2 < floor(b) && 1 < floor(c) }
new Point3D { name = "q322"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 2 < floor(b) && 2 < floor(c) }
new Point3D { name = "q323"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 2 < floor(b) && 3 < floor(c) }
new Point3D { name = "q330"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 3 < floor(b) && 0 < floor(c) }
new Point3D { name = "q331"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 3 < floor(b) && 1 < floor(c) }
new Point3D { name = "q332"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 3 < floor(b) && 2 < floor(c) }
new Point3D { name = "q333"; pos = (0, 0, 0); dynamic = false; collision = false; size = 0.5; color = #22c55e; active = 3 < floor(a) && 3 < floor(b) && 3 < floor(c) }
new Line3D { name = "e0_1"; pos = (V0, V1); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e0_2"; pos = (V0, V2); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e0_4"; pos = (V0, V4); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e1_3"; pos = (V1, V3); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e1_5"; pos = (V1, V5); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e2_3"; pos = (V2, V3); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e2_6"; pos = (V2, V6); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e3_7"; pos = (V3, V7); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e4_5"; pos = (V4, V5); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e4_6"; pos = (V4, V6); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e5_7"; pos = (V5, V7); interact = false; thickness = 3; color = #3b82f6 }
new Line3D { name = "e6_7"; pos = (V6, V7); interact = false; thickness = 3; color = #3b82f6 }

new UI { type = slider; label = "a (вдоль x)"; variable = a; min = 1; max = 4; step = 0.5; default = 3 }
new UI { type = slider; label = "b (вдоль z)"; variable = b; min = 1; max = 4; step = 0.5; default = 2 }
new UI { type = slider; label = "c (высота)"; variable = c; min = 1; max = 4; step = 0.5; default = 2.5 }

string info = "";
float a = 3; float b = 2; float c = 2.5;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  V0.pos.x = -2 + 0 * a; V0.pos.y = -2 + 0 * c; V0.pos.z = -2 + 0 * b;
  V1.pos.x = -2 + 1 * a; V1.pos.y = -2 + 0 * c; V1.pos.z = -2 + 0 * b;
  V2.pos.x = -2 + 0 * a; V2.pos.y = -2 + 1 * c; V2.pos.z = -2 + 0 * b;
  V3.pos.x = -2 + 1 * a; V3.pos.y = -2 + 1 * c; V3.pos.z = -2 + 0 * b;
  V4.pos.x = -2 + 0 * a; V4.pos.y = -2 + 0 * c; V4.pos.z = -2 + 1 * b;
  V5.pos.x = -2 + 1 * a; V5.pos.y = -2 + 0 * c; V5.pos.z = -2 + 1 * b;
  V6.pos.x = -2 + 0 * a; V6.pos.y = -2 + 1 * c; V6.pos.z = -2 + 1 * b;
  V7.pos.x = -2 + 1 * a; V7.pos.y = -2 + 1 * c; V7.pos.z = -2 + 1 * b;
  q000.pos.x = -1.5; q000.pos.y = -1.5; q000.pos.z = -1.5;
  q001.pos.x = -1.5; q001.pos.y = -0.5; q001.pos.z = -1.5;
  q002.pos.x = -1.5; q002.pos.y = 0.5; q002.pos.z = -1.5;
  q003.pos.x = -1.5; q003.pos.y = 1.5; q003.pos.z = -1.5;
  q010.pos.x = -1.5; q010.pos.y = -1.5; q010.pos.z = -0.5;
  q011.pos.x = -1.5; q011.pos.y = -0.5; q011.pos.z = -0.5;
  q012.pos.x = -1.5; q012.pos.y = 0.5; q012.pos.z = -0.5;
  q013.pos.x = -1.5; q013.pos.y = 1.5; q013.pos.z = -0.5;
  q020.pos.x = -1.5; q020.pos.y = -1.5; q020.pos.z = 0.5;
  q021.pos.x = -1.5; q021.pos.y = -0.5; q021.pos.z = 0.5;
  q022.pos.x = -1.5; q022.pos.y = 0.5; q022.pos.z = 0.5;
  q023.pos.x = -1.5; q023.pos.y = 1.5; q023.pos.z = 0.5;
  q030.pos.x = -1.5; q030.pos.y = -1.5; q030.pos.z = 1.5;
  q031.pos.x = -1.5; q031.pos.y = -0.5; q031.pos.z = 1.5;
  q032.pos.x = -1.5; q032.pos.y = 0.5; q032.pos.z = 1.5;
  q033.pos.x = -1.5; q033.pos.y = 1.5; q033.pos.z = 1.5;
  q100.pos.x = -0.5; q100.pos.y = -1.5; q100.pos.z = -1.5;
  q101.pos.x = -0.5; q101.pos.y = -0.5; q101.pos.z = -1.5;
  q102.pos.x = -0.5; q102.pos.y = 0.5; q102.pos.z = -1.5;
  q103.pos.x = -0.5; q103.pos.y = 1.5; q103.pos.z = -1.5;
  q110.pos.x = -0.5; q110.pos.y = -1.5; q110.pos.z = -0.5;
  q111.pos.x = -0.5; q111.pos.y = -0.5; q111.pos.z = -0.5;
  q112.pos.x = -0.5; q112.pos.y = 0.5; q112.pos.z = -0.5;
  q113.pos.x = -0.5; q113.pos.y = 1.5; q113.pos.z = -0.5;
  q120.pos.x = -0.5; q120.pos.y = -1.5; q120.pos.z = 0.5;
  q121.pos.x = -0.5; q121.pos.y = -0.5; q121.pos.z = 0.5;
  q122.pos.x = -0.5; q122.pos.y = 0.5; q122.pos.z = 0.5;
  q123.pos.x = -0.5; q123.pos.y = 1.5; q123.pos.z = 0.5;
  q130.pos.x = -0.5; q130.pos.y = -1.5; q130.pos.z = 1.5;
  q131.pos.x = -0.5; q131.pos.y = -0.5; q131.pos.z = 1.5;
  q132.pos.x = -0.5; q132.pos.y = 0.5; q132.pos.z = 1.5;
  q133.pos.x = -0.5; q133.pos.y = 1.5; q133.pos.z = 1.5;
  q200.pos.x = 0.5; q200.pos.y = -1.5; q200.pos.z = -1.5;
  q201.pos.x = 0.5; q201.pos.y = -0.5; q201.pos.z = -1.5;
  q202.pos.x = 0.5; q202.pos.y = 0.5; q202.pos.z = -1.5;
  q203.pos.x = 0.5; q203.pos.y = 1.5; q203.pos.z = -1.5;
  q210.pos.x = 0.5; q210.pos.y = -1.5; q210.pos.z = -0.5;
  q211.pos.x = 0.5; q211.pos.y = -0.5; q211.pos.z = -0.5;
  q212.pos.x = 0.5; q212.pos.y = 0.5; q212.pos.z = -0.5;
  q213.pos.x = 0.5; q213.pos.y = 1.5; q213.pos.z = -0.5;
  q220.pos.x = 0.5; q220.pos.y = -1.5; q220.pos.z = 0.5;
  q221.pos.x = 0.5; q221.pos.y = -0.5; q221.pos.z = 0.5;
  q222.pos.x = 0.5; q222.pos.y = 0.5; q222.pos.z = 0.5;
  q223.pos.x = 0.5; q223.pos.y = 1.5; q223.pos.z = 0.5;
  q230.pos.x = 0.5; q230.pos.y = -1.5; q230.pos.z = 1.5;
  q231.pos.x = 0.5; q231.pos.y = -0.5; q231.pos.z = 1.5;
  q232.pos.x = 0.5; q232.pos.y = 0.5; q232.pos.z = 1.5;
  q233.pos.x = 0.5; q233.pos.y = 1.5; q233.pos.z = 1.5;
  q300.pos.x = 1.5; q300.pos.y = -1.5; q300.pos.z = -1.5;
  q301.pos.x = 1.5; q301.pos.y = -0.5; q301.pos.z = -1.5;
  q302.pos.x = 1.5; q302.pos.y = 0.5; q302.pos.z = -1.5;
  q303.pos.x = 1.5; q303.pos.y = 1.5; q303.pos.z = -1.5;
  q310.pos.x = 1.5; q310.pos.y = -1.5; q310.pos.z = -0.5;
  q311.pos.x = 1.5; q311.pos.y = -0.5; q311.pos.z = -0.5;
  q312.pos.x = 1.5; q312.pos.y = 0.5; q312.pos.z = -0.5;
  q313.pos.x = 1.5; q313.pos.y = 1.5; q313.pos.z = -0.5;
  q320.pos.x = 1.5; q320.pos.y = -1.5; q320.pos.z = 0.5;
  q321.pos.x = 1.5; q321.pos.y = -0.5; q321.pos.z = 0.5;
  q322.pos.x = 1.5; q322.pos.y = 0.5; q322.pos.z = 0.5;
  q323.pos.x = 1.5; q323.pos.y = 1.5; q323.pos.z = 0.5;
  q330.pos.x = 1.5; q330.pos.y = -1.5; q330.pos.z = 1.5;
  q331.pos.x = 1.5; q331.pos.y = -0.5; q331.pos.z = 1.5;
  q332.pos.x = 1.5; q332.pos.y = 0.5; q332.pos.z = 1.5;
  q333.pos.x = 1.5; q333.pos.y = 1.5; q333.pos.z = 1.5;
  float fa = floor(a); float fb = floor(b); float fc = floor(c);
  info = "**Объём прямоугольного параллелепипеда** с рёбрами a = " + format(a, 1) + ", b = " + format(b, 1) + ", c = " + format(c, 1) + " (три взаимно перпендикулярных ребра из одной вершины): **V = abc = " + format(a * b * c, 3) + "**. Через площадь основания S = ab = " + format(a * b, 2) + ": V = S·c.\n\n";
  if (fa == a && fb == b && fc == c) {
    info = info + "Рёбра целые: параллелепипед разбивается на N = " + format(a, 0) + "·" + format(b, 0) + "·" + format(c, 0) + " = **" + format(fa * fb * fc, 0) + "** единичных кубов без остатка и наложений. По аддитивности его объём равен сумме объёмов кубов: V = N.";
  } else {
    info = info + "Рёбра не целые: целиком помещаются ⌊a⌋·⌊b⌋·⌊c⌋ = " + format(fa, 0) + "·" + format(fb, 0) + "·" + format(fc, 0) + " = **" + format(fa * fb * fc, 0) + "** единичных кубов, остаётся «пристенный» слой. Значит, " + format(fa * fb * fc, 0) + " ≤ V ≤ ⌈a⌉·⌈b⌉·⌈c⌉ = " + format(ceil(a) * ceil(b) * ceil(c), 0) + ". Переход к всё более мелким кубам сближает границы и приводит к тому же V = abc.";
  }
}
]
