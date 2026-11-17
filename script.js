/* ==========================================================
   myCV.com - script.js
   The behaviour (things that move or change) for the website.
   ========================================================== */

// 1. Entrance animation
//    Add "animate" right away so the heading and button start hidden,
//    then add "loaded" a moment later so they fade in one by one.
//    If JavaScript is turned off, nothing is hidden and the page still works.
document.documentElement.classList.add("animate");

window.addEventListener("DOMContentLoaded", function () {

  requestAnimationFrame(function () {
    document.documentElement.classList.add("loaded");
  });

  // 2. Footer year
  //    Shows the current year automatically, so you never update it by hand.
  var yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // 3. Navbar shadow
  //    Adds a soft shadow under the top bar once the page is scrolled.
  var navbar = document.querySelector(".navbar");
  function updateNavbar() {
    if (!navbar) return;
    if (window.scrollY > 10) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }
  window.addEventListener("scroll", updateNavbar);
  updateNavbar();

  // 3b. Stay signed in
  //     Once someone has signed in, the homepage skips the login page,
  //     until they click "Sign Out".
  if (isSignedIn()) {
    var homeLogin = document.querySelector('.navbar .login-btn[href^="login.html"]');
    if (homeLogin) {
      homeLogin.textContent = "My CVs";
      homeLogin.setAttribute("href", "mycvs.html");
    }
    var homeCreate = document.querySelector('.create-btn[href^="login.html"]');
    if (homeCreate) {
      homeCreate.setAttribute("href", "templates.html");
    }
  }

  // "Sign Out" buttons forget the sign in
  var signOutLinks = document.querySelectorAll("[data-signout]");
  for (var s = 0; s < signOutLinks.length; s++) {
    signOutLinks[s].addEventListener("click", function () {
      try {
        localStorage.removeItem("mycv-signed-in");
      } catch (error) {}
    });
  }

  /* ==========================================================
     LOGIN PAGE (login.html)
     Everything below only runs if the page has the login card.
     ========================================================== */
  var authCard = document.querySelector(".auth-card");
  if (!authCard) {
    setupTemplatePage();
    setupMyCVsPage();
    return;
  }

  // 4. Switch between "Create Account" and "Sign In"
  function showTab(name) {
    if (name !== "create" && name !== "signin") {
      name = "create";
    }
    document.getElementById("tab-create").classList.toggle("active", name === "create");
    document.getElementById("tab-signin").classList.toggle("active", name === "signin");
    document.getElementById("panel-create").classList.toggle("active", name === "create");
    document.getElementById("panel-signin").classList.toggle("active", name === "signin");
  }

  // Every element with data-tab="create" or data-tab="signin" switches the tab
  var tabSwitchers = authCard.querySelectorAll("[data-tab]");
  for (var i = 0; i < tabSwitchers.length; i++) {
    tabSwitchers[i].addEventListener("click", function (event) {
      event.preventDefault();
      var name = this.getAttribute("data-tab");
      showTab(name);
      window.location.hash = name;
    });
  }

  // Open the right tab from the address: login.html#signin or login.html#create
  showTab(window.location.hash.replace("#", ""));

  // 5. Helpers to show a message under a form
  function showMessage(element, text, type) {
    element.textContent = text;
    element.className = "form-message " + type;   // type is "error" or "info"
  }

  function clearInvalid(form) {
    var inputs = form.querySelectorAll("input");
    for (var j = 0; j < inputs.length; j++) {
      inputs[j].classList.remove("invalid");
    }
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // 6. Create Account form: check every field before continuing
  var createForm = document.getElementById("create-form");
  var createMessage = document.getElementById("create-message");

  createForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearInvalid(createForm);

    var name = document.getElementById("create-name");
    var email = document.getElementById("create-email");
    var password = document.getElementById("create-password");
    var confirm = document.getElementById("create-confirm");

    if (name.value.trim() === "") {
      name.classList.add("invalid");
      showMessage(createMessage, "Please enter your full name.", "error");
      name.focus();
      return;
    }
    if (!isEmail(email.value.trim())) {
      email.classList.add("invalid");
      showMessage(createMessage, "Please enter a valid email address, like you@example.com.", "error");
      email.focus();
      return;
    }
    if (password.value.length < 8) {
      password.classList.add("invalid");
      showMessage(createMessage, "Your password needs at least 8 characters.", "error");
      password.focus();
      return;
    }
    if (confirm.value !== password.value) {
      confirm.classList.add("invalid");
      showMessage(createMessage, "The two passwords do not match. Type the same password in both boxes.", "error");
      confirm.focus();
      return;
    }

    // All fields are correct.
    // TODO: send name, email and password to your server here to really create the account.
    // For now, remember that the person is signed in and go to the template page.
    rememberSignIn(name.value.trim());
    window.location.href = "templates.html";
  });

  // 7. Sign In form
  var signinForm = document.getElementById("signin-form");
  var signinMessage = document.getElementById("signin-message");

  signinForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearInvalid(signinForm);

    var email = document.getElementById("signin-email");
    var password = document.getElementById("signin-password");

    if (!isEmail(email.value.trim())) {
      email.classList.add("invalid");
      showMessage(signinMessage, "Please enter a valid email address, like you@example.com.", "error");
      email.focus();
      return;
    }
    if (password.value === "") {
      password.classList.add("invalid");
      showMessage(signinMessage, "Please enter your password.", "error");
      password.focus();
      return;
    }

    // TODO: send email and password to your server here to really sign in.
    // For now, remember that the person is signed in and go to the template page.
    rememberSignIn("");
    window.location.href = "templates.html";
  });

  // 9. Show / Hide buttons inside the password boxes
  var toggles = authCard.querySelectorAll(".toggle-password");
  for (var t = 0; t < toggles.length; t++) {
    toggles[t].addEventListener("click", function () {
      var input = document.getElementById(this.getAttribute("data-target"));
      if (input.type === "password") {
        input.type = "text";
        this.textContent = "Hide";
      } else {
        input.type = "password";
        this.textContent = "Show";
      }
    });
  }

  // 10. Password strength bars (0 = empty, 4 = strong)
  var strength = document.getElementById("strength");
  var strengthText = document.getElementById("strength-text");
  var strengthLabels = [
    "Use 8 or more characters with letters, numbers and symbols.",
    "Weak password. Make it longer and mix letters, numbers and symbols.",
    "Fair password. Add capital letters or numbers.",
    "Good password. Add a symbol to make it strong.",
    "Strong password."
  ];

  document.getElementById("create-password").addEventListener("input", function () {
    var value = this.value;
    var level = 0;
    if (value.length > 0) level = 1;
    if (value.length >= 8) {
      level = 1;
      if (/[a-z]/.test(value) && /[A-Z]/.test(value)) level++;
      if (/[0-9]/.test(value)) level++;
      if (/[^A-Za-z0-9]/.test(value)) level++;
    }
    strength.setAttribute("data-level", level);
    strengthText.textContent = strengthLabels[level];
  });

  // 8. Google / Facebook / LinkedIn buttons
  var socialButtons = authCard.querySelectorAll(".social-btn");
  for (var k = 0; k < socialButtons.length; k++) {
    socialButtons[k].addEventListener("click", function () {
      var provider = this.getAttribute("data-provider");
      var panel = this.closest(".auth-panel");
      var message = panel.querySelector(".form-message");
      // TODO: start the real Google / Facebook / LinkedIn login here.
      showMessage(message, provider + " login will work once the website is connected to a server.", "info");
    });
  }

});

