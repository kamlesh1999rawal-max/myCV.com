/* ==========================================================
   myCV.com - builder.js
   The CV page (create.html): the form on the left and the
   live CV on the right.
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {

  var editor = document.getElementById("editor");
  if (!editor) return;                       // not the CV page

  var cvBox = document.getElementById("cv-box");
  var cvPage = document.getElementById("cv-page");
  var stage = document.getElementById("preview-stage");
  var templateSelect = document.getElementById("template-select");

  /* ----------------------------------------------------------
     1. Labels for the sections that hold a list of entries
     ---------------------------------------------------------- */
  var LISTS = {
    education: {
      name: "Education",
      title: "Degree or course", place: "School or university", years: null, details: "Details (optional)",
      // Education has an address and two year boxes instead of one "Years" box
      city: "City", country: "Country", start: "Start year", end: "End year"
    },
    experience: {
      name: "Job",
      title: "Job title", place: "Company", years: null, details: "What you did",
      // Work experience has a company link and dates with month + year
      link: "Company link (optional)",
      startMonth: "Start month", startYear: "Start year", endMonth: "End month", endYear: "End year"
    },
    projects: {
      name: "Project",
      title: "Project name", place: "Your role", years: null, details: "What the project was",
      // Projects have a link, dates with month + year, and a text box with
      // font, bold, italic, underline and bullet buttons
      link: "Project link (optional)",
      startMonth: "Start month", startYear: "Start year", endMonth: "End month", endYear: "End year",
      rich: true
    },
    certifications: {
      name: "Certification",
      title: "Certificate name", place: "Given by", years: "Year", details: null
    },
    custom: {
      name: "Your section",
      title: "Section title", place: null, years: null, details: "What to write in this section"
    }
  };

  /* ----------------------------------------------------------
     2. The CV data. Starts with sample text.
     ---------------------------------------------------------- */
  function sampleData() {
    return {
      photo: "",
      name: "Alex Morgan",
      title: "Marketing Manager",
      email: "hello@mycv.com",
      phoneCode: "",
      phone: "+00 123 456 789",
      country: "Country",
      province: "",
      district: "City",
      link: "",
      objective: "Marketing manager with 6 years of experience, looking to lead brand growth at a global company.",
      skills: "Branding, SEO, Content, Analytics",
      education: [
        { title: "BBA, Marketing", place: "City University", city: "", country: "", start: "2015", end: "2019", details: "" }
      ],
      experience: [
        { title: "Marketing Manager", place: "Bright Media", link: "", startMonth: "Mar", startYear: "2022", endMonth: "Present", endYear: "", details: "Led a team of 5 and planned yearly campaigns." },
        { title: "Marketing Executive", place: "Nova Retail", link: "", startMonth: "Jun", startYear: "2019", endMonth: "Feb", endYear: "2022", details: "Managed social media and email marketing." }
      ],
      projects: [
        { title: "Brand Relaunch", place: "Project lead", link: "", startMonth: "Jan", startYear: "2023", endMonth: "Aug", endYear: "2023",
          rich: true, details: "<ul><li>Redesigned the brand and the website.</li><li>Grew website visits by <b>40%</b>.</li></ul>" }
      ],
      certifications: [
        { title: "Digital Marketing Certificate", place: "Marketing Institute", years: "2021", details: "" }
      ],
      custom: []
    };
  }

  function emptyData() {
    return {
      photo: "",
      name: "", title: "", email: "", phoneCode: "", phone: "",
      country: "", province: "", district: "", link: "",
      objective: "", skills: "",
      education: [], experience: [], projects: [], certifications: [], custom: []
    };
  }

  // Which saved CV is open. The list of saved CVs lives in script.js.
  moveOldCVIntoList();
  var cvId = null;
  try {
    cvId = localStorage.getItem("mycv-current");
  } catch (error) {}
  if (!cvId) {
    cvId = newCVId();                          // a brand new CV
    try {
      localStorage.setItem("mycv-current", cvId);
    } catch (error) {}
  }

  function findRecord(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === cvId) return list[i];
    }
    return null;
  }

  // Read this CV from the saved list
  function loadData() {
    try {
      var record = findRecord(readCVList());
      var saved = record && record.data;
      if (saved && typeof saved === "object") {
        var base = emptyData();
        for (var key in base) {
          if (saved[key] !== undefined) base[key] = saved[key];
        }
        // An older version had one "Years" box for education, like "2015 - 2019".
        // Split it into start year and end year.
        for (var e = 0; e < base.education.length; e++) {
          var old = base.education[e];
          if (old.years && !old.start && !old.end) {
            var parts = old.years.split("-");
            old.start = (parts[0] || "").trim();
            old.end = (parts[1] || "").trim();
          }
          old.years = "";
        }
        // The same for work experience, like "2022 - Now".
        for (var w = 0; w < base.experience.length; w++) {
          var job = base.experience[w];
          if (job.years && !job.startYear && !job.endYear && !job.endMonth) {
            var bits = job.years.split("-");
            job.startYear = (bits[0] || "").trim();
            var last = (bits[1] || "").trim();
            if (/^(now|present)$/i.test(last)) {
              job.endMonth = "Present";
            } else {
              job.endYear = last;
            }
          }
          job.years = "";
        }
        // Projects: an older version had one "Year" box and plain text.
        for (var p = 0; p < base.projects.length; p++) {
          var project = base.projects[p];
          if (project.years && !project.startYear && !project.endYear) {
            project.startYear = project.years;
          }
          project.years = "";
          if (!project.rich) {
            project.details = esc(project.details).replace(/\n/g, "<br>");
            project.rich = true;
          }
        }
        // An older version had one "City and country" box. Keep that text.
        if (saved.location && !base.country && !base.province && !base.district) {
          base.district = saved.location;
        }
        return base;
      }
    } catch (error) {
      // Nothing saved, or saving is not allowed here.
    }
    return sampleData();
  }

  // Save this CV into the list shown on the My CVs page
  function saveData() {
    var list = readCVList();
    var record = findRecord(list);
    if (!record) {
      record = { id: cvId };
      list.push(record);
    }
    record.data = data;
    record.template = template;
    record.updated = Date.now();
    writeCVList(list);
  }

  var data = loadData();

  var template = "Classic";
  try {
    template = localStorage.getItem("mycv-template") || "Classic";
  } catch (error) {}
  templateSelect.value = template;
  if (templateSelect.value !== template) {       // unknown name: fall back
    template = "Classic";
    templateSelect.value = template;
  }

  // A saved CV that was given a different template on the template page
  var openRecord = findRecord(readCVList());
  if (openRecord && openRecord.template !== template) {
    saveData();
  }

  /* ----------------------------------------------------------
     3. Small helpers
     ---------------------------------------------------------- */

  // Makes text safe to place inside HTML
  function esc(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function paragraph(text) {
    if (!text || text.trim() === "") return "";
    return "<p>" + esc(text.trim()).replace(/\n/g, "<br>") + "</p>";
  }

  function section(title, body) {
    if (!body) return "";
    return '<div class="c-h">' + esc(title) + "</div>" + body;
  }

  // Turns a list of entries (education, jobs, ...) into CV text
  function entries(list, wrap) {
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var item = list[i];

      // Years: either one box ("2022 - Now") or start year + end year
      var years = item.years || "";
      if (item.start || item.end) {
        years = [item.start, item.end].filter(Boolean).join(" - ");
      }

      // Work experience: month + year, like "Mar 2022 - Present"
      if (item.startMonth || item.startYear || item.endMonth || item.endYear) {
        var from = [item.startMonth, item.startYear].filter(Boolean).join(" ");
        var to = item.endMonth === "Present"
          ? "Present"
          : [item.endMonth, item.endYear].filter(Boolean).join(" ");
        years = [from, to].filter(Boolean).join(" - ");
      }

      // Place: the school or company, then city and country if they are filled in,
      // then the company link
      var place = [item.place, item.city, item.country].filter(Boolean).join(", ");
      if (item.link) place = [place, item.link].filter(Boolean).join(" \u00b7 ");

      var hasDetails = item.rich ? hasText(item.details) : !!item.details;
      if (!item.title && !place && !years && !hasDetails) continue;
      var one = '<div class="c-item"><b>' + esc(item.title) + "</b><span>" + esc(years) + "</span></div>";
      if (place) one += '<p class="c-place">' + esc(place) + "</p>";
      if (item.rich) {
        // text written with the font / bold / bullet buttons
        if (hasText(item.details)) one += '<div class="c-rich">' + cleanHtml(item.details) + "</div>";
      } else {
        one += paragraph(item.details);
      }
      // the five newer templates put a box around every entry
      html += wrap ? '<div class="c-entry">' + one + "</div>" : one;
    }
    return html;
  }

  function skillList() {
    var parts = data.skills.split(",");
    var clean = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].trim() !== "") clean.push(esc(parts[i].trim()));
    }
    return clean;
  }

  function initials() {
    var words = data.name.trim().split(/\s+/);
    var letters = "";
    for (var i = 0; i < words.length && letters.length < 2; i++) {
      if (words[i]) letters += words[i].charAt(0).toUpperCase();
    }
    return letters;
  }

  /* ----------------------------------------------------------
     4. Draw the CV on the right
     ---------------------------------------------------------- */

  // Builds the CV as HTML in the design of one template
  function buildCV(templateName) {
    if (NEW_TEMPLATES.indexOf(templateName) !== -1) {
      return buildNewCV(templateName);
    }

    var head =
      '<div class="c-name">' + esc(data.name || "Your Name") + "</div>" +
      (data.title ? '<div class="c-role">' + esc(data.title) + "</div>" : "");

    var contactParts = [];
    if (data.email) contactParts.push(esc(data.email));
    if (data.phone) contactParts.push(esc((data.phoneCode + " " + data.phone).trim()));

    // District, Province, Country become one address line
    var place = [];
    if (data.district) place.push(data.district.trim());
    if (data.province) place.push(data.province.trim());
    if (data.country) place.push(data.country.trim());
    if (place.length) contactParts.push(esc(place.join(", ")));
    if (data.link) contactParts.push(esc(data.link));

    var contactLine = contactParts.length
      ? '<div class="c-contact">' + contactParts.join(" &middot; ") + "</div>" : "";
    var contactSide = contactParts.length
      ? section("Contact", "<p>" + contactParts.join("<br>") + "</p>") : "";

    var skills = skillList();
    var skillsLine = skills.length ? section("Skills", "<p>" + skills.join(" &middot; ") + "</p>") : "";
    var skillsSide = skills.length ? section("Skills", "<p>" + skills.join("<br>") + "</p>") : "";

    var objective = section("Career Objective", paragraph(data.objective));
    var education = section("Education", entries(data.education));
    var experience = section("Work Experience", entries(data.experience));
    var projects = section("Projects", entries(data.projects));
    var certifications = section("Certifications", entries(data.certifications));

    // Sections that the person added
    var custom = "";
    for (var i = 0; i < data.custom.length; i++) {
      var extra = data.custom[i];
      if (!extra.title && !extra.details) continue;
      custom += section(extra.title || "New Section", paragraph(extra.details) || "<p></p>");
    }

    // The profile photo. Without one, the side-panel templates show the initials.
    var hasPhoto = data.photo !== "";
    var photo = hasPhoto
      ? '<div class="c-photo"><img src="' + esc(data.photo) + '" alt=""></div>'
      : '<div class="c-photo">' + esc(initials()) + "</div>";

    // Name, job title and contact line, with the photo on the right if there is one
    var top = hasPhoto
      ? '<div class="c-top"><div class="c-top-text">' + head + contactLine + "</div>" + photo + "</div>"
      : head + contactLine;

    var rule = '<div class="c-rule"></div>';
    var html;

    if (templateName === "Modern") {
      html =
        '<div class="c-side">' + photo + contactSide + skillsSide + "</div>" +
        '<div class="c-main">' + head + objective + education + experience + projects + certifications + custom + "</div>";
    } else if (templateName === "Creative") {
      html =
        '<div class="c-main">' + head + objective + education + experience + projects + certifications + custom + "</div>" +
        '<div class="c-side">' + photo + contactSide + skillsSide + "</div>";
    } else if (templateName === "Executive") {
      html =
        '<div class="c-band">' + top + "</div>" +
        '<div class="c-body">' + objective + education + experience + skillsLine + projects + certifications + custom + "</div>";
    } else if (templateName === "Elegant") {
      html =
        (hasPhoto ? photo : "") + head + contactLine + rule +
        '<div class="c-cols">' +
          '<div class="c-col">' + objective + education + skillsLine + certifications + "</div>" +
          '<div class="c-col">' + experience + projects + custom + "</div>" +
        "</div>";
    } else if (templateName === "Minimal") {
      html = top + objective + education + experience + skillsLine + projects + certifications + custom;
    } else {
      html = top + rule + objective + education + experience + skillsLine + projects + certifications + custom;
    }

    return html;
  }

  /* ----------------------------------------------------------
     4b. The ten newer templates:
     Timeline, Swiss Grid, Sage Sidebar, Header Band, Mono Index (professional)
     Noir Gold, Vertical Name, Bento Tiles, Orbit, Front Page (creative)
     ---------------------------------------------------------- */
  var NEW_TEMPLATES = [
    "Timeline", "Swiss Grid", "Sage Sidebar", "Header Band", "Mono Index",
    "Noir Gold", "Vertical Name", "Bento Tiles", "Orbit", "Front Page"
  ];

  // A section with its own box, so each template can style it
  function box(key, title, body) {
    if (!body) return "";
    return '<section class="c-sec c-sec-' + key + '">' +
             '<div class="c-h">' + esc(title) + "</div>" +
             '<div class="c-sec-body">' + body + "</div>" +
           "</section>";
  }

  function buildNewCV(templateName) {
    var name = '<div class="c-name">' + esc(data.name || "Your Name") + "</div>";
    var role = data.title ? '<div class="c-role">' + esc(data.title) + "</div>" : "";

    // Contact details, each with a label (the Sage Sidebar shows the labels)
    var contact = [];
    if (data.phone) contact.push(["Phone", (data.phoneCode + " " + data.phone).trim()]);
    if (data.email) contact.push(["Email", data.email]);
    var place = [data.district, data.province, data.country].filter(Boolean).join(", ");
    if (place) contact.push(["Location", place]);
    if (data.link) contact.push(["Website", data.link]);

    var contactRows = "";
    var contactLabelled = "";
    var contactInline = [];
    for (var c = 0; c < contact.length; c++) {
      contactRows += "<div>" + esc(contact[c][1]) + "</div>";
      contactLabelled += '<div><div class="x-label">' + contact[c][0] + "</div><div>" + esc(contact[c][1]) + "</div></div>";
      contactInline.push(esc(contact[c][1]));
    }

    var skills = skillList();
    var skillsLine = skills.length ? box("skills", "Skills", "<p>" + skills.join(" &middot; ") + "</p>") : "";
    var skillsChips = skills.length
      ? box("skills", "Skills", '<div class="c-chips"><span>' + skills.join("</span><span>") + "</span></div>") : "";
    var skillsRows = skills.length
      ? box("skills", "Skills", '<div class="c-skill-list"><div>' + skills.join("</div><div>") + "</div></div>") : "";

    var objective = box("objective", "Career Objective", paragraph(data.objective));
    var education = box("education", "Education", entries(data.education, true));
    var experience = box("exp", "Work Experience", entries(data.experience, true));
    var projects = box("projects", "Projects", entries(data.projects, true));
    var certifications = box("certs", "Certifications", entries(data.certifications, true));

    var custom = "";
    for (var i = 0; i < data.custom.length; i++) {
      var extra = data.custom[i];
      if (!extra.title && !extra.details) continue;
      custom += box("custom", extra.title || "New Section", paragraph(extra.details) || "<p></p>");
    }

    var hasPhoto = data.photo !== "";
    var photo = hasPhoto
      ? '<div class="c-photo"><img src="' + esc(data.photo) + '" alt=""></div>'
      : '<div class="c-photo">' + esc(initials()) + "</div>";
    var photoIfAny = hasPhoto ? photo : "";

    if (templateName === "Timeline") {
      return (
        '<div class="x-head">' + photoIfAny +
          '<div class="x-head-main">' + name + role + "</div>" +
          '<div class="x-contact">' + contactRows + "</div>" +
        "</div>" +
        '<div class="x-cols">' +
          '<div class="x-col x-col-wide">' + objective + experience + projects + custom + "</div>" +
          '<div class="x-col">' + education + skillsChips + certifications + "</div>" +
        "</div>"
      );
    }

    if (templateName === "Swiss Grid") {
      return (
        '<div class="x-head">' +
          '<div class="x-head-main">' + name +
            '<div class="x-sub">' + role + '<div class="x-contact">' + contactInline.join(" &nbsp;/&nbsp; ") + "</div></div>" +
          "</div>" + photoIfAny +
        "</div>" +
        objective + experience + education + skillsLine + projects + certifications + custom
      );
    }

    if (templateName === "Sage Sidebar") {
      return (
        '<div class="x-side">' +
          '<div class="x-side-top">' + photo + name + role + "</div>" +
          '<div class="x-side-body">' +
            (contactLabelled ? box("contact", "Personal Details", '<div class="x-kvs">' + contactLabelled + "</div>") : "") +
            skillsRows + certifications +
          "</div>" +
        "</div>" +
        '<div class="x-main">' + objective + experience + education + projects + custom + "</div>"
      );
    }

    if (templateName === "Header Band") {
      return (
        '<div class="x-band">' +
          '<div class="x-head-main">' + name + role + "</div>" +
          (hasPhoto ? photo : '<div class="x-tag">Curriculum Vitae</div>') +
        "</div>" +
        (contactRows ? '<div class="x-strip">' + contactRows + "</div>" : "") +
        '<div class="x-cols">' +
          '<div class="x-col x-col-wide">' + objective + experience + projects + custom + "</div>" +
          '<div class="x-col">' + education + skillsChips + certifications + "</div>" +
        "</div>"
      );
    }

    var contactTile = contactLabelled
      ? box("contact", "Personal Details", '<div class="x-kvs">' + contactLabelled + "</div>") : "";

    if (templateName === "Noir Gold") {
      return (
        '<div class="x-hero">' +
          '<div class="x-kicker">Curriculum Vitae</div>' + photoIfAny + name + role +
          '<div class="x-rule"></div>' +
          '<div class="x-contact">' + contactRows + "</div>" +
        "</div>" +
        '<div class="x-cols">' +
          '<div class="x-col">' + education + skillsRows + certifications + "</div>" +
          '<div class="x-divider"></div>' +
          '<div class="x-col x-col-wide">' + objective + experience + projects + custom + "</div>" +
        "</div>"
      );
    }

    if (templateName === "Vertical Name") {
      return (
        '<div class="x-band">' + name + "</div>" +
        '<div class="x-main">' +
          '<div class="x-head">' +
            '<div class="x-head-main">' + role + '<div class="x-contact">' + contactRows + "</div></div>" + photoIfAny +
          "</div>" +
          objective +
          '<div class="x-cols">' +
            '<div class="x-col x-col-wide">' + experience + projects + custom + "</div>" +
            '<div class="x-col">' + education + skillsChips + certifications + "</div>" +
          "</div>" +
        "</div>"
      );
    }

    if (templateName === "Bento Tiles") {
      return (
        '<div class="x-col x-col-wide">' +
          '<div class="x-hero">' +
            '<div class="x-head-main"><div class="x-kicker">Curriculum Vitae</div>' + name + role + "</div>" + photoIfAny +
          "</div>" +
          objective + experience + projects + custom +
        "</div>" +
        '<div class="x-col">' + contactTile + skillsChips + education + certifications + "</div>"
      );
    }

    if (templateName === "Orbit") {
      return (
        '<div class="x-orb"></div><div class="x-ring"></div>' +
        '<div class="x-top">' +
          '<div class="x-id">' + name + role + photoIfAny + "</div>" +
          '<div class="x-intro">' +
            '<div class="x-contact">' + contactRows + "</div>" +
            '<div class="x-rule"></div>' + objective +
          "</div>" +
        "</div>" +
        '<div class="x-cols">' +
          '<div class="x-col">' + skillsRows + certifications + "</div>" +
          '<div class="x-col x-col-wide">' + experience + education + projects + custom + "</div>" +
        "</div>"
      );
    }

    if (templateName === "Front Page") {
      // the bar under the name: job title, then contact details without the location
      var barRows = "";
      for (var b = 0; b < contact.length; b++) {
        if (contact[b][0] !== "Location") barRows += "<div>" + esc(contact[b][1]) + "</div>";
      }
      var intro = paragraph(data.objective);
      return (
        '<div class="x-masthead"><div>Curriculum Vitae</div><div>' + esc(place) + "</div>" +
          "<div>Edition " + new Date().getFullYear() + "</div></div>" +
        name +
        '<div class="x-bar">' + role + barRows + "</div>" +
        (intro ? box("objective", "Career Objective", photoIfAny + intro) : photoIfAny) +
        '<div class="x-cols">' +
          '<div class="x-col x-col-wide">' + experience + projects + custom + "</div>" +
          '<div class="x-divider"></div>' +
          '<div class="x-col">' + education + skillsRows + certifications + "</div>" +
        "</div>"
      );
    }

    // Mono Index
    return (
      '<div class="x-head">' + photoIfAny +
        '<div class="x-head-main"><div class="x-kicker">// curriculum vitae</div>' + name + role + "</div>" +
        '<div class="x-contact">' + contactRows + "</div>" +
      "</div>" +
      objective + experience + projects +
      '<div class="x-three">' + education + skillsRows + certifications + "</div>" +
      custom
    );
  }

  // The class names that give a template its design, like "thumb t-swiss-grid x-tpl"
  function templateClass(templateName) {
    var cls = "thumb t-" + templateName.toLowerCase().replace(/\s+/g, "-");
    if (NEW_TEMPLATES.indexOf(templateName) !== -1) cls += " x-tpl";
    return cls;
  }

  // Updates the CV on the right
  function renderCV() {
    cvPage.className = templateClass(template);
    cvPage.innerHTML = buildCV(template);
  }

  function chooseTemplate(name) {
    template = name;
    templateSelect.value = name;               // keep the drop-down list in step
    try {
      localStorage.setItem("mycv-template", template);
    } catch (error) {}
    if (findRecord(readCVList())) saveData();    // keep the choice with the saved CV
    renderCV();
  }

  // Make one whole CV page fit in the space on the right,
  // so the person sees it without scrolling
  function fitCV() {
    var byWidth = (stage.clientWidth - 32) / 600;       // the CV page is 600px wide
    var byHeight = (stage.clientHeight - 32) / 848;     // and 848px tall
    var stacked = window.matchMedia("(max-width: 640px)").matches;
    var scale = stacked ? byWidth : Math.min(byWidth, byHeight);
    scale = Math.max(0.3, Math.min(scale, 1.4));
    cvBox.style.setProperty("--s", scale.toFixed(3));
  }

  /* ----------------------------------------------------------
     5. Draw the entry boxes in the form (education, jobs, ...)
     ---------------------------------------------------------- */
  function renderList(listName) {
    var labels = LISTS[listName];
    var holder = editor.querySelector('.entry-list[data-list="' + listName + '"]');
    var list = data[listName];
    var html = "";

    for (var i = 0; i < list.length; i++) {
      var id = listName + "-" + i;
      html += '<div class="entry">';
      html += '<div class="entry-head"><span>' + labels.name + " " + (i + 1) + "</span>" +
              '<button type="button" class="remove-btn" data-remove="' + listName + '" data-index="' + i + '">Remove</button></div>';

      html += field(id + "-title", labels.title, listName, i, "title", list[i].title, false);

      if (labels.start) {
        // Education: school, then Address (city + country), then start year + end year
        html += field(id + "-place", labels.place, listName, i, "place", list[i].place, false);
        html += '<div class="entry-sub">Address</div>';
        html += '<div class="field-row">' +
                  field(id + "-city", labels.city, listName, i, "city", list[i].city, false) +
                  field(id + "-country", labels.country, listName, i, "country", list[i].country, false) +
                "</div>";
        html += '<div class="field-row">' +
                  field(id + "-start", labels.start, listName, i, "start", list[i].start, false) +
                  field(id + "-end", labels.end, listName, i, "end", list[i].end, false) +
                "</div>";
      } else if (labels.startMonth) {
        // Work experience: company + link, then start date and end date
        html += '<div class="field-row">' +
                  field(id + "-place", labels.place, listName, i, "place", list[i].place, false) +
                  field(id + "-link", labels.link, listName, i, "link", list[i].link, false) +
                "</div>";
        html += '<div class="entry-sub">Start date</div>';
        html += '<div class="field-row">' +
                  monthField(id + "-startMonth", labels.startMonth, listName, i, "startMonth", list[i].startMonth, false) +
                  field(id + "-startYear", labels.startYear, listName, i, "startYear", list[i].startYear, false) +
                "</div>";
        html += '<div class="entry-sub">End date</div>';
        html += '<div class="field-row">' +
                  monthField(id + "-endMonth", labels.endMonth, listName, i, "endMonth", list[i].endMonth, true) +
                  field(id + "-endYear", labels.endYear, listName, i, "endYear", list[i].endYear, false) +
                "</div>";
      } else if (labels.place && labels.years) {
        html += '<div class="field-row">' +
                  field(id + "-place", labels.place, listName, i, "place", list[i].place, false) +
                  field(id + "-years", labels.years, listName, i, "years", list[i].years, false) +
                "</div>";
      }
      if (labels.details && labels.rich) {
        html += richField(id + "-details", labels.details, listName, i, "details", list[i].details);
      } else if (labels.details) {
        html += field(id + "-details", labels.details, listName, i, "details", list[i].details, true);
      }
      html += "</div>";
    }
    holder.innerHTML = html;
  }

  // One label + one box
  function field(id, label, listName, index, key, value, isLong) {
    var attrs = 'id="' + id + '" data-list="' + listName + '" data-index="' + index + '" data-key="' + key + '"';
    var box = isLong
      ? "<textarea " + attrs + ' rows="3">' + esc(value) + "</textarea>"
      : '<input type="text" ' + attrs + ' value="' + esc(value) + '">';
    return '<div class="field"><label for="' + id + '">' + label + "</label>" + box + "</div>";
  }

  /* ----------------------------------------------------------
     Text box with a toolbar: font, size, bold, italic, underline, bullets
     ---------------------------------------------------------- */
  var FONTS = ["Manrope", "Georgia", "Arial", "Times New Roman", "Courier New"];
  var FONT_NAMES = ["Default", "Georgia", "Arial", "Times New Roman", "Typewriter"];

  function richField(id, label, listName, index, key, value) {
    var fontOptions = '<option value="">Font</option>';
    for (var f = 0; f < FONTS.length; f++) {
      fontOptions += '<option value="' + FONTS[f] + '">' + FONT_NAMES[f] + "</option>";
    }
    return '<div class="field">' +
      '<span class="field-label" id="' + id + '-label">' + label + "</span>" +
      '<div class="rich">' +
        '<div class="rich-bar" data-for="' + id + '">' +
          '<select class="rich-select" data-rich-cmd="fontName" aria-label="Font">' + fontOptions + "</select>" +
          '<select class="rich-select" data-rich-cmd="fontSize" aria-label="Text size">' +
            '<option value="">Size</option><option value="2">Small</option><option value="3">Normal</option><option value="4">Large</option>' +
          "</select>" +
          '<button type="button" class="rich-btn" data-cmd="bold" aria-label="Bold"><b>B</b></button>' +
          '<button type="button" class="rich-btn" data-cmd="italic" aria-label="Italic"><i>I</i></button>' +
          '<button type="button" class="rich-btn" data-cmd="underline" aria-label="Underline"><u>U</u></button>' +
          '<button type="button" class="rich-btn rich-btn-wide" data-cmd="insertUnorderedList">&bull; Bullets</button>' +
        "</div>" +
        '<div class="rich-box" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="' + id + '-label" ' +
          'id="' + id + '" data-rich="yes" data-list="' + listName + '" data-index="' + index + '" data-key="' + key + '">' +
          cleanHtml(value) +
        "</div>" +
      "</div></div>";
  }

  // Keeps only the safe tags (bold, italic, underline, lists, font) in the text
  var ALLOWED_TAGS = ["B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "BR", "DIV", "P", "SPAN", "FONT"];

  function cleanHtml(html) {
    var holder = document.createElement("template");
    holder.innerHTML = html || "";
    cleanNode(holder.content);
    return holder.innerHTML;
  }

  function cleanNode(parent) {
    var children = Array.prototype.slice.call(parent.childNodes);
    for (var i = 0; i < children.length; i++) {
      var node = children[i];
      if (node.nodeType === 3) continue;                       // plain text is fine
      if (node.nodeType !== 1) { parent.removeChild(node); continue; }

      var tag = node.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") { parent.removeChild(node); continue; }

      cleanNode(node);

      if (ALLOWED_TAGS.indexOf(tag) === -1) {
        // not allowed: keep the words, drop the tag
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
        continue;
      }

      // remove every attribute, except a font name or size we offer
      var face = node.getAttribute("face");
      var size = node.getAttribute("size");
      while (node.attributes.length) node.removeAttribute(node.attributes[0].name);
      if (tag === "FONT") {
        if (face && FONTS.indexOf(face) !== -1) node.setAttribute("face", face);
        if (size === "2" || size === "3" || size === "4") node.setAttribute("size", size);
      }
    }
  }

  // True when the formatted text contains real words
  function hasText(html) {
    var holder = document.createElement("div");
    holder.innerHTML = cleanHtml(html);
    return holder.textContent.trim() !== "";
  }

  // One label + one drop-down list of months.
  // The end month also offers "Present" for a job the person still has.
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function monthField(id, label, listName, index, key, value, withPresent) {
    var options = '<option value="">Month</option>';
    if (withPresent) {
      options += '<option value="Present"' + (value === "Present" ? " selected" : "") + ">Present (still working here)</option>";
    }
    for (var m = 0; m < MONTHS.length; m++) {
      options += '<option value="' + MONTHS[m] + '"' + (value === MONTHS[m] ? " selected" : "") + ">" + MONTHS[m] + "</option>";
    }
    return '<div class="field"><label for="' + id + '">' + label + "</label>" +
           '<select id="' + id + '" data-list="' + listName + '" data-index="' + index + '" data-key="' + key + '">' +
           options + "</select></div>";
  }

  // Put the saved values into the fixed boxes (name, email, objective, ...)
  function fillSimpleFields() {
    var boxes = editor.querySelectorAll("[data-field]");
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].value = data[boxes[i].getAttribute("data-field")] || "";
    }
  }

  // The round photo at the top of Personal Details
  function showPhotoInForm() {
    var preview = document.getElementById("photo-preview");
    if (data.photo) {
      preview.innerHTML = '<img src="' + esc(data.photo) + '" alt="Your profile photo">';
    } else {
      preview.textContent = initials();
    }
    document.getElementById("photo-remove").hidden = !data.photo;
  }

  function renderEverything() {
    showPhotoInForm();
    fillSimpleFields();
    for (var listName in LISTS) renderList(listName);
    renderCV();
  }

  /* ----------------------------------------------------------
     6. React to typing and clicking
     ---------------------------------------------------------- */

  // Typing in any box updates the data and the CV
  editor.addEventListener("input", function (event) {
    var box = event.target;
    if (!box.getAttribute) return;
    var fieldName = box.getAttribute("data-field");
    var listName = box.getAttribute("data-list");
    var isRich = box.hasAttribute("data-rich");

    if (fieldName) {
      data[fieldName] = box.value;
      if (fieldName === "name" && !data.photo) showPhotoInForm();   // update the initials
    } else if (listName) {
      var index = Number(box.getAttribute("data-index"));
      data[listName][index][box.getAttribute("data-key")] = isRich ? cleanHtml(box.innerHTML) : box.value;
    } else {
      return;
    }
    saveData();
    renderCV();
  });

  /* ----------------------------------------------------------
     Toolbar of the formatted text box
     ---------------------------------------------------------- */
  var savedRange = null;      // the words the person last selected in a formatted box

  document.addEventListener("selectionchange", function () {
    var selection = window.getSelection();
    if (!selection.rangeCount) return;
    var node = selection.anchorNode;
    var element = node && (node.nodeType === 1 ? node : node.parentNode);
    if (element && element.closest && element.closest(".rich-box")) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
  });

  // Clicking a toolbar button must not take the cursor out of the text
  editor.addEventListener("mousedown", function (event) {
    if (event.target.closest(".rich-btn")) event.preventDefault();
  });

  // Runs one toolbar command (bold, bullets, font, ...) on the box it belongs to
  function runRichCommand(bar, command, value) {
    var box = document.getElementById(bar.getAttribute("data-for"));
    if (!box) return;
    box.focus();
    if (savedRange && box.contains(savedRange.commonAncestorContainer)) {
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
    try {
      document.execCommand("styleWithCSS", false, false);
      document.execCommand(command, false, value || null);
    } catch (error) {
      // This browser does not support the command. The text stays as it is.
    }
    var index = Number(box.getAttribute("data-index"));
    data[box.getAttribute("data-list")][index][box.getAttribute("data-key")] = cleanHtml(box.innerHTML);
    saveData();
    renderCV();
  }

  // Font and size lists
  editor.addEventListener("change", function (event) {
    var list = event.target;
    var command = list.getAttribute && list.getAttribute("data-rich-cmd");
    if (!command || list.value === "") return;
    runRichCommand(list.closest(".rich-bar"), command, list.value);
    list.value = "";                           // back to "Font" / "Size"
  });

  editor.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;

    // B / I / U / Bullets buttons
    if (button.getAttribute("data-cmd")) {
      runRichCommand(button.closest(".rich-bar"), button.getAttribute("data-cmd"));
      return;
    }

    // "+ Add ..." buttons, including "+ Add Section"
    var addTo = button.getAttribute("data-add");
    if (addTo) {
      data[addTo].push({ title: "", place: "", years: "", details: "", city: "", country: "", start: "", end: "",
        link: "", startMonth: "", startYear: "", endMonth: "", endYear: "",
        rich: LISTS[addTo].rich === true
      });
      renderList(addTo);
      saveData();
      renderCV();
      // Put the cursor in the new entry's first box
      var newBox = document.getElementById(addTo + "-" + (data[addTo].length - 1) + "-title");
      if (newBox) newBox.focus();
      return;
    }

    // "Remove" buttons
    var removeFrom = button.getAttribute("data-remove");
    if (removeFrom) {
      data[removeFrom].splice(Number(button.getAttribute("data-index")), 1);
      renderList(removeFrom);
      saveData();
      renderCV();
      return;
    }

    // "Remove photo"
    if (button.id === "photo-remove") {
      data.photo = "";
      photoInput.value = "";
      saveData();
      showPhotoInForm();
      renderCV();
      return;
    }

    // "Clear all fields"
    if (button.id === "clear-btn") {
      data = emptyData();
      saveData();
      renderEverything();
    }
  });

  /* ----------------------------------------------------------
     6b. Profile photo
     The person picks a picture. It is cut to a square and made
     small (320 x 320) so it loads fast and can be saved.
     ---------------------------------------------------------- */
  var photoInput = document.getElementById("photo-input");
  var photoMessage = document.getElementById("photo-message");

  photoInput.addEventListener("change", function () {
    var file = photoInput.files[0];
    if (!file) return;

    photoMessage.className = "form-message";
    if (file.type.indexOf("image/") !== 0) {
      photoMessage.textContent = "That file is not a picture. Please choose a JPG or PNG photo.";
      photoMessage.className = "form-message error";
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      var image = new Image();
      image.onload = function () {
        // Cut the middle square out of the picture
        var side = Math.min(image.width, image.height);
        var canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 320;
        canvas.getContext("2d").drawImage(
          image,
          (image.width - side) / 2, (image.height - side) / 2, side, side,
          0, 0, 320, 320
        );
        data.photo = canvas.toDataURL("image/jpeg", 0.85);
        saveData();
        showPhotoInForm();
        renderCV();
      };
      image.onerror = function () {
        photoMessage.textContent = "This picture could not be opened. Please try another photo.";
        photoMessage.className = "form-message error";
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // Changing the template with the drop-down list
  templateSelect.addEventListener("change", function () {
    chooseTemplate(templateSelect.value);
  });

  // 7. Download button: opens the print window, where the person
  //    chooses "Save as PDF". Only the CV is printed (see style.css).
  function downloadCV() {
    var oldTitle = document.title;
    document.title = (data.name.trim() || "My") + " CV";   // becomes the file name
    window.print();
    document.title = oldTitle;
  }

  document.getElementById("download-btn").addEventListener("click", downloadCV);

  // 8. Save CV buttons (top bar and bottom of the form):
  //    put the CV in the My CVs folder and show a short message.
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(text) {
    document.getElementById("toast-text").textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.hidden = true;
    }, 6000);
  }

  document.addEventListener("click", function (event) {
    if (!event.target.closest("[data-save]")) return;
    saveData();
    if (findRecord(readCVList())) {
      showToast("Your CV is saved in My CVs.");
    } else {
      showToast("Your CV could not be saved in this browser.");
    }
  });

  window.addEventListener("resize", fitCV);
  if (window.ResizeObserver) {
    new ResizeObserver(fitCV).observe(stage);          // also when the side panel changes size
  }

  // Start
  renderEverything();
  fitCV();

  // Opened with the Download button on the My CVs page (create.html#download):
  // start the download once the page and its fonts are ready.
  if (window.location.hash === "#download") {
    try {
      history.replaceState(null, "", window.location.pathname);
    } catch (error) {}
    var startDownload = function () {
      setTimeout(downloadCV, 400);
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(startDownload);
    } else {
      startDownload();
    }
  }
});