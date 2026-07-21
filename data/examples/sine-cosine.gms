[
title = "sin(x) и cos(x)"
undertitle = "Синус и косинус"
description = "Меняйте частоту и смотрите, как синус и косинус сдвинуты друг относительно друга"

float freq = 1;

func s(x) = sin(freq * x);
func c(x) = cos(freq * x);

draw Function {
    name = "sinGraph";
    f = "s";
    xmin = -10;
    xmax = 10;
    segments = 300;
    color = #3b82f6;
    thickness = 3;
}

draw Function {
    name = "cosGraph";
    f = "c";
    xmin = -10;
    xmax = 10;
    segments = 300;
    color = #f59e0b;
    thickness = 3;
}

new UI {
    type = slider;
    label = "частота";
    variable = freq;
    min = 0.5;
    max = 4;
    default = 1;
}

show axes = true;
show grid = true;
]