/* ==========================================================
   TEMPLATE PAGE (templates.html)
   Runs only if the page has the template cards.
   ========================================================== */
function setupTemplatePage() {
  var grid = document.querySelector(".tpl-grid");
  if (!grid) return;

  var cards = grid.querySelectorAll(".tpl-card");
  var chosenText = document.getElementById("tpl-chosen");
  var continueBtn = document.getElementById("tpl-continue");

  // 11. Choose a template by clicking its card
  function selectTemplate(name) {
    var found = false;
    for (var i = 0; i < cards.length; i++) {
      var isThis = cards[i].getAttribute("data-template") === name;
      cards[i].classList.toggle("selected", isThis);
      cards[i].querySelector(".tpl-select").textContent = isThis ? "Selected" : "Use this template";
      if (isThis) found = true;
    }
    if (!found) return;

    chosenText.textContent = name + " template selected.";
    continueBtn.classList.remove("disabled");
    continueBtn.removeAttribute("aria-disabled");

    // Remember the choice in this browser so the next page can use it
    try {
      localStorage.setItem("mycv-template", name);
    } catch (error) {
      // Saving is not allowed in this browser. The page still works.
    }
  }

  for (var c = 0; c < cards.length; c++) {
    cards[c].addEventListener("click", function () {
      selectTemplate(this.getAttribute("data-template"));
    });
  }

  // Show the template that was chosen last time, if there is one
  try {
    var saved = localStorage.getItem("mycv-template");
    if (saved) selectTemplate(saved);
  } catch (error) {
    // Nothing saved. Start with no template chosen.
  }

  // 12. Filter buttons: All / Professional / Creative / Simple
  var filters = document.querySelectorAll(".tpl-filter");
  for (var f = 0; f < filters.length; f++) {
    filters[f].addEventListener("click", function () {
      var wanted = this.getAttribute("data-filter");
      for (var a = 0; a < filters.length; a++) {
        filters[a].classList.toggle("active", filters[a] === this);
      }
      for (var b = 0; b < cards.length; b++) {
        var show = wanted === "all" || cards[b].getAttribute("data-category") === wanted;
        cards[b].classList.toggle("hidden", !show);
      }
    });
  }
}


/* ==========================================================
   STAY SIGNED IN
   Remembers in this browser that the person has signed in.
   This is only a memory, not real security. Real accounts
   come when the website is connected to a server.
   ========================================================== */
function rememberSignIn(name) {
  try {
    localStorage.setItem("mycv-signed-in", name || "yes");
  } catch (error) {
    // Saving is not allowed in this browser. The person signs in again next time.
  }
}

