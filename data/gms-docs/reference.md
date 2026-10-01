# Язык GMS — полный справочник

GMS — язык интерактивных математических сцен MathFrame. Программа описывает объекты
(точки, отрезки, графики, тела), элементы управления (ползунки, кнопки) и логику
(`Start`, `Update`, функции). Компилятор превращает её в самостоятельную HTML-страницу
со сценой в 2D или 3D.

Блоки с кнопкой **«Открыть в редакторе»** — законченные программы: их можно сразу
запустить в песочнице и менять.

## Быстрый старт

```gms
[
description = "Перетащите точки A и B. Длина отрезка: **{len}**"

new Point { name = "A"; pos = (-4, -2); text = true("A") }
new Point { name = "B"; pos = (3, 2); text = true("B") }
new Line  { name = "ab"; pos = (A, B) }

string len = "";
Update { len = format(ab.length, 2); }

show axes = true;
show grid = true;
]
```

Что здесь происходит:

1. Весь код — внутри квадратных скобок `[ … ]`.
2. `description` — текст под сценой; `{len}` подставляет значение переменной.
3. `new Point`, `new Line` — объекты сцены; на них ссылаются по `name`.
4. `Update { … }` выполняется каждый кадр и пересчитывает переменную.
5. `show axes`, `show grid` — параметры сцены.

## Синтаксис

- Программа — один блок `[ … ]`. Всё, что вне скобок, игнорируется.
- Комментарии: `// до конца строки` и `/* многострочный */`.
- Объект: `new Тип { поле = значение; поле = значение }` или `draw Тип { … }`.
  Поля разделяются **точкой с запятой**; после последнего она не обязательна.
- Строки — в двойных кавычках: `name = "A"`. Имя объекта можно писать и без кавычек.
- Координаты — `(x, y)` в 2D, `(x, y, z)` в 3D.
- Ссылка на объект — его имя: `pos = (A, B)`. Вместо имени точки можно писать
  координаты `(x, y)` — будет создана скрытая точка.
- Цвет — `#rrggbb` без кавычек.
- Логические значения — `true` / `false`.
- Параметры сцены — отдельные строки `ключ = значение;` вне фигурных скобок.
- Большинство числовых полей принимает выражение с переменными: `radius = r * 2`.
- Поле `active = <выражение>` пересчитывается каждый кадр: `active = n > 1`.

### Цвета и оформление

Не задавайте `color`, `thickness`, `size` без нужды: значения по умолчанию сами
подстраиваются под тёмную и светлую тему. Явный цвет перестаёт подстраиваться. Если
выделить объект всё же нужно — берите цвета, контрастные на обоих фонах:
синий `#3b82f6`, оранжевый `#f59e0b`, зелёный `#22c55e`, красный `#ef4444`,
фиолетовый `#a855f7`.

### 2D и 3D

Сцена становится трёхмерной, если в ней есть 3D-объекты (`Point3D`, `Line3D`,
`Primitive`, `draw Surface` с `mode = 3d` и т. д.). Типы `Point`, `Line`, `Figure`,
`Claster`, `Vector`, `Text`, `Curve`, `Field`, `Trajectory`, `Filling`, `Surface`
существуют в вариантах с суффиксом `2D`/`3D`; без суффикса измерение определяется по
ссылкам и полям объекта.

## Параметры сцены

| Параметр | Значение | Смысл |
|---|---|---|
| `description` | строка | текст под сценой (Markdown, `{переменная}`) |
| `description align` | `left` / `center` / `right` | выравнивание описания |
| `description size`, `description color` | число / цвет | размер и цвет описания |
| `field width`, `field height` | число | размер поля в единицах координат (по умолчанию ≈ 20×12) |
| `field depth` | число | глубина поля (3D) |
| `field color` | цвет | фон поля |
| `frame color`, `frame width` | цвет / число | рамка поля |
| `theme` | `dark` / `light` | тема по умолчанию |
| `show axes` | `true` / `false` | оси координат |
| `show axis x`, `show axis y`, `show axis z` | `true` / `false` | отдельные оси |
| `axes size`, `axes color` | число / цвет | оформление осей |
| `show grid` | `true` / `false` | сетка |
| `show grid x`, `show grid y`, `show grid z` | `true` / `false` | отдельные плоскости сетки |
| `grid size`, `grid color` | число / цвет | шаг и цвет сетки |
| `grid adaptive` | `true` / `false` | сетка подстраивается под масштаб |
| `show boundary`, `boundary color` | `true` / `false` / цвет | граница поля |
| `snap`, `snap grid`, `snap distance` | `true` / число | привязка точек к сетке |
| `camera type` | `fixed` / `pan` / `orbit` | поведение камеры: неподвижная, сдвиг, вращение |
| `can rotate camera`, `can zoom camera` | `true` / `false` | разрешить вращение / масштаб |
| `camera start zoom` | число | начальный масштаб |
| `camera start rot` | `(азимут, полярный угол)` | начальный поворот камеры (3D, градусы) |
| `camera start offset` | `(x, y)` | начальный сдвиг камеры |
| `camera zoom limits`, `zoom limits` | `(min, max)` | пределы масштаба |
| `camera projection` | `perspective` / `orthographic` | проекция (3D) |
| `camera fov`, `camera near`, `camera far` | число | параметры камеры (3D) |
| `2D layer` | — | слой 2D-элементов поверх 3D-сцены |
| `steps animation`, `steps duration` | `true` / число | анимация переходов между шагами |

```gms
[
description = "Поле 16×10, неподвижная камера, без сетки"
field width = 16;
field height = 10;
camera type = fixed;
show axes = true;
show grid = false;
new Point { name = "P"; pos = (2, 1); text = true("P") }
]
```

## Переменные и типы

Переменные объявляются на верхнем уровне или внутри `Start` / `Update`:

