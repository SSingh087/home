const powerLed = document.querySelector(".power-led");
const powerButton = document.querySelector(".power-switch .button");
const screen = document.querySelector(".screen");

const timers = [];

powerButton.addEventListener("click", () => {
  powerLed.classList.toggle("on");

  if (powerLed.classList.contains("on")) {
    timers.splice(0);
    screen.classList.remove("off");
    startTyping(["नमस्ते, Hello, Bonjour 👋","Welcome to my website",
      "I do astrophysics","Turn off the screen to look beyond .... 🚀"]);
  } else {
    screen.innerHTML = "";
    timers.forEach(timer => clearTimeout(timer));
    timers.splice(0);
    turnedoff(["Loading ..."]);

    //var spinnerShowTime = 3000
    document.getElementById('boom').style.display = "";
    //document.getElementById('chart').src = 'boom.gif';
    //setTimeout("hideSpinner()", spinnerShowTime);

    //location.replace("https")
    
  }
});


const turnedoff = texts => {
  let wait = 50;
  texts.forEach(text => {
    wait += 750;
    for (let i = 0; i < text.length; i++) {
      const timer = setTimeout(() => {
        screen.innerHTML += text[i];
      }, wait);
      timers.push(timer);
      wait += 50 + ~~(Math.random() * 50);
    }

    wait += 750;

    const timer = setTimeout(() => screen.innerHTML += "<br>", wait);
    timers.push(timer);
  });

  wait += 500;
  const timer = setTimeout(() => wait);
  timers.push(timer);
};



const startTyping = texts => {
  let wait = 50;

  screen.innerHTML = "$ ";
  texts.forEach(text => {
    wait += 750;
    for (let i = 0; i < text.length; i++) {
      const timer = setTimeout(() => {
        screen.innerHTML += text[i];
      }, wait);
      timers.push(timer);
      wait += 50 + ~~(Math.random() * 50);
    }

    wait += 750;

    const timer = setTimeout(() => screen.innerHTML += "<br>$ ", wait);
    timers.push(timer);
  });

  wait += 500;
  const timer = setTimeout(() => wait);
  timers.push(timer);
};