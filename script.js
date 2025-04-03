document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const themeToggleButton = document.getElementById('theme-toggle');
    const languageSelect = document.getElementById('language-select');
    const defaultRateInput = document.getElementById('default-rate');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const monthTableBody = document.getElementById('month-table-body');
    const noDataMessage = document.getElementById('no-data-month');
    // Summary Elements
    const totalMornQtyEl = document.getElementById('total-morn-qty');
    const totalEveQtyEl = document.getElementById('total-eve-qty');
    const totalQuantityEl = document.getElementById('total-quantity');
    const totalAmountEl = document.getElementById('total-amount');
    const totalPaidAmountEl = document.getElementById('total-paid-amount');
    const totalDueAmountEl = document.getElementById('total-due-amount');

    // --- Translations ---
    const translations = {
        en: {
            title: "Milk Hisaab",
            default_rate_label: "Default Rate (₹/L):",
            date_short: "Date",
            morning_qty_short: "Morn Qty (L)",
            evening_qty_short: "Eve Qty (L)",
            rate_short: "Rate (₹)",
            total_short: "Total (₹)",
            paid_status: "Paid?",
            paid: "Paid",
            unpaid: "Unpaid",
            month_summary: "Month Summary",
            total_morn_qty: "Total Morn Qty:",
            total_eve_qty: "Total Eve Qty:",
            total_quantity: "Total Quantity:",
            total_amount: "Total Amount:",
            total_paid: "Total Paid:",
            total_due: "Total Due:",
            no_data_for_month: "No data recorded for this month yet.",
            footer_opensource: "Open-source tool by the community.",
            footer_localstorage: "All data is stored securely in your browser's local storage only.",
            // Month names needed for display
            month_names: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        },
        hi: {
            title: "दूध हिसाब",
            default_rate_label: "डिफ़ॉल्ट दर (₹/L):",
            date_short: "तारीख",
            morning_qty_short: "सुबह मात्रा (L)",
            evening_qty_short: "शाम मात्रा (L)",
            rate_short: "दर (₹)",
            total_short: "कुल (₹)",
            paid_status: "भुगतान?",
            paid: "चुका दिया",
            unpaid: "बकाया",
            month_summary: "माह सारांश",
            total_morn_qty: "कुल सुबह मात्रा:",
            total_eve_qty: "कुल शाम मात्रा:",
            total_quantity: "कुल मात्रा:",
            total_amount: "कुल राशि:",
            total_paid: "कुल भुगतान:",
            total_due: "कुल बकाया:",
            no_data_for_month: "इस महीने के लिए अभी तक कोई डेटा दर्ज नहीं किया गया है।",
            footer_opensource: "समुदाय द्वारा ओपन-सोर्स टूल।",
            footer_localstorage: "सभी डेटा केवल आपके ब्राउज़र के स्थानीय संग्रहण में सुरक्षित रूप से संग्रहीत है।",
            month_names: ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"]
        }
    };

    // --- State ---
    let currentLanguage = 'en';
    let currentTheme = 'light';
    let defaultRate = 50.00; // Default initial rate
    let monthlyData = {}; // Structure: { "YYYY-MM": { day: { mQty: 0, eQty: 0, rate: 50, paid: false }, ... } }
    let currentDisplayDate = new Date(); // Represents the month/year being viewed

    // --- Local Storage Keys ---
    const DATA_KEY = 'milkHisaabMonthlyData';
    const RATE_KEY = 'milkHisaabDefaultRate';
    const LANGUAGE_KEY = 'milkHisaabLanguage';
    const THEME_KEY = 'milkHisaabTheme';

    // --- Functions ---

    function getMonthKey(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
        return `${year}-${month}`;
    }

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate(); // Month is 0-indexed here
    }

    // Load data & preferences
    function loadData() {
        const storedData = localStorage.getItem(DATA_KEY);
        if (storedData) monthlyData = JSON.parse(storedData);

        const storedRate = localStorage.getItem(RATE_KEY);
        if (storedRate) defaultRate = parseFloat(storedRate);
        defaultRateInput.value = defaultRate.toFixed(2);

        const storedLang = localStorage.getItem(LANGUAGE_KEY);
        if (storedLang && translations[storedLang]) currentLanguage = storedLang;
        languageSelect.value = currentLanguage;

        const storedTheme = localStorage.getItem(THEME_KEY);
        if (storedTheme) currentTheme = storedTheme;
    }

    // Save data & preferences
    function saveData() {
        localStorage.setItem(DATA_KEY, JSON.stringify(monthlyData));
    }
    function savePreferences() {
        localStorage.setItem(RATE_KEY, defaultRate.toString());
        localStorage.setItem(LANGUAGE_KEY, currentLanguage);
        localStorage.setItem(THEME_KEY, currentTheme);
    }

    // Apply translations
    function applyTranslations() {
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translations[currentLanguage] && translations[currentLanguage][key]) {
                el.textContent = translations[currentLanguage][key];
            }
        });
        // Update dynamic elements based on language
        renderMonthTable(); // Re-render table for Paid/Unpaid text and month name
        document.documentElement.lang = currentLanguage;
    }

    // Apply theme
    function applyTheme() {
        document.body.classList.toggle('dark-theme', currentTheme === 'dark');
        themeToggleButton.setAttribute('aria-label', currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }

    // Calculate daily total
    function calculateDailyTotal(mQty, eQty, rate) {
        // Ensure inputs are treated as numbers, defaulting to 0 if invalid
        const morningQty = parseFloat(mQty) || 0;
        const eveningQty = parseFloat(eQty) || 0;
        const currentRate = parseFloat(rate) || 0;

        // Calculate total quantity first, then multiply by the rate
        return (morningQty + eveningQty) * currentRate;
    }

    
        // Update data for a specific day in the current month
        function updateDayData(day, field, value) {
            const monthKey = getMonthKey(currentDisplayDate);
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {}; // Initialize month if it doesn't exist
            }
            if (!monthlyData[monthKey][day]) {
                // Initialize day with defaults if it doesn't exist
                monthlyData[monthKey][day] = { mQty: 0, eQty: 0, rate: defaultRate, paid: false };
            }
    
            // Update the specific field
            if (field === 'mQty' || field === 'eQty' || field === 'rate') {
                monthlyData[monthKey][day][field] = parseFloat(value) || 0;
                 if (field === 'rate' && !value) { // If rate is cleared, revert to default
                     monthlyData[monthKey][day][field] = defaultRate;
                 }
            } else if (field === 'paid') {
                monthlyData[monthKey][day][field] = value; // Boolean
            }
    
            // Recalculate daily total for the specific row in the table
            const row = monthTableBody.querySelector(`tr[data-day="${day}"]`);
            if (row) {
                const dayData = monthlyData[monthKey][day];
                const dailyTotal = calculateDailyTotal(dayData.mQty, dayData.eQty, dayData.rate);
                const totalCell = row.querySelector('.total-cell');
                if (totalCell) {
                    totalCell.textContent = `₹${dailyTotal.toFixed(2)}`;
                }
                // Also update the rate input if it was reverted to default
                const rateInput = row.querySelector('.rate-input');
                if (rateInput && field === 'rate' && !value) {
                    rateInput.value = dayData.rate.toFixed(2);
                }
            }
    
    
            saveData(); // Save after every change
            updateMonthSummary(); // Update summary totals
        }
    
        // Render the table for the current month
        function renderMonthTable() {
            monthTableBody.innerHTML = ''; // Clear existing rows
            const year = currentDisplayDate.getFullYear();
            const month = currentDisplayDate.getMonth(); // 0-indexed
            const monthKey = getMonthKey(currentDisplayDate);
            const daysInMonth = getDaysInMonth(year, month);
            const monthData = monthlyData[monthKey] || {};
    
            // Update month display header
            const monthName = translations[currentLanguage].month_names[month];
            currentMonthDisplay.textContent = `${monthName} ${year}`;
    
            if (Object.keys(monthData).length === 0 && daysInMonth === 0) { // Check if monthData exists or if daysInMonth is valid
                 // Should not happen with valid date, but safeguard
                 noDataMessage.style.display = 'block';
                 return;
            }
    
    
            let hasData = false; // Flag to check if any data exists for the month
    
            for (let day = 1; day <= daysInMonth; day++) {
                const dayData = monthData[day] || { mQty: 0, eQty: 0, rate: defaultRate, paid: false };
                const dailyTotal = calculateDailyTotal(dayData.mQty, dayData.eQty, dayData.rate);
    
                if (dayData.mQty > 0 || dayData.eQty > 0) {
                    hasData = true; // Mark that there is data
                }
    
                const row = document.createElement('tr');
                row.setAttribute('data-day', day);
    
                // Date Cell
                const dateCell = document.createElement('td');
                dateCell.className = 'date-cell';
                dateCell.textContent = day;
                row.appendChild(dateCell);
    
                // Morning Quantity Input
                const mQtyCell = document.createElement('td');
                const mQtyInput = document.createElement('input');
                mQtyInput.type = 'number';
                mQtyInput.step = '0.1';
                mQtyInput.min = '0';
                mQtyInput.value = dayData.mQty.toFixed(1);
                mQtyInput.className = 'morn-qty-input';
                mQtyInput.setAttribute('aria-label', `Morning quantity for day ${day}`);
                mQtyInput.addEventListener('change', (e) => updateDayData(day, 'mQty', e.target.value));
                mQtyInput.addEventListener('focus', (e) => e.target.select()); // Select all on focus
                mQtyCell.appendChild(mQtyInput);
                row.appendChild(mQtyCell);
    
                // Evening Quantity Input
                const eQtyCell = document.createElement('td');
                const eQtyInput = document.createElement('input');
                eQtyInput.type = 'number';
                eQtyInput.step = '0.1';
                eQtyInput.min = '0';
                eQtyInput.value = dayData.eQty.toFixed(1);
                eQtyInput.className = 'eve-qty-input';
                eQtyInput.setAttribute('aria-label', `Evening quantity for day ${day}`);
                eQtyInput.addEventListener('change', (e) => updateDayData(day, 'eQty', e.target.value));
                eQtyInput.addEventListener('focus', (e) => e.target.select()); // Select all on focus
                eQtyCell.appendChild(eQtyInput);
                row.appendChild(eQtyCell);
    
                 // Rate Input (using day's rate or default)
                const rateCell = document.createElement('td');
                const rateInput = document.createElement('input');
                rateInput.type = 'number';
                rateInput.step = '0.01';
                rateInput.min = '0';
                rateInput.value = dayData.rate.toFixed(2);
                rateInput.className = 'rate-input';
                rateInput.setAttribute('aria-label', `Rate for day ${day}`);
                rateInput.addEventListener('change', (e) => updateDayData(day, 'rate', e.target.value));
                rateInput.addEventListener('focus', (e) => e.target.select()); // Select all on focus
                rateCell.appendChild(rateInput);
                row.appendChild(rateCell);
    
                // Total Cell
                const totalCell = document.createElement('td');
                totalCell.className = 'total-cell';
                totalCell.textContent = `₹${dailyTotal.toFixed(2)}`;
                row.appendChild(totalCell);
    
                // Paid Status Toggle
                const paidCell = document.createElement('td');
                const paidToggle = document.createElement('span');
                paidToggle.className = `paid-toggle ${dayData.paid ? 'paid' : 'unpaid'}`;
                paidToggle.textContent = dayData.paid ? translations[currentLanguage].paid : translations[currentLanguage].unpaid;
                paidToggle.setAttribute('aria-label', `Toggle paid status for day ${day}`);
                paidToggle.addEventListener('click', () => {
                    const newPaidStatus = !dayData.paid;
                    updateDayData(day, 'paid', newPaidStatus);
                    // Update toggle appearance immediately
                    paidToggle.className = `paid-toggle ${newPaidStatus ? 'paid' : 'unpaid'}`;
                    paidToggle.textContent = newPaidStatus ? translations[currentLanguage].paid : translations[currentLanguage].unpaid;
                });
                paidCell.appendChild(paidToggle);
                row.appendChild(paidCell);
    
                monthTableBody.appendChild(row);
            }
             // Show/hide no data message based on whether any data was found *after* iterating
            noDataMessage.style.display = hasData || Object.keys(monthData).length > 0 ? 'none' : 'block'; // Check monthData too in case all quantities are 0 but entry exists
            updateMonthSummary(); // Update summary after rendering
        }
    
    
        // Update the monthly summary section
        function updateMonthSummary() {
            const monthKey = getMonthKey(currentDisplayDate);
            const monthData = monthlyData[monthKey] || {};
            let totalMorn = 0;
            let totalEve = 0;
            let totalAmt = 0;
            let totalPaid = 0;
    
            for (const day in monthData) {
                const dayData = monthData[day];
                const mQty = parseFloat(dayData.mQty) || 0;
                const eQty = parseFloat(dayData.eQty) || 0;
                const rate = parseFloat(dayData.rate) || 0;
                const dailyTotal = (mQty + eQty) * rate;
    
                totalMorn += mQty;
                totalEve += eQty;
                totalAmt += dailyTotal;
                if (dayData.paid) {
                    totalPaid += dailyTotal;
                }
            }
    
            const totalQty = totalMorn + totalEve;
            const totalDue = totalAmt - totalPaid;
    
            totalMornQtyEl.textContent = totalMorn.toFixed(1);
            totalEveQtyEl.textContent = totalEve.toFixed(1);
            totalQuantityEl.textContent = totalQty.toFixed(1);
            totalAmountEl.textContent = totalAmt.toFixed(2);
            totalPaidAmountEl.textContent = totalPaid.toFixed(2);
            totalDueAmountEl.textContent = totalDue.toFixed(2);
        }
    
        // --- Event Listeners ---
    
        // Theme Toggle
        themeToggleButton.addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme();
            savePreferences();
        });
    
        // Language Select
        languageSelect.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            applyTranslations();
            savePreferences();
            // Need to re-render table for paid/unpaid text and month name
            renderMonthTable();
        });
    
        // Default Rate Change
        defaultRateInput.addEventListener('change', (e) => {
            const newRate = parseFloat(e.target.value);
            if (!isNaN(newRate) && newRate >= 0) {
                defaultRate = newRate;
                 // Update the value display to formatted number
                 e.target.value = defaultRate.toFixed(2);
                savePreferences();
                // Optionally: Ask user if they want to update existing rates for the month?
                // For simplicity, we won't auto-update existing entries. New entries/days will use the new default.
                // You could also re-render the table to reflect the new default in rate inputs where the rate hasn't been manually changed from the *previous* default. This is complex.
                // Simplest approach: Only new entries or manually changed rates reflect the update.
            } else {
                // Reset to previous valid rate if input is invalid
                e.target.value = defaultRate.toFixed(2);
            }
        });
         defaultRateInput.addEventListener('focus', (e) => e.target.select());
    
        // Month Navigation
        prevMonthButton.addEventListener('click', () => {
            currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
            renderMonthTable();
        });
    
        nextMonthButton.addEventListener('click', () => {
            currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
            renderMonthTable();
        });
    
        // --- Initialization ---
        loadData();
        applyTheme();
        applyTranslations(); // Apply initial language settings
        renderMonthTable(); // Render the current month's table on load
    
    }); // End DOMContentLoaded
    