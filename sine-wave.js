var svg = document.getElementById('sine_wave').children[0];
var origin = { //origin of axes
    x: 100,
    y: 350
};
var amplitude = 30; // wave amplitude
var rarity = 2; // point spacing
var freq = .1; // angular frequency
var phase = 0; // phase angle

for (var i = 0; i < 5000; i++) {
    freq += 0.0001
    amplitude += 0.0005*i
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute('x1', (i - 1) * rarity + origin.x);
    line.setAttribute('y1', Math.sin(freq*(i - 1 + phase)) * amplitude + origin.y);

    line.setAttribute('x2', i * rarity + origin.x);
    line.setAttribute('y2', Math.sin(freq*(i + phase)) * amplitude + origin.y);

    line.setAttribute('style', "stroke:white;stroke-width:3");
    
    setTimeout(() => {  svg.appendChild(line) }, 500);

    
}