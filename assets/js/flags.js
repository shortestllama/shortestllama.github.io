document.addEventListener("DOMContentLoaded", () => {
  const totalFlags = 5;
  const container = document.getElementById("flags-container");
  let found = 0;

  for (let i = 1; i <= totalFlags; i++) {
    if (localStorage.getItem(`flag${i}_found`) === "true") {
      found++;
      container.appendChild(makeFlagCard(i));
    }
  }

  document.getElementById("flag-count").textContent = `${found}/${totalFlags} flags found`;
});

function makeFlagCard(i) {
  const card = document.createElement("div");
  card.className = "flag-card";

  const title = document.createElement("div");
  title.className = "flag-title";
  title.textContent = `Flag ${i} Challenge`;
  card.appendChild(title);

  const solved = localStorage.getItem(`flag${i}_solved`) === "true";
  const correct = getFlag(i);

  if (solved) {
    const flag = document.createElement("code");
    flag.style.display = "block";
    flag.style.marginTop = "1rem";
    flag.style.padding = "0.75rem";
    flag.style.backgroundColor = "#2a2a2a";
    flag.style.borderRadius = "6px";
    flag.style.color = "#00ff88";
    flag.style.fontSize = "1.1rem";
    flag.textContent = correct;
    flag.classList.add("fade-in");

    const check = document.createElement("div");
    check.textContent = "✅ Correct!";
    check.style.color = "#00ff88";
    check.style.marginTop = "0.5rem";
    check.style.fontWeight = "bold";
    check.classList.add("fade-in");

    card.appendChild(flag);
    card.appendChild(check);
    return card;
  }

  const desc = document.createElement("div");
  desc.className = "flag-desc";
  desc.textContent = getDescription(i);

  const hintToggle = document.createElement("div");
  hintToggle.className = "hint-toggle";
  hintToggle.textContent = "Show Hint";
  hintToggle.addEventListener("click", () => {
    const hint = card.querySelector(".hint-content");
    hint.style.display = hint.style.display === "block" ? "none" : "block";
    hintToggle.textContent = hint.style.display === "block" ? "Hide Hint" : "Show Hint";
  });

  const hintContent = document.createElement("div");
  hintContent.className = "hint-content";
  hintContent.textContent = getHint(i);

  const inputGroup = document.createElement("div");
  inputGroup.className = "flag-input";

  const input = document.createElement("input");
  input.placeholder = "Enter flag...";

  const button = document.createElement("button");
  button.textContent = "Submit";

  const result = document.createElement("div");
  result.style.marginTop = "0.5rem";
  result.style.fontWeight = "bold";

  button.onclick = () => {
    const submitted = input.value.trim();
    if (submitted === correct) {
      localStorage.setItem(`flag${i}_solved`, "true");

      // Remove everything but title
      desc.remove();
      hintToggle.remove();
      hintContent.remove();
      inputGroup.remove();
      result.remove();

      // Add solved flag + success
      const flag = document.createElement("code");
      flag.textContent = correct;
      flag.style.display = "block";
      flag.style.marginTop = "1rem";
      flag.style.padding = "0.75rem";
      flag.style.backgroundColor = "#2a2a2a";
      flag.style.borderRadius = "6px";
      flag.style.color = "#00ff88";
      flag.style.fontSize = "1.1rem";
      flag.classList.add("fade-in");

      const check = document.createElement("div");
      check.textContent = "✅ Correct!";
      check.style.color = "#00ff88";
      check.style.marginTop = "0.5rem";
      check.style.fontWeight = "bold";
      check.classList.add("fade-in");

      card.appendChild(flag);
      card.appendChild(check);
    } else {
      result.textContent = "❌ Incorrect flag.";
      result.style.color = "#ff4444";
    }
  };

  inputGroup.appendChild(input);
  inputGroup.appendChild(button);

  card.appendChild(desc);
  card.appendChild(hintToggle);
  card.appendChild(hintContent);
  card.appendChild(inputGroup);
  card.appendChild(result);

  return card;
}

function makeSolvedDisplay(flagText) {
  const container = document.createElement("div");

  const flag = document.createElement("code");
  flag.style.display = "block";
  flag.style.padding = "0.75rem";
  flag.style.backgroundColor = "#2a2a2a";
  flag.style.borderRadius = "6px";
  flag.style.color = "#00ff88";
  flag.style.fontSize = "1.1rem";
  flag.textContent = flagText;

  const check = document.createElement("div");
  check.textContent = "✅ Correct!";
  check.style.color = "#00ff88";
  check.style.marginTop = "0.5rem";
  check.style.fontWeight = "bold";

  container.appendChild(flag);
  container.appendChild(check);
  return container;
}

function getDescription(i) {
  const descriptions = {
    1: "Little Timmy's ESP32-C6 Zigbee firmware hides the flag. Can you reverse it?",
    2: "This flag is buried deep in a terminal clue...",
    3: "A base64+rot13 string revealed something odd...",
    4: "Found behind a QR code on the About page.",
    5: "Requires understanding a strange JS payload.",
  };
  return descriptions[i] || "Solve the mystery to reveal this flag!";
}

function getHint(i) {
  const hints = {
    1: "Try Ghidra or IDA on the ELF binary — look for string references to 'shared_string'.",
    2: "Search the site for elements that look like command prompts.",
    3: "ROT13 then base64-decode... or is it the other way around?",
    4: "Inspect image metadata or check CSS background URLs.",
    5: "Open DevTools and look for obfuscated scripts.",
  };
  return hints[i] || "No hint available for this flag yet!";
}

function getFlag(i) {
  const flags = {
    1: "gotham{C0mput3r_4n41y5i5}", //web
    2: "gotham{3l_r4t4_414d4}", //recon
    // future flags here
  };
  return flags[i];
}