| Тип | Пример |
|---|---|
| `float` | `float a = 2.5;` |
| `int` | `int n = 3;` |
| `bool` | `bool on = true;` |
| `string` | `string info = "";` |
| `Vector2` | `Vector2 v = (1, 2);` — поля `v.x`, `v.y` |
| `color` | `color c = #3b82f6;` |
| `list` | `list L = [1, 2, 3];` — только числа, литерал не пустой |

Правила области видимости:

- Объявления верхнего уровня и верхнего уровня `Start`/`Update` — глобальные.
- Объявления внутри `Function`, тел `if`, `repeat`, `while`, `for` — локальные.
- Присваивание без объявления (`a = 5;`) пишет в существующую переменную.
- `set a = 5;` — то же присваивание (старая форма).

## Выражения и операторы

| Оператор | Смысл |
|---|---|
| `+ - * /` | арифметика; `+` со строкой — склейка |
| `^` | степень: `2^3 = 8` |
| `%` | остаток, всегда неотрицательный: `-1 % 3 = 2` |
| `== != < <= > >=` | сравнения |
| `&& \|\| !` | логика |
| `условие ? a : b` | тернарный оператор |
| `a += b`, `-=`, `*=`, `/=` | составное присваивание |
| `L[i]` | элемент списка (с нуля) |
| `obj.поле` | поле объекта или вектора |

Константы: `pi` (`PI`), `tau` = 2π, `E`, `i` (мнимая единица), `infinity`.

`++` и `--` **не поддерживаются** — пишите `n += 1`. Классического `for (i = 0; …)`
тоже нет — используйте `repeat` или `while`.

```gms
[
description = "{info}"
string info = "";
Update {
  info = "7 % 3 = " + (7 % 3) + ", 2^10 = " + (2^10) + ", 5 > 3 ? → " + (5 > 3 ? "да" : "нет") + ", π ≈ " + format(pi, 4);
}
]
```

## Функции

Однострочная функция:

```gms-snippet
func f(x) = x^2 - 2*x;
```

Многострочная функция с возвратом значения — `Function`, процедура без значения —
`Void`:

```gms
[
description = "{info}"
string info = "";
float count = 0;

Function hyp(a, b) {
  float c = sqrt(a*a + b*b);
  return c;
}
Void tick() { count += 1; }

Start { tick(); tick(); }
Update { info = "hyp(3, 4) = " + hyp(3, 4) + "; tick вызван " + count + " раза"; }
]
```

Функцию можно передать по имени в объекты: `draw Function { f = "f" }`,
`solve("f", 1)`, `integral("f", 0, 1)`.

## Start, Update и управляющие конструкции

- `Start { … }` — выполняется один раз при запуске.
- `Update { … }` — выполняется каждый кадр.
- `action = "…"` у кнопки — тот же язык, выполняется по нажатию.

| Конструкция | Пример |
|---|---|
| условие | `if (a < 3) { … } else if (a < 7) { … } else { … }` |
| повтор N раз | `repeat (n) { … i … }` — счётчик `i` от 0 до n−1 |
| цикл с условием | `while (k < 10) { k += 1; }` |
| перебор списка | `for (x in L) { s += x; }` |
| пауза | `wait(0.5);` — секунды |
| возврат | `return значение;` |

```gms
[
description = "{info}"
string info = "";
list L = [3, 1, 4, 1, 5];
Update {
  float s = 0;
  for (x in L) { s += x; }
  float sq = 0;
  repeat (5) { sq += i * i; }
  int k = 1;
  while (k < 100) { k *= 2; }
  info = "Сумма списка: " + s + "; 0²+…+4² = " + sq + "; первая степень двойки ≥ 100: " + k;
}
]
```

### Производительность

`Update` работает 60 раз в секунду. Тяжёлые вычисления (ряды, таблицы, интегралы)
выполняйте только при изменении входных данных — храните «ключ» из параметров и
сравнивайте с прошлым. Не присваивайте координаты точек без необходимости: любое
присваивание заставляет сцену перерисоваться.

## Доступ к объектам из кода

| Выражение | Значение |
|---|---|
| `A.pos.x`, `A.pos.y`, `A.pos.z` | координаты точки (присваивание двигает точку) |
| `X.t` | параметр точки на линии / кривой / графике (0…1) |
| `ab.length` | длина отрезка |
| `ang.measure` | величина угла в градусах |
| `cl.active` | видимость кластера (можно присваивать) |
| `fieldMaxX`, `fieldMaxY` | граница поля для центров точек |

### Ввод мыши и клавиатуры

| Переменная / функция | Значение |
|---|---|
| `mouseX`, `mouseY` | положение курсора в координатах поля |
| `mouseDown` | нажата ли кнопка мыши |
| `mouseClickX`, `mouseClickY`, `mouseClickCount` | последний клик и число кликов |
| `touchX`, `touchY`, `touchActive`, `touchCount` | касания |
| `lastKey`, `keyPressCount`, `isKeyDown("a")` | клавиатура |
| `deviceType` | `"mobile"` или `"desktop"` |

Обработка клика: запомните `mouseClickCount` и сравнивайте в `Update`.

```gms
[
description = "Кликните по полю — точка переместится. Кликов: {n}"
new Point { name = "P"; pos = (0, 0); text = true("P") }
float seen = 0;
string n = "0";
Update {
  if (mouseClickCount != seen) {
    seen = mouseClickCount;
    P.pos.x = mouseClickX; P.pos.y = mouseClickY;
    n = "" + seen;
  }
}
show grid = true;
]
```

## Описание под сценой

`description = "…"` поддерживает:

- `{имя}` — подстановку переменной (обновляется на лету);
- `**жирный**`, `*курсив*`;
- `\n\n` — новый абзац;
- формулы `$…$` (KaTeX).

Удобный приём: `description = "{info}"`, а строку `info` собирать в `Update`.

## Анимация

`animate("переменная", цель, секунды, easing, задержка, режим)` плавно меняет
переменную. `easing`: `"linear"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`; режим:
`"once"`, `"loop"`, `"pingpong"`. Также: `stopAnimation("a")`, `isAnimating("a")`,
`animationProgress("a")`.

