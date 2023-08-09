var script = document.createElement("script");
script.type = "text/javascript";
script.src = "file.js";

function callbackFn(callbackArgs) {
  console.log("script is loaded with the arguments below");
  console.log(callbackArgs);
}

script.onload = function() {
  callbackFn();
};

script.onreadystatechange = function() {
  if (this.readyState !== "loaded" && this.readyState !== "complete") return;
  callbackFn();
};

document.body.appendChild(script);
