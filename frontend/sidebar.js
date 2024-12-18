// Sidebar Component Function
function createSidebar(containerId, userType,isfaq) {
  let sidebarHTML = `
    <div class="sidebar" id="sidebar">
      <div class="close-btn" onclick="toggleSidebar()">×</div>
      <div class="logo">Tutor Finder</div>
      <ul>
        <li><a href="${isfaq?`./${userType}`:"."}/${userType}_profile.html">Profile</a></li>
        <!-- Conditionally render Find Tutors or Requests based on userType -->
        ${userType === 'student' ? 
          `<li><a href="${isfaq?`./${userType}`:"."}/student_find.html">Find Tutors</a></li>` : 
          `<li><a href="${isfaq?`./${userType}`:"."}/teacher_students.html">Students</a></li>`}
        <li><a href="${isfaq?`./${userType}`:"."}/${userType}_chat.html">Chat</a></li>
        <li><a href="${isfaq?`./${userType}`:"."}/${userType}_settings.html">Settings</a></li>
        <li><a href="../faq.html?usertype=${userType}">FAQ</a></li>
        <li><a onclick="logOut()">Log Out</a></li>
      </ul>
    </div>  
    <div class="overlay" id="overlay" onclick="toggleSidebar()"></div>
  `;

  document.getElementById(containerId).innerHTML = sidebarHTML;
}

function deleteCookie(cookieName) {
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
function logOut(){
  deleteCookie('auth_token');
  window.location.href = '../landing.html';

}
// Sidebar Toggle Function
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}
