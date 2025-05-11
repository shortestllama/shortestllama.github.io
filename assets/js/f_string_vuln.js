const memory = [
  "jack",          // %s
  0xdeadbeef,      // %p
  0x0badf00d,      // %x
  42,              // %d
  -13,             // %i
  1337,            // %u
  "/flags/arkham",// %s
  0123,            // %o
  65,              // %c ('A')
  { addr: 0, ref: "n1" }, // %n → reference to output length
  1234567890123n,  // %lld / %llu
];

const inputBox = document.getElementById("fmt-input");
const output = document.getElementById("fmt-output");

let ptr = 0;

inputBox.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const input = inputBox.value;
    const result = "> " + simulateFormatString(input);
    output.innerText = result;
    inputBox.value = "";
  }
});


function simulateFormatString(fmt) {
  let out = "";

  const regex = /%[0-9]*\.?[0-9]*[lh]*[diuoxXscpgn]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(fmt)) !== null) {
    // Add text before the format
    out += fmt.slice(lastIndex, match.index);

    // Get the memory value (looped)
    const val = memory[ptr++ % memory.length];

    // Parse format specifier
    const spec = match[0].match(/%([0-9]*\.?[0-9]*)([lh]*)([diuoxXscpgn])/);
    if (!spec) continue;

    const [_whole, _width, lengthMod, type] = spec;

    switch (type) {
      case "d":
      case "i":
        out += parseInt(val);
        break;
      case "u":
        out += Math.abs(parseInt(val)) >>> 0;
        break;
      case "o":
        out += (parseInt(val) >>> 0).toString(8);
        break;
      case "x":
        out += (parseInt(val) >>> 0).toString(16);
        break;
      case "X":
        out += (parseInt(val) >>> 0).toString(16).toUpperCase();
        break;
      case "p":
        out += "0x" + (parseInt(val) >>> 0).toString(16).padStart(8, '0');
        break;
      case "s":
        out += String(val);
        break;
      case "c":
        out += String.fromCharCode(parseInt(val));
        break;
      case "n":
        if (typeof val === "object" && "ref" in val) {
          val.addr = out.length;
        }
        break;
      case "g":
        out += parseFloat(val);
        break;
    }

    lastIndex = regex.lastIndex;
  }

  // Append remaining text after last match
  out += fmt.slice(lastIndex);
  return out;
}