function isSignedIn() {
  try {
    return localStorage.getItem("mycv-signed-in") !== null;
  } catch (error) {
    return false;
  }
}


/* ==========================================================
   SAVED CVs
   Every CV is kept in a list in this browser:
   { id, template, data, updated }
   ========================================================== */
function readCVList() {
  try {
    var list = JSON.parse(localStorage.getItem("mycv-list"));
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

function writeCVList(list) {
  try {
    localStorage.setItem("mycv-list", JSON.stringify(list));
    return true;
  } catch (error) {
    return false;          // saving is not allowed, or the storage is full
  }
}

function newCVId() {
  return "cv-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// An older version of the site kept only one CV. Move it into the list.
function moveOldCVIntoList() {
  try {
    var old = localStorage.getItem("mycv-data");
    if (!old) return;
    if (readCVList().length === 0) {
      var id = newCVId();
      writeCVList([{
        id: id,
        template: localStorage.getItem("mycv-template") || "Classic",
        data: JSON.parse(old),
        updated: Date.now()
      }]);
      localStorage.setItem("mycv-current", id);
    }
    localStorage.removeItem("mycv-data");
  } catch (error) {
    // Nothing to move.
  }
}

/* ==========================================================
   MY CVs PAGE (mycvs.html)
   Runs only if the page has the folder grid.
   ========================================================== */
function setupMyCVsPage() {
  var grid = document.getElementById("cv-grid");
  if (!grid) return;

  moveOldCVIntoList();

  function safe(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initialsOf(name) {
    var words = String(name || "").trim().split(/\s+/);
    var letters = "";
    for (var i = 0; i < words.length && letters.length < 2; i++) {
      if (words[i]) letters += words[i].charAt(0).toUpperCase();
    }
    return letters || "CV";
  }

  function dateText(time) {
    if (!time) return "";
    var date = new Date(time);
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
           ", " + date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  // 13. Draw one card per saved CV, newest first, then the "new CV" card
  function drawCards() {
    var list = readCVList();
    list.sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });

    var html = "";
    for (var i = 0; i < list.length; i++) {
      var cv = list[i];
      var data = cv.data || {};
      var picture = data.photo
        ? '<img src="' + safe(data.photo) + '" alt="">'
        : safe(initialsOf(data.name));

      html +=
        '<article class="cv-card">' +
          '<div class="cv-card-top">' +
            '<div class="cv-card-photo">' + picture + "</div>" +
            '<div class="cv-card-text">' +
              "<h2>" + safe(data.name || "Untitled CV") + "</h2>" +
              "<p>" + safe(data.title || "No job title yet") + "</p>" +
            "</div>" +
          "</div>" +
          '<dl class="cv-card-facts">' +
            "<div><dt>Template</dt><dd>" + safe(cv.template || "Classic") + "</dd></div>" +
            "<div><dt>Last edited</dt><dd>" + safe(dateText(cv.updated)) + "</dd></div>" +
          "</dl>" +
          '<div class="cv-card-actions">' +
            '<a href="create.html" class="cv-edit" data-edit="' + safe(cv.id) + '">Edit CV</a>' +
            '<a href="create.html#download" class="cv-download" data-edit="' + safe(cv.id) + '">Download</a>' +
            '<button type="button" class="remove-btn" data-delete="' + safe(cv.id) + '">Delete</button>' +
          "</div>" +
        "</article>";
    }

    html +=
      '<a href="templates.html" class="cv-card cv-card-new" id="new-cv">' +
        '<span class="cv-new-plus">+</span>' +
        "<strong>Create a new CV</strong>" +
        "<span>" + (list.length ? "Start another CV from a template." : "You have no saved CVs yet. Start your first one.") + "</span>" +
      "</a>";

    grid.innerHTML = html;
  }

  grid.addEventListener("click", function (event) {
    // "Edit CV" and "Download": remember which CV to open, then go to the CV page.
    // Download opens create.html#download, which starts the download there.
    var edit = event.target.closest("[data-edit]");
    if (edit) {
      var list = readCVList();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === edit.getAttribute("data-edit")) {
          try {
            localStorage.setItem("mycv-current", list[i].id);
            localStorage.setItem("mycv-template", list[i].template || "Classic");
          } catch (error) {}
        }
      }
      return;                                  // the link then opens create.html
    }

    // "Create a new CV": start with a fresh id and no template chosen
    if (event.target.closest("#new-cv")) {
      try {
        localStorage.setItem("mycv-current", newCVId());
        localStorage.removeItem("mycv-template");
      } catch (error) {}
      return;                                  // the link then opens templates.html
    }

    // "Delete": the first click asks, the second click deletes
    var del = event.target.closest("[data-delete]");
    if (del) {
      if (!del.classList.contains("confirm")) {
        del.classList.add("confirm");
        del.textContent = "Click again to delete";
        return;
      }
      var id = del.getAttribute("data-delete");
      var kept = readCVList().filter(function (cv) { return cv.id !== id; });
      writeCVList(kept);
      try {
        if (localStorage.getItem("mycv-current") === id) localStorage.removeItem("mycv-current");
      } catch (error) {}
      drawCards();
    }
  });

  drawCards();
}