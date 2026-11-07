// ---------- Data ----------
const venues = [
    { name: "Auditorium",        capacity: 500, projector: "4K Laser Projector",  mic: "Wireless handheld + podium + lapel", ac: "Central AC" },
    { name: "Mini Seminar Hall", capacity: 120, projector: "Full HD Projector",   mic: "2 wireless handheld mics",           ac: "Split AC" },
    { name: "Smart Classroom",   capacity: 60,  projector: "Interactive Smartboard", mic: "1 collar mic",                    ac: "Split AC" },
    { name: "Conference Room",   capacity: 20,  projector: "Wall-mounted LED Display", mic: "Tabletop conference mic",      ac: "Split AC" }
];

const timeSlots = [
    "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00",
    "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00"
];

// Each booking: { student, event, venue, date, slot, attendance, equipment, status }
// status is "pending" (just requested) or "reserved" (approved)
let bookings = JSON.parse(localStorage.getItem("campusBookings2")) || [];
let selectedSlot = "";

// ---------- Page elements ----------
const bookingForm = document.getElementById("bookingForm");
const bookingList = document.getElementById("bookingList");
const message = document.getElementById("message");
const venueSelect = document.getElementById("venue");
const dateInput = document.getElementById("bookingDate");
const slotGrid = document.getElementById("slotGrid");
const venueDirectory = document.getElementById("venueDirectory");
const venueDetails = document.getElementById("venueDetails");

const today = new Date().toISOString().split("T")[0];
dateInput.min = today;

function findVenue(name) {
    return venues.find(function (v) { return v.name === name; });
}

// ---------- Venue directory + details card ----------
function showVenueDetails(name) {
    const v = findVenue(name);

    document.querySelectorAll(".venue").forEach(function (el) {
        el.classList.toggle("active", el.dataset.name === name);
    });

    venueDetails.innerHTML = "";
    venueDetails.hidden = false;

    const title = document.createElement("h3");
    title.textContent = v.name;
    venueDetails.appendChild(title);

    const specs = [
        ["Seating Capacity", v.capacity + " people"],
        ["Projector", v.projector],
        ["Mic System", v.mic],
        ["Air Conditioning", v.ac]
    ];

    const list = document.createElement("dl");
    specs.forEach(function (s) {
        const dt = document.createElement("dt");
        dt.textContent = s[0];
        const dd = document.createElement("dd");
        dd.textContent = s[1];
        list.appendChild(dt);
        list.appendChild(dd);
    });
    venueDetails.appendChild(list);
}

function buildVenues() {
    venues.forEach(function (v) {
        const card = document.createElement("article");
        card.className = "venue";
        card.dataset.name = v.name;
        card.tabIndex = 0;

        const h3 = document.createElement("h3");
        h3.textContent = v.name;
        const p = document.createElement("p");
        p.textContent = "Capacity: " + v.capacity + " people";
        card.appendChild(h3);
        card.appendChild(p);

        card.addEventListener("click", function () { showVenueDetails(v.name); });
        card.addEventListener("keydown", function (e) {
            if (e.key === "Enter") showVenueDetails(v.name);
        });
        venueDirectory.appendChild(card);

        const option = document.createElement("option");
        option.value = v.name;
        option.textContent = v.name;
        venueSelect.appendChild(option);
    });

    venueDetails.hidden = true;
}

// ---------- Slot grid ----------
function slotStatus(venue, date, slot) {
    const found = bookings.find(function (b) {
        return b.venue === venue && b.date === date && b.slot === slot;
    });
    return found ? found.status : "available";
}

function showSlots() {
    slotGrid.innerHTML = "";
    selectedSlot = "";

    if (!venueSelect.value || !dateInput.value) {
        slotGrid.innerHTML = '<p class="hint">Choose a venue and date to see slots.</p>';
        return;
    }

    timeSlots.forEach(function (slot) {
        const status = slotStatus(venueSelect.value, dateInput.value, slot);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "slot " + status;
        button.textContent = slot;

        if (status === "available") {
            button.addEventListener("click", function () {
                selectedSlot = slot;
                document.querySelectorAll(".slot").forEach(function (s) {
                    s.classList.remove("selected");
                });
                button.classList.add("selected");
                message.textContent = "";
            });
        } else {
            button.disabled = true;
            button.title = status === "pending" ? "Waiting for approval" : "Already reserved";
        }

        slotGrid.appendChild(button);
    });
}

venueSelect.addEventListener("change", function () {
    if (venueSelect.value) showVenueDetails(venueSelect.value);
    showSlots();
});
dateInput.addEventListener("change", showSlots);

// ---------- Booking list ----------
function showBookings() {
    document.getElementById("bookingCount").textContent = bookings.length;
    document.getElementById("pendingCount").textContent =
        bookings.filter(function (b) { return b.status === "pending"; }).length;

    if (bookings.length === 0) {
        bookingList.textContent = "No bookings yet.";
        return;
    }

    bookingList.innerHTML = "";

    bookings.forEach(function (booking, index) {
        const item = document.createElement("div");
        item.className = "booking-item";

        const details = document.createElement("div");
        details.className = "booking-details";

        const line1 = document.createElement("strong");
        line1.textContent = booking.event + " at " + booking.venue;

        const line2 = document.createElement("span");
        line2.textContent =
            booking.date + ", " + booking.slot + " | " +
            booking.student + " | " + booking.attendance + " people";

        const line3 = document.createElement("span");
        line3.textContent = "AV: " +
            (booking.equipment.length ? booking.equipment.join(", ") : "None");

        details.appendChild(line1);
        details.appendChild(line2);
        details.appendChild(line3);

        const badge = document.createElement("span");
        badge.className = "badge " + booking.status;
        badge.textContent = booking.status === "pending" ? "Pending" : "Reserved";

        const actions = document.createElement("div");
        actions.className = "actions";

        const cancel = document.createElement("button");
        cancel.textContent = "Cancel";
        cancel.className = "cancel-button";
        cancel.addEventListener("click", function () { cancelBooking(index); });
        actions.appendChild(cancel);

        item.appendChild(details);
        item.appendChild(badge);
        item.appendChild(actions);
        bookingList.appendChild(item);
    });
}

function saveBookings() {
    localStorage.setItem("campusBookings2", JSON.stringify(bookings));
    showBookings();
    showSlots();
}

// ---------- Submit a request ----------
bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const venueName = venueSelect.value;
    const date = dateInput.value;
    const attendance = Number(document.getElementById("attendance").value);

    if (date < today) {
        message.textContent = "You cannot select a past date. Please choose today or a future date.";
        return;
    }

    if (!selectedSlot) {
        message.textContent = "Please click an available time slot.";
        return;
    }

    const venue = findVenue(venueName);
    if (attendance > venue.capacity) {
        message.textContent =
            venue.name + " seats " + venue.capacity + " people. Reduce attendance or pick a bigger venue.";
        return;
    }

    if (slotStatus(venueName, date, selectedSlot) !== "available") {
        message.textContent = "That slot was just taken. Please choose another.";
        showSlots();
        return;
    }

    const equipment = Array.from(
        document.querySelectorAll('input[name="av"]:checked')
    ).map(function (box) { return box.value; });

    bookings.push({
        student: document.getElementById("studentName").value.trim(),
        event: document.getElementById("eventName").value.trim(),
        venue: venueName,
        date: date,
        slot: selectedSlot,
        attendance: attendance,
        equipment: equipment,
        status: "pending"
    });

    saveBookings();
    bookingForm.reset();
    selectedSlot = "";
    showSlots();
    message.textContent = "Request sent! It is pending approval.";
});

// Not wired to any button now. Kept for a future admin page
// (or call approveBooking(0) in the browser console to test).
function approveBooking(index) {
    bookings[index].status = "reserved";
    saveBookings();
    message.textContent = "Booking approved.";
}

function cancelBooking(index) {
    bookings.splice(index, 1);
    saveBookings();
    message.textContent = "Booking cancelled.";
}

// ---------- Start ----------
buildVenues();
showBookings();