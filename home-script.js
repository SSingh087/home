// set up text to print, each item in array is new line
var aText = new Array(
"Hello people !!", 
"I have been working in Gravitaitonal physics.",
"I am a 2nd year master student at Observatoire de Paris-PSL.",
"I did my 1st year master from Université Pierre et Marie Curie - Sorbonne Université",
"Pull the tug to begin journey ..",
"or as the God said",
"Let there be light ....."
);
var iSpeed = 50; // time delay of print out
var iIndex = 0; // start printing array at this posision
var iArrLength = aText[0].length; // the length of the text array
var iScrollAt = 20; // start scrolling up at this many lines
 
var iTextPos = 0; // initialise text position
var sContents = ''; // initialise contents variable
var iRow; // initialise current row
 
function typewriter()
{
 sContents =  ' ';
 iRow = Math.max(0, iIndex-iScrollAt);
 var destination = document.getElementById("typedtext");
 
 while ( iRow < iIndex ) {
  sContents += aText[iRow++] + '<br /> $ ';
 }
 destination.innerHTML = "$" + sContents + aText[iIndex].substring(0, iTextPos);
 if ( iTextPos++ == iArrLength ) {
  iTextPos = 0;
  iIndex++;
  if ( iIndex != aText.length ) {
   iArrLength = aText[iIndex].length;
   setTimeout("typewriter()", 500);
  }
 } else {
  setTimeout("typewriter()", iSpeed);
 }
}

typewriter();


