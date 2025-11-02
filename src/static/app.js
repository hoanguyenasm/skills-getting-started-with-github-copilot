document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: create initials from email
  function initialsFromEmail(email) {
    const name = email.split('@')[0].replace(/[_.\-]/g, ' ').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    const initials = (parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : (parts[0] && parts[0][1] ? parts[0][1] : ''));
    return (initials || '?').toUpperCase();
  }

  // Helper: build a participant list item
  function createParticipantLi(email) {
    const li = document.createElement("li");
    li.className = "participant-item";
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.textContent = initialsFromEmail(email);
    const span = document.createElement("span");
    span.className = "participant-email";
    span.textContent = email;
    li.appendChild(avatar);
    li.appendChild(span);
    return li;
  }

  // Function to fetch activities from API and render them (now includes participants)
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset dropdown to single default option
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activity = name;

        const spotsLeft = details.max_participants - details.participants.length;

        // Build base content (include a span for spots so we can update it later)
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
        `;

        // Participants section
        const participantsUl = document.createElement("ul");
        participantsUl.className = "participants-list";

        if (!details.participants || details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "participant-item no-participants";
          li.textContent = "No participants yet — be the first!";
          participantsUl.appendChild(li);
        } else {
          details.participants.forEach((email) => {
            participantsUl.appendChild(createParticipantLi(email));
          });
        }

        activityCard.appendChild(participantsUl);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission (also update the UI on success)
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Update the corresponding activity card in the UI
        const card = document.querySelector(`.activity-card[data-activity="${CSS.escape(activity)}"]`);
        if (card) {
          const ul = card.querySelector(".participants-list");
          // Remove "no participants" placeholder if present
          const np = ul.querySelector(".no-participants");
          if (np) np.remove();
          // Append new participant
          ul.appendChild(createParticipantLi(email));
          // Decrement spots-left value
          const spotsSpan = card.querySelector(".spots-left");
          if (spotsSpan) {
            const current = parseInt(spotsSpan.textContent, 10);
            if (!Number.isNaN(current)) spotsSpan.textContent = Math.max(0, current - 1);
          }
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