```gms
[
description = "Точка ездит по оси x"
float x = -6;
new Point { name = "P"; pos = (x, 0); dynamic = false; text = true("P") }
Start { animate("x", 6, 3, "easeInOut", 0, "pingpong"); }
Update { P.pos.x = x; }
show axes = true;
]
```

## Элементы управления — `new UI`

| Поле | Смысл |
|---|---|
| `type` | `slider`, `button`, `toggle`, `input`, `select` (без кавычек) |
| `name` | имя (нужно для кластеров) |
| `label` | подпись |
| `variable` | переменная, с которой связан элемент |
| `default` | начальное значение |
| `min`, `max`, `step` | для `slider` и числового `input`; `max` может быть выражением |
| `action` | код кнопки в кавычках: `action = "a = 1; b = 2"` |
| `inputtype` | у `input`: `text`, `number`, `formula` |
| `options`, `labels` | варианты `select` и их подписи: `options = ("a", "b")` |
| `funcName` | функция, вызываемая при изменении |
| `x`, `y`, `width`, `height`, `radius` | ручное размещение и скругление |
| `stepper` | стрелки у числового поля (`true`) |
| `active`, `layer`, `color`, `textcolor` | видимость, слой, цвета |

При `inputtype = formula` переменная становится функцией: введя `x^2`, можно вызвать
`expr(3)` или нарисовать `draw Function { f = "expr" }`.

```gms
[
description = "k = {k}, режим: {mode}, флажок: {on}"
float k = 1; bool on = false; string mode = "sin";
func f(x) = mode == "sin" ? k * sin(x) : k * cos(x);
draw Function { name = "gr"; f = "f"; xmin = -8; xmax = 8 }
new UI { name = "s"; type = slider; label = "k"; variable = k; min = 0; max = 3; step = 0.1 }
new UI { name = "sel"; type = select; label = "функция"; variable = mode; options = ("sin", "cos"); labels = ("синус", "косинус") }
new UI { name = "tg"; type = toggle; label = "флажок"; variable = on }
new UI { name = "b"; type = button; label = "сброс"; action = "k = 1" }
show axes = true; show grid = true;
]
```

## Кластеры и вкладки — `new Claster`

Кластер — именованная группа объектов, которую показывают и скрывают целиком.

| Поле | Смысл |
|---|---|
| `elements` | список имён: `(A, B, ab)` |
| `active` | показан ли кластер |
| `interact` | реагируют ли объекты на мышь |
| `rotate` | поворот группы |
| `step` | номер шага пошагового доказательства (управляется страницей темы) |

Вкладки: каждая вкладка — свой кластер, кнопки переключают `active`.

```gms
[
description = "Вкладка {tab}"
float tab = 1;
new Point { name = "A"; pos = (-3, 0); text = true("A") }
new Point { name = "B"; pos = (3, 0); text = true("B") }
new Line { name = "ab"; pos = (A, B) }
new Circle { name = "c"; center = A; radius = 3 }
new Claster { name = "t1"; elements = (B, ab); active = true }
new Claster { name = "t2"; elements = (c); active = false }
new UI { name = "b1"; type = button; label = "Отрезок"; action = "tab = 1; t1.active = true; t2.active = false" }
new UI { name = "b2"; type = button; label = "Окружность"; action = "tab = 2; t1.active = false; t2.active = true" }
]
```

## Объекты 2D

### Точка — `new Point`

| Поле | По умолчанию | Смысл |
|---|---|---|
| `name` | — | имя, обязательно |
| `pos` | `(0, 0)` | координаты; вычисляется один раз |
| `dynamic` | `true` | можно ли перетаскивать |
| `text` | — | подпись: `text = true("A")` |
| `textDir` | — | направление подписи: `(1, -1)` — справа снизу |
| `size`, `textSize` | `1` | размер точки и подписи |
| `shape` | — | форма маркера |
| `pauseOnDrag` | `true` | приостанавливать анимации при перетаскивании |
| `active`, `layer` | `true`, `40` | видимость и слой |
| `color`, `textColor` | тема | цвета |

Точка на объекте (движется только по нему; параметр `t` от 0 до 1):

| Поля | Где лежит точка |
|---|---|
| `line = "ab"; t = 0.3; extend = true` | на отрезке (`extend` — на всей прямой) |
| `circle = "w"; t = 0.25` | на окружности |
| `ellipse = "e"`, `arc = "d"`, `curve = "c"` | на эллипсе, дуге, кривой |
| `graph = "gr"; t = 0.5` | на графике `draw Function` |
| `plane = "p"; u = 1; v = 2` / `figure = "F"` | на плоскости или грани (3D) |

Вычисляемые точки (пересчитываются каждый кадр):

| Поля | Построение |
|---|---|
| `construct = median; vertex = A; base = "bc"` | основание медианы (`bisector`, `altitude` — биссектрисы, высоты) |
| `reflect = A; over = O` | отражение относительно точки / прямой |
| `rotate = A; around = O; angle = 90` | поворот (градусы; в 3D — ещё `axis = (x, y, z)`) |
| `homothety = A; center = O; ratio = 2` | гомотетия (`ratioY`, `ratioZ` — растяжения) |
| `translate = A; dx = 1; dy = 2` | параллельный перенос (`dz` в 3D) |

Столкновения: `collision`, `collisionGroup`, `collisionMask`, `collisionMargin`,
`collideWithPoints`, `collideWithLines`, `collideWithCircles`, `collideWithCurves`,
`collideWithEllipses`, `collideWithArcs`, `collideWithFigures`, `collideWithClusters`,
`collideWithBoundary`.

```gms
[
description = "M — середина AB (гомотетия с коэффициентом 0,5), A' — отражение A относительно O, X — точка на отрезке"
new Point { name = "A"; pos = (-5, -2); text = true("A") }
new Point { name = "B"; pos = (4, 3); text = true("B") }
new Point { name = "O"; pos = (0, -3); text = true("O") }
new Line { name = "ab"; pos = (A, B) }
new Point { name = "M"; homothety = B; center = A; ratio = 0.5; text = true("M") }
new Point { name = "A2"; reflect = A; over = O; text = true("A'") }
new Point { name = "X"; line = "ab"; t = 0.2; text = true("X") }
show grid = true;
]
```

### Отрезок — `new Line`

| Поле | По умолчанию | Смысл |
|---|---|---|
| `pos` | — | две точки: `(A, B)` |
| `thickness` | `2.5` | толщина |
| `interact` | `true` | можно ли тащить отрезок целиком |
| `active`, `layer`, `color` | `true`, `10`, тема | |

Отрезок можно построить преобразованием другого: `reflect`/`rotate`/`homothety`/`translate`
с теми же полями, что у точки. Из кода: `ab.length`.

### Многоугольник — `new Figure`

`elements = (ab, bc, ca)` — отрезки, образующие фигуру. Поля: `size`, `sizeX`, `sizeY`,
`rotate`, `flipX`, `flipY`, `interact` (тащить фигуру целиком), `active`.

### Угол — `new Angle` + `draw Angle`

```gms
[
description = "Угол AOB = {m}°"
new Point { name = "O"; pos = (0, 0); text = true("O") }
new Point { name = "A"; pos = (5, 0); text = true("A") }
new Point { name = "B"; pos = (2, 4); text = true("B") }
new Line { name = "oa"; pos = (O, A) }
new Line { name = "ob"; pos = (O, B) }
new Angle { name = "aob"; lines = (oa, ob) }
draw Angle { name = "daob"; angle = "aob"; count = 1 }
string m = "";
Update { m = format(aob.measure, 1); }
]
```

`new Angle`: `lines = (l1, l2)`, `lock` — зафиксировать величину.
`draw Angle`: `angle = "имя"`, `count` (число дуг), `arc`, `measure`, `fractions`,
`radius`, `side`, `arccolor`, `measurecolor`, `layer`.

### Окружность, дуга, эллипс

| Объект | Поля |
|---|---|
| `new Circle` | `center = O; radius = 3` (число, выражение или точка на окружности) или `points = (A, B, C)`; `thickness`, `color`, `active`, `layer` |
| `draw Arc` | `center`, `from`, `to` (точки) или `points = (A, B, C)`; `radius`, `thickness`, `color` |
| `new Ellipse` | `center; a; b; rotate` или `focus1; focus2; points`; `dynamic`, `thickness` |

### Кривая — `new Curve`

`type`: `parametric` (`x = "…t…"; y = "…"`, `z` в 3D; t ∈ [0; 1]), `bezier`
(`points = (A, B, C, D)`), `spiral` (`center`, `turns`, `a`, `b`), `cycloid`, `involute`
(`radius`, `start`). Общие: `segments`, `thickness`, `color`, `colorBy`, `showFrenet`,
`frenetCount`, `frenetScale` (репер Френе).

```gms
[
description = "Параметрическая кривая — роза"
float k = 3;
new Curve { name = "rose"; type = parametric; x = "5*cos(k*2*pi*t)*cos(2*pi*t)"; y = "5*cos(k*2*pi*t)*sin(2*pi*t)"; segments = 400 }
new UI { name = "s"; type = slider; label = "k"; variable = k; min = 1; max = 7; step = 1 }
show axes = true;
]
```

### Пометки на чертеже

| Объект | Поля | Что рисует |
|---|---|---|
| `draw Vector` | `edge = "ab"`, `length`, `thickness` | стрелку на отрезке |
| `draw Punctir` | `edge = "ab"`, `pattern`, `thickness` | пунктир |
| `draw InfLine` | `edge = "ab"`, `dotline`, `limit` | прямую через отрезок |
| `draw EquallySing` | `edges = (ab, cd)`, `type = 1` | штрихи равенства; группы нумеруются с 1 |
| `draw Filling` | `figure = "F"` / `line` + `side` / `circle` / `shape = sector` + `arc`; `opacity` | заливку фигуры, полуплоскости, сектора, области под графиком (`bfunc`, `bfunc2`, `xmin`, `xmax`) |
| `draw Text` | `pos`, `text` (выражение), `size`, `align = left/right` | текст на поле |
| `draw Formula` | `pos`, `latex = "…"`, `size`, `display`, `background` | формулу LaTeX |
| `draw Image` | `src`, `pos`, `width`, `height`, `rotate`, `opacity` | картинку |

```gms
[
description = "Векторы и равные отрезки"
new Point { name = "A"; pos = (-5, -2); text = true("A") }
new Point { name = "B"; pos = (0, 3); text = true("B") }
new Point { name = "C"; pos = (5, -2); text = true("C") }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ac"; pos = (A, C) }
draw EquallySing { name = "eq"; edges = (ab, bc); type = 1 }
draw Vector { name = "v"; edge = "ac" }
draw Text { name = "t"; pos = (0, -3.5); text = "AB = " + format(ab.length, 2) }
]
```

### Слои

`layer` задаёт порядок отрисовки: больше — выше. По умолчанию: `draw Angle` 5,
`Line` 10, `Circle`/`Function` 20, `Filling` 30, `Point` 40, `draw Text` 45,
`Punctir` 60, `Vector` 70, `EquallySing` 80, `UI` 100.

## Графики и визуализации

### График функции — `draw Function`

| Поле | По умолчанию | Смысл |
|---|---|---|
| `f` | — | **имя** функции в кавычках: `f = "f"` |
| `xmin`, `xmax` | `-10`, `10` | промежуток |
| `extend` | `true`, если границы не заданы | дорисовывать до краёв видимой области |
| `segments` | `100` | точность |
| `grid`, `gridStep` | `false`, `1` | собственная сетка |
| `thickness`, `color`, `active`, `layer` | | |

```gms
[
description = "Точка P скользит по графику. P = ({px}; {py})"
float a = 1;
func f(x) = a * x^2 / 4 - 2;
draw Function { name = "gr"; f = "f" }
new Point { name = "P"; graph = "gr"; t = 0.6; text = true("P") }
new UI { name = "s"; type = slider; label = "a"; variable = a; min = -2; max = 2; step = 0.1 }
string px = ""; string py = "";
Update { px = format(P.pos.x, 2); py = format(P.pos.y, 2); }
show axes = true; show grid = true;
]
```

### Поверхности — `draw Surface`

`type`: `heightfield` (`f = "f"` от x, y), `parametric` (`x`, `y`, `z` — выражения
от `u`, `v`), `implicit`. `mode`: `contour` (линии уровня в 2D) или `3d`.
Поля: `xmin…ymax`, `umin…vmax`, `grid`, `levels`, `level`, `opacity`, `angle`, `color`.
В 3D вертикальная ось — **y**: график z = f(x, y) пишется как
`x = "u"; y = "f(u, v)"; z = "v"`.

```gms
[
description = "Поверхность z = sin(x)·cos(y)"
field width = 10; field height = 8; field depth = 10;
camera start rot = (30, 65);
func g(x, y) = sin(x) * cos(y);
draw Surface { name = "s"; type = parametric; mode = 3d; x = "u"; y = "g(u, v)"; z = "v"; umin = -4; umax = 4; vmin = -4; vmax = 4; grid = 40 }
show axes = true;
]
```

### Поля и траектории

- `draw Field { P = "…"; Q = "…"; R = "…" }` — векторное поле (выражения от x, y, z);
  `grid`, `scale`, диапазоны `xmin…zmax`. Длина стрелок нормирована.
- `draw Trajectory { system = "…"; start = (x, y); steps; dt }` — решение ОДУ
  (или `field = "имя"`, или `P`, `Q`, `R`).
- `draw TensorField` (3D): `Txx … Tyz`.

```gms
[
description = "Векторное поле (−y, x) и траектория"
draw Field { name = "fld"; P = "-y"; Q = "x"; xmin = -8; xmax = 8; ymin = -5; ymax = 5; grid = 12 }
draw Trajectory { name = "tr"; field = "fld"; start = (3, 0); steps = 400; dt = 0.02 }
show axes = true;
]
```

### Множества точек

| Объект | Поля | Что рисует |
|---|---|---|
| `draw Region` | `f = "f"`, `op` (`<`, `>`…), `f2`, `op2`, `combine = and/or`, `rangeX`, `rangeY`, `border`, `quality` | область f(x, y) < 0 и т. п. |
| `draw Locus` | `point = P`, `driver = D`, `from`, `to`, `samples`, `dashed` | ГМТ точки P при движении D |
| `draw Trace` | `point = P`, `maxPoints`, `minDist`, `fade` | след движущейся точки |

```gms
[
description = "Область x² + y² < 16 и y > x"
func g(x, y) = x*x + y*y - 16;
func h(x, y) = x - y;
draw Region { name = "r"; f = "g"; op = "<"; f2 = "h"; op2 = "<"; combine = and; rangeX = 6; rangeY = 6 }
show axes = true; show grid = true;
]
```

### Графы

`newGraph()`, `addNode(g, "ключ", [x, y], "подпись")`, `addEdge(g, a, b, вес, "#цвет")`
строят граф в коде; `draw Graph { graph = "g" }` его рисует. Поля: `directed`,
`labels`, `showWeights`, `nodeRadius` (`0` — только рёбра), `edgeWidth`,
`edgeCap = butt|square|round`, `highlight`, `highlightEdges`, `highlightColor`,
`nodeColor`, `edgeColor`, `labelColor`. Пересобирайте граф только при смене входов.

```gms
[
description = "Полный граф K{n}"
float n = 5; float built = 0;
float g = 0;
draw Graph { name = "dg"; graph = "g"; showWeights = false }
new UI { name = "s"; type = slider; label = "n"; variable = n; min = 2; max = 9; step = 1 }
Update {
  if (built != n) {
    built = n;
    g = newGraph();
    repeat (n) { addNode(g, "v" + i, [4 * cos(2*pi*i/n), 4 * sin(2*pi*i/n)], "" + (i + 1)); }
    repeat (n) { float a = i; repeat (n) { if (i > a) { addEdge(g, "v" + a, "v" + i); } } }
  }
}
]
```

### Данные и статистика

| Объект | Поля |
|---|---|
| `draw Chart` | `type = scatter/line/bar/pie/box`, `data`, `labels`, `width`, `height`, `regression`, `showValues`, `showAxes`, `markers`, `horizontal`, `innerRadius`, `startAngle`, `explode` |
| `draw Histogram` | `data`, `bins`, `width`, `height` |
| `draw Distribution` | `type = normal/binomial/poisson/exponential/uniform`, `mu`, `sigma`, `n`, `p`, `lambda`, `a`, `b`, `highlightFrom`, `highlightTo`, `filled` |
| `draw Table` | `data` (список строк), `header`, `borders`, `cellWidth`, `cellHeight`, `fontSize`, `headerBg` |
| `draw Tree` | `data`, `spacing`, `levelGap`, `nodeRadius`, `boxed` |
| `draw Scatter3D`, `draw Histogram3D` | 3D-диаграммы: `data`, `binsX`, `binsY`, `heightScale`, `colorBy` |

```gms
[
description = "Нормальное распределение, μ = {mu}, σ = {sigma}"
float mu = 0; float sigma = 1;
draw Distribution { name = "d"; type = normal; mu = mu; sigma = sigma; highlightFrom = -1; highlightTo = 1 }
new UI { name = "s1"; type = slider; label = "μ"; variable = mu; min = -3; max = 3; step = 0.1 }
new UI { name = "s2"; type = slider; label = "σ"; variable = sigma; min = 0.3; max = 3; step = 0.1 }
show axes = true;
]
```

### Динамика, фракталы и специальные объекты

| Объект | Ключевые поля |
|---|---|
| `draw Fractal` | `type = mandelbrot/julia/burningship` (2D), `mandelbulb/mengersponge/sierpinski3d` (3D); `cRe`, `cIm`, `centerRe`, `centerIm`, `scale`, `maxIter`, `palette = fire/ocean/gray/rainbow` |
| `draw Bifurcation` | `f`, `rmin`, `rmax`, `x0`, `skip`, `keep`, `box = (x1, y1, x2, y2)` |
| `draw Cobweb` | `f`, `x0`, `xmin`, `xmax`, `steps`, `showDiagonal` — лестница Ламерея |
| `draw IFS` | `maps`, `iterations`, `pointSize`, `scale` — системы итерированных функций |
| `draw Automaton` | `type = elementary/life`, `rule`, `cells`, `steps`, `init`, `generation` |
| `draw Voronoi` | `sites`, `mode = voronoi/delaunay/hull`, `filled`, `showSites` |
| `draw Fourier` | `path`, `terms`, `speed`, `showCircles` — эпициклы |
| `draw Diagram` | `nodes`, `arrows`, `accepting`, `curved`, `boxed` — диаграммы состояний |
| `draw Complex` | `f`, `mode = domain/phase/modulus`, `centerRe`, `centerIm`, `scale`, `contours` |
| `draw Hyperbolic` | `model = disk/halfplane/ball/halfspace`, `tiling`, `geodesics`, `points`, `depth` |

Объекты-«панели» (Chart, Tree, Table, Fractal и др.) в 3D-сцене размещаются полями
`pos`, `rotate`, `billboard` (поворот к камере), `panelWidth`, `panelHeight`.

```gms
[
description = "Множество Жюлиа, c = {cr} + {ci}i"
float cr = -0.7; float ci = 0.27;
draw Fractal { name = "fr"; type = julia; cRe = cr; cIm = ci; maxIter = 120 }
new UI { name = "s1"; type = slider; label = "Re c"; variable = cr; min = -1; max = 1; step = 0.01 }
new UI { name = "s2"; type = slider; label = "Im c"; variable = ci; min = -1; max = 1; step = 0.01 }
]
```

## 3D-сцены

| Объект | Поля |
|---|---|
| `new Point3D` | `pos = (x, y, z)`, `text`, `dynamic`, точка на плоскости `plane`, `u`, `v` |
| `new Line3D` | `pos = (A, B)` |
| `new Figure3D` | `elements = (A, B, C)` — вершины грани (**точки**, а не отрезки, как в 2D); заливка — `draw Filling3D { figure = "имя" }` |
| `new Primitive` | `type = cube/box/sphere/cylinder/cone/pyramid/prism/tetrahedron/octahedron/dodecahedron/icosahedron/torus`; `pos`, `rotate`, `edge`, `width`, `height`, `depth`, `radius`, `tube`, `sides`, `opacity`, `wireframe`, `showInfo`, `roughness`, `metalness`, `flatShading` |
| `new Section` | сечение тела: `source`, `normal = (x, y, z)`, `offset` или `point`, `keep`, `explode`, `capColor` |
| `new Boolean` | `op = union/intersect/subtract`, `parts = (a, b)` |
| `new Truncate` | `source`, `fraction` — усечение вершин |
| `new Hull`, `new Minkowski` | `parts` — выпуклая оболочка, сумма Минковского |
| `new Angle3D` | `type = lineLine/linePlane/planePlane/dihedral/pointAngle/vectorVector/solid`, `radius`, `count` |
| `draw InfPlane` | `figure` или `points = (A, B, C)`, `opacity`, `grid`, `fade`, `size` |
| `draw Vector3D`, `draw Text3D`, `new Curve3D`, `draw Surface3D` | как 2D-аналоги с третьей координатой |

Точки в 3D перетаскиваются в плоскости экрана; чтобы удержать точку на поверхности,
проецируйте её в `Update`. Живые параметры тел `Primitive` не пересчитываются — сечения
стройте сами через точки и плоскости.

```gms
[
description = "Тетраэдр ABCD: перетаскивайте вершины"
field width = 10; field height = 8; field depth = 10;
camera start rot = (30, 70);
new Point3D { name = "A"; pos = (-2, -1, -2); text = true("A") }
new Point3D { name = "B"; pos = (3, -1, -1); text = true("B") }
new Point3D { name = "C"; pos = (0, -1, 3); text = true("C") }
new Point3D { name = "D"; pos = (0, 3, 0); text = true("D") }
new Line3D { name = "ab"; pos = (A, B) }
new Line3D { name = "bc"; pos = (B, C) }
new Line3D { name = "ca"; pos = (C, A) }
new Line3D { name = "ad"; pos = (A, D) }
new Line3D { name = "bd"; pos = (B, D) }
new Line3D { name = "cd"; pos = (C, D) }
draw InfPlane { name = "base"; points = (A, B, C); opacity = 0.2 }
show axes = true;
]
```

```gms
[
description = "Куб и его сечение плоскостью; сдвиг плоскости: {off}"
field width = 10; field height = 8; field depth = 10;
camera start rot = (35, 65);
float off = 0;
new Primitive { name = "cube"; type = cube; edge = 4; opacity = 0.5 }
new Section { name = "sec"; source = cube; normal = (1, 1, 1); offset = off }
new UI { name = "s"; type = slider; label = "сдвиг"; variable = off; min = -3; max = 3; step = 0.1 }
]
```

## Встроенные функции

### Числа и элементарные функции

`abs`, `sign`, `sqrt`, `cbrt`, `exp`, `log` (натуральный), `log2`, `log10`, `logBase(x, b)`,
`pow(a, b)`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2(y, x)`, `sinh`, `cosh`,
`tanh`, `radians(град)`, `degrees(рад)`, `floor`, `ceil`, `round`, `trunc`, `fract`,
`roundTo(x, d)`, `clamp(x, a, b)`, `lerp(a, b, t)`, `min(…)`, `max(…)` (аргументы или
список), `mod(a, b)`, `hypot`.

### Строки и вывод

`format(x, d)` — число с d знаками, `str(x)`, `num("2.5")`, `latex(expr)`.

### Списки и статистика

`len`, `push(L, x)`, `pop(L)`, `sum`, `prod`, `minOf`, `maxOf`, `mean`, `median`,
`variance`, `stddev`, `quantile(L, q)`, `correlation(a, b)`, `sortAsc`, `reverse`,
`unique`, `range(a, b, step)`, `linspace(a, b, n)`, `map(L, "it * 2")`,
`filter(L, "it > 0")`, `random(a, b)`, `randomInt(a, b)`, `randomNormal(μ, σ)`,
`randomChoice(L)`.

### Теория чисел и комбинаторика

`gcd`, `lcm`, `isPrime`, `primeFactors`, `divisors`, `factorize`, `factorMap`,
`primesUpTo`, `nextPrime`, `eulerPhi`, `mobius`, `divisorSigma(n, k)`, `modPow(a, e, m)`,
`modInv`, `egcd`, `crt(остатки, модули)`, `orderMod`, `primitiveRoot`, `discreteLog`,
`legendreSymbol`, `jacobiSymbol`, `sqrtMod`, `pAdicValuation`, `continuedFraction(x, n)`,
`cfToRational`, `bestRational(x, maxDen)`, `factorial`, `nCr`, `nPr`, `bigFactorial`,
`bigBinom`, `big`, `bigStr`, `isPrimeBig`, `partitionCount`, `partitionsList`,
`stirling1`, `stirling2`, `bell`, `catalan`, `derangements`, `permutationsOf`,
`combinationsOf(L, k)`, `powerSet`, `pascalTriangle(n)`.
Рациональные числа: `rat(p, q)`, `ratStr`, `ratNum`, `numer`, `denom`, `isRat`.

### Вероятности

`binomialPmf(k, n, p)`, `poissonPmf(k, λ)`, `normalPdf(x, μ, σ)`, `normalCdf`,
`normalQuantile(p)`, `erf`, `tPdf`, `tCdf`, `tQuantile`, `chi2Pdf`, `chi2Cdf`,
`chi2Quantile`, `fPdf`, `fCdf`, `fQuantile`, `tTest(выборка, μ0)`, `tTest2(a, b)`,
`chiSquareTest(набл, ожид)`, `confInterval(выборка, уровень)`.

### Анализ (численно)

`derivative("f", x)`, `derivative2("f", x)`, `integral("f", a, b)`, `solve("f", x0)`
(метод Ньютона), `bisect("f", a, b)`, `findRoots("f", a, b, n)`, `solveSystem`,
`limitAt("f", x0, dir)`, `sumSeries("f", a, b)`, `prodSeries`, `odeSolve(system,
initial, tSpan, steps)`, `gradient`, `jacobian`, `divergence`, `curl`, `hessian`,
`laplacian`, `directionalDerivative`, `interpolate(pts, method)`,
`fitLinear(pts)`, `fitPolynomial(pts, deg)`, `fourierCoeffs`, `dft`.

### Символьные вычисления

`simplify("x+x")`, `expand`, `factorPoly(e, v)`, `diff(e, v)`, `diffN(e, v, n)`,
`integrate(e, v)`, `integrateDefinite(e, v, a, b)`, `limit(e, v, точка)`,
`series(e, v, точка, порядок)`, `subst(e, v, знач)`, `evalAt(e, v, знач)`,
`polyCoeffs`, `solveSymbolic(e, v)`, `exprTree(e)`. Версии с LaTeX-выводом:
`simplifyLatex`, `diffLatex`, `expandLatex`, `factorLatex`, `integrateLatex`.

### Векторы, матрицы и комплексные числа

`dot`, `cross`, `norm`, `normalize`, `vecAngle`, `transpose`, `det`, `inv`, `trace`,
`rank`, `identity(n)`, `solveLinear(M, b)`, `eigenvalues`, `eigenvectors`,
`luDecompose`, `qrDecompose`, `cholesky`, `charPoly`, `smithNormalForm`.
Точно (рационально): `ratDet`, `ratDetStr`, `ratInv`, `ratRref`, `ratRank`,
`ratNullspace`; символьно: `symDet`, `symMatMul`, `symMatAdd`, `symMatSub`.
Комплексные: `complex(re, im)`, `re`, `im`, `arg`, `conj`, `cpow`, `fromPolar(r, φ)`;
`sin`, `exp`, `sqrt` и др. принимают комплексные аргументы.

### Геометрия

`distance(p1, p2)`, `pointDistance(точка, прямая)`, `lineAngle`, `areParallel`,
`arePerpendicular`, `closestPointOnLine`, `intersection(тип, a, b)`,
`intersectionSegment`, `polygonArea`, `polygonCentroid`, `pointInPolygon`,
`convexHull`, `delaunay`, `polygonIntersection`, `polygonUnion`, `polygonDifference`,
`rotate(p, угол, центр)`, `translate(p, dx, dy)`, `scale(p, sx, sy, центр)`,
`reflect(p, прямая)`, `transform(p, матрица)`, `polar(r, φ)`, `toPolar(p)`.
Гиперболическая геометрия: `hypDistance`, `hypTiling`, `mobiusTransform`, `hypTranslate`.

### Графы

`newGraph`, `addNode`, `addEdge`, `graphNodes`, `graphDegree`, `graphNeighbors`,
`graphAdjacency`, `graphComponents`, `graphIsBipartite`, `graphColoring`, `graphMST`,
`graphTopoSort`, `graphHasCycle`, `bfs(g, s)`, `dfs(g, s)`, `shortestPath(g, a, b)`,
раскладки `graphLayoutCircle`, `graphLayoutGrid`, `graphLayoutForce`, `graphLayoutTree`.

### Алгебра

Группы: `cyclicGroup(n)`, `dihedralGroup`, `symmetricGroup`, `alternatingGroup`,
`unitsGroup`, `groupElements`, `groupOrder`, `groupMul(g, a, b)`, `groupInverse`,
`groupElementOrder`, `groupIsAbelian`, `groupTable`, `groupGenerated`,
`groupSubgroups`, `groupCosets`, `groupIsNormal`, `groupCenter`,
`groupConjugacyClasses`, `groupQuotient`, `groupIsomorphic`, `cayleyGraph`.
Перестановки: `permCompose`, `permInverse`, `permCycles`, `permSign`, `permOrder`,
`permFromCycles`. Поля и многочлены: `galoisField(p, n)`, `fieldElements`, `fieldAdd`,
`fieldMul`, `fieldInverse`, `polyAddMod`, `polyMulMod`, `polyDivMod`, `polyGcdMod`,
`polyIsIrreducible`, `cyclotomic`. Частичные порядки: `divisorLattice`,
`subsetLattice`, `posetElements`, `posetHasse`, `posetJoin`, `posetMeet`,
`posetIsLattice`, `posetRank`. Топология: `complexFaces`, `boundaryMatrix`,
`bettiNumbers`, `eulerCharacteristic`, `homologyGroups`, `homologyString`.

### Логика и множества

`truthTable(vars, f)`, `isTautology`, `isSatisfiable`, `isContradiction`, `models`,
`logicEquiv`, `setUnion`, `setIntersect`, `setDiff`, `setSymDiff`, `isSubset`,
`setEqual`, `cartesian`, `vennRegions`.

### Специальные функции

`gamma`, `beta`, `digamma`, `zeta`, `besselJ(n, x)`, `legendreP`, `chebyshevT`,
`hermiteH`, `laguerreL`, `ellipticK`, `ellipticE`, `lambertW`, `airyAi`.

### Клеточные автоматы

`lifeStep(сетка)`, `elementaryStep(строка, правило)`.

### Служебные

`redraw()`, `saveState()`, `loadState(json)`, `exportImage("имя")`,
`startRecording("имя")`, `stopRecording()`, `exportVideo("имя", секунды)`.

```gms
[
description = "{info}"
string info = "";
func f(x) = x^3 - 2*x - 5;
Update {
  info = "Корень x³ − 2x − 5: " + format(solve("f", 2), 6) + "\n\n∫₀¹ f = " + format(integral("f", 0, 1), 4) + "\n\nНОД(84, 36) = " + gcd(84, 36) + ", C(10, 3) = " + nCr(10, 3) + "\n\n(x²)' = " + diff("x^2", "x");
}
]
```

## Частые ошибки

1. Нет обрамляющих `[ … ]`.
2. Поля разделены запятыми вместо `;`.
3. `f = "x^2"` в `draw Function` — нужно имя функции: `func f(x) = x^2;` и `f = "f"`.
4. `type = "slider"` в кавычках — тип UI пишется без кавычек.
5. Действие кнопки без кавычек: `action = "a = 1"`.
6. `i++` и `for (i = 0; …)` — используйте `i += 1` и `repeat`.
7. Повторяющиеся имена объектов.
8. `Claster` пишется через **a**, `EquallySing` — именно так.
9. Лишние `color` — объект становится нечитаемым в одной из тем.
10. Тяжёлые вычисления в `Update` без кэша — сцена тормозит.

## Визуальный конструктор

Вкладка **«Конструктор»** песочницы собирает 2D-сцену мышью и сама пишет её GMS-код:

| Инструмент | Как строить | Что получится в коде |
|---|---|---|
| Точка | щелчок по полю | `new Point` |
| Отрезок, Прямая, Вектор | две точки | `new Line` (+ `draw InfLine` / `draw Vector`) |
| Окружность | центр, затем точка на окружности | `new Circle { center; radius = точка }` |
| Многоугольник | вершины, замкнуть щелчком по первой или `Enter` | отрезки + `new Figure` + `draw Filling` |
| Угол | точка, вершина, точка | лучи + `new Angle` + `draw Angle` |
| Середина | две точки | точка-гомотетия с `ratio = 0.5` |
| Подпись | щелчок по полю | `draw Text` |
| + График, + Ползунок | кнопкой | `func` + `draw Function`, `float` + `new UI` |

Щелчок по уже существующей точке использует её, по пустому месту — создаёт новую.
Инструмент «Выбор» двигает точки и фигуры целиком; в панели свойств меняются имя,
координаты, цвет, подписи, выражение графика, границы ползунка. Флажок «Показывать
значение в описании» добавляет живое описание (`{info}` и `Update`) с длиной, углом,
координатами или значением. Удаление точки удаляет и всё, что на ней построено.
`Ctrl` + `Z` / `Ctrl` + `Y` — отмена и повтор. Кнопка «Открыть в редакторе» переносит
код во вкладку «Редактор», где его можно дописывать вручную.

### Режим 3D

Переключатель **2D / 3D** в начале панели инструментов меняет режим (сцена при этом
очищается; `Ctrl` + `Z` вернёт её). В 3D:

| Инструмент | Что получится в коде |
|---|---|
| Точка | `new Point3D` на рабочей плоскости y = const (высота — в настройках сцены) |
| Отрезок, Вектор | `new Line3D` (+ `draw Vector3D`) |
| Многоугольник | рёбра + грань `new Figure3D` + `draw Filling3D` |
| Плоскость | три точки → `draw InfPlane { points = (A, B, C) }` |
| Середина | `new Point3D` с гомотетией |
| + Тело | `new Primitive`: куб, параллелепипед, шар, цилиндр, конус, пирамида, призма, правильные многогранники, тор |
| + Поверхность | y = f(x, z) → `func` + `draw Surface { type = parametric; mode = 3d }` |

Перетаскивание пустого места вращает вид, колесо мыши — масштаб; этот вид попадает в
код как `camera start rot` / `camera start zoom`, поэтому сцена открывается так же,
как в конструкторе. Точки и тела тащатся по горизонтали, с зажатым `Shift` — по
вертикали; точные координаты (x, y, z) и размеры тел задаются в панели свойств.

## Горячие клавиши песочницы

| Клавиши | Действие |
|---|---|
| `Ctrl` + `Enter` | запустить |
| `Ctrl` + `S` | сохранить в браузере |
| `Ctrl` + `/` | закомментировать строку |
| `Tab` / `Shift` + `Tab` | отступ |
| `Ctrl` + `Space` | подсказки |
