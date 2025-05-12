const themes = ['home', 'away', 'alternate'];
let currentIndex = 0;

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme && themes.includes(savedTheme)) {
  document.body.classList.add(savedTheme);
  currentIndex = themes.indexOf(savedTheme);
} else {
  document.body.classList.add(themes[0]);
}

function setTheme(index) {
  document.body.classList.remove(...themes);
  const theme = themes[index];
  document.body.classList.add(theme);
  localStorage.setItem('theme', theme);

  const nextIndex = (index + 1) % themes.length;
  const nextLabel = themes[nextIndex] === 'home' ? 'Home'
                    : themes[nextIndex] === 'away' ? 'Away'
                    : '‘90s';
  document.getElementById('theme-toggle').textContent = nextLabel;
}

document.addEventListener('DOMContentLoaded', () => {
  setTheme(currentIndex);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % themes.length;
    setTheme(currentIndex);
  });
});
