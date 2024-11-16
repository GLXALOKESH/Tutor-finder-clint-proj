// Sidebar Component Function
function createSidebar(containerId) {
  const sidebarHTML = `
    <div class="sidebar" id="sidebar">
      <div class="close-btn" onclick="toggleSidebar()">×</div>
      <div class="logo">Tutor Finder</div>
      <ul>
        <li><a href="#"><span class="icon">🏠</span> Home</a></li>
        <li><a href="#"><span class="icon">📖</span> Find Tutors</a></li>
        <li><a href="#"><span class="icon">ℹ️</span> About Us</a></li>
        <li><a href="#"><span class="icon">📞</span> Contact</a></li>
        <li><a href="#"><span class="icon">🔒</span> Log In</a></li>
        <li><a href="#"><span class="icon">📝</span> Sign Up</a></li>
      </ul>
    </div>
    <div class="overlay" id="overlay" onclick="toggleSidebar()"></div>
  `;
  document.getElementById(containerId).innerHTML = sidebarHTML;
}

// Sidebar Toggle Function
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}