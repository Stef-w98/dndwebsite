document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('dateInput');
    const datePickerPopup = document.getElementById('datePickerPopup');
    const calendarHeader = document.getElementById('calendarHeader');
    const calendarBody = document.getElementById('calendarBody');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const prevYearButton = document.getElementById('prevYear');
    const nextYearButton = document.getElementById('nextYear');

    const calendarData = {
        year_len: 374,
        events: 1,
        n_months: 5,
        months: ["Hiems", "Vernalis", "Aestas", "Autumnus", "Nix"],
        month_len: { Hiems: 62, Vernalis: 62, Aestas: 62, Autumnus: 62, Nix: 64 },
        week_len: 7,
        weekdays: ["Unala", "Duala", "Trelana", "Quattoria", "Quinquiria", "Sextala", "Septala"],
        n_moons: 3,
        moons: ["Lux", "Tace", "Clara"],
        lunar_cyc: { Lux: 12, Tace: 29, Clara: 48 },
        lunar_shf: { Lux: 0, Tace: 0, Clara: 0 },
        year: 1043,
        first_day: 0,
        notes: {}
    };

    let currentMonthIndex = 2;
    let currentYear = calendarData.year;

    dateInput.addEventListener('click', () => {
        datePickerPopup.style.display = 'block';
        drawCalendar(currentMonthIndex, currentYear);
    });

    prevMonthButton.addEventListener('click', () => {
        if (currentMonthIndex === 0) {
            currentMonthIndex = calendarData.n_months - 1;
            currentYear--;
        } else {
            currentMonthIndex--;
        }
        drawCalendar(currentMonthIndex, currentYear);
    });

    nextMonthButton.addEventListener('click', () => {
        if (currentMonthIndex === calendarData.n_months - 1) {
            currentMonthIndex = 0;
            currentYear++;
        } else {
            currentMonthIndex++;
        }
        drawCalendar(currentMonthIndex, currentYear);
    });

    prevYearButton.addEventListener('click', () => {
        currentYear--;
        drawCalendar(currentMonthIndex, currentYear);
    });

    nextYearButton.addEventListener('click', () => {
        currentYear++;
        drawCalendar(currentMonthIndex, currentYear);
    });

    function drawCalendar(monthIndex, year) {
        const monthName = calendarData.months[monthIndex];
        const daysInMonth = calendarData.month_len[monthName];
        const firstDay = (calendarData.first_day + getDaysUpToMonth(monthIndex, year)) % calendarData.week_len;

        calendarHeader.textContent = `${monthName} ${year}`;
        calendarBody.innerHTML = '';

        let row = document.createElement('tr');
        for (let i = 0; i < calendarData.weekdays.length; i++) {
            const cell = document.createElement('th');
            cell.textContent = calendarData.weekdays[i];
            row.appendChild(cell);
        }
        calendarBody.appendChild(row);

        row = document.createElement('tr');
        for (let i = 0; i < firstDay; i++) {
            const cell = document.createElement('td');
            row.appendChild(cell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            if (row.children.length === calendarData.week_len) {
                calendarBody.appendChild(row);
                row = document.createElement('tr');
            }
            const cell = document.createElement('td');
            cell.textContent = day;
            cell.addEventListener('click', () => {
                dateInput.value = `${monthName} ${day}, ${year}`;
                console.log(`Date selected: ${dateInput.value}`);
                const event = new Event('change');
                dateInput.dispatchEvent(event);
                datePickerPopup.style.display = 'none';
            });
            row.appendChild(cell);
        }

        while (row.children.length < calendarData.week_len) {
            const cell = document.createElement('td');
            row.appendChild(cell);
        }
        calendarBody.appendChild(row);
    }

    function getDaysUpToMonth(monthIndex, year) {
        let days = 0;
        for (let i = 0; i < monthIndex; i++) {
            days += calendarData.month_len[calendarData.months[i]];
        }
        return days + (year - calendarData.year) * calendarData.year_len;
    }

    function getCurrentDate() {
        const currentDate = dateInput.value;
        console.log(`Current date from date picker: ${currentDate}`);
        return currentDate;
    }

    window.getCurrentDate = getCurrentDate; // Make it globally accessible if needed
});
