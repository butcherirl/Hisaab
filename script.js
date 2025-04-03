document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const milkForm = document.getElementById('milk-form');
    const dateInput = document.getElementById('date');
    const quantityInput = document.getElementById('quantity');
    const rateInput = document.getElementById('rate');
    const paidInput = document.getElementById('paid');
    const entriesBody = document.getElementById('entries-body');
    const totalQuantityEl = document.getElementById('total-quantity');
    const totalAmountEl = document.getElementById('total-amount');
    const totalDueEl = document.getElementById('total-due');
    const noEntriesMessage = document.getElementById('no-entries');
    const clearAllButton = document.getElementById('clear-all');
    const themeToggleButton = document.getElementById('theme-toggle');
    const languageSelect = document.getElementById('language-select');

    // --- Translations ---
    const translations = {
        en: {
            title: "Milk Hisaab",
            toggle_theme: "Toggle Theme",
            add_entry: "Add New Entry",
            date: "Date",
            quantity: "Quantity (Liters)",
            rate: "Rate (per Liter)",
            paid_status: "Paid",
            add_button: "Add Entry",
            summary: "Summary",
            total_quantity: "Total Quantity",
            total_amount: "Total Amount",
            total_due: "Total Due (Unpaid)",
            clear_all_data: "Clear All Data",
            entries: "Entries",
            quantity_short: "Qty (L)",
            rate_short: "Rate (₹/L)",
            amount: "Amount (₹)",
            actions: "Actions",
            delete: "Delete",
            paid: "Paid",
            unpaid: "Unpaid",
            no_entries_yet: "No entries yet. Add one above!",
            footer_opensource: "This is an open-source tool.",
            footer_localstorage: "All data is stored locally in your browser only. No data is sent to any server.",
            confirm_clear: "Are you sure you want to delete all entries? This cannot be undone.",
            confirm_delete_entry: "Are you sure you want to delete this entry?",
        },
        hi: {
            title: "दूध हिसाब",
            toggle_theme: "थीम बदलें",
            add_entry: "नई एंट्री जोड़ें",
            date: "तारीख:",
            quantity: "मात्रा (लीटर):",
            rate: "दर (प्रति लीटर):",
            paid_status: "भुगतान किया:",
            add_button: "एंट्री जोड़ें",
            summary: "सारांश",
            total_quantity: "कुल मात्रा",
            total_amount: "कुल राशि",
            total_due: "कुल बकाया (अदत्त)",
            clear_all_data: "सारा डेटा साफ़ करें",
            entries: "एंट्रीज़",
            quantity_short: "मात्रा (L)",
            rate_short: "दर (₹/L)",
            amount: "राशि (₹)",
            actions: "कार्रवाई",
            delete: "हटाएं",
            paid: "भुगतान किया",
            unpaid: "अदत्त",
            no_entries_yet: "अभी तक कोई एंट्री नहीं है। ऊपर एक जोड़ें!",
            footer_opensource: "यह एक ओपन-सोर्स टूल है।",
            footer_localstorage: "सारा डेटा केवल आपके ब्राउज़र में स्थानीय रूप से संग्रहीत होता है। किसी भी सर्वर पर कोई डेटा नहीं भेजा जाता है।",
            confirm_clear: "क्या आप वाकई सभी प्रविष्टियाँ हटाना चाहते हैं? इसे पूर्ववत नहीं किया जा सकता।",
            confirm_delete_entry: "क्या आप वाकई इस प्रविष्टि को हटाना चाहते हैं?",
        }
    };

    // --- State ---
    let milkEntries = [];
    let currentLanguage = 'en';
    let currentTheme = 'light';

    // --- Local Storage Keys ---
    const ENTRIES_KEY = 'milkHisaabEntries';
    const LANGUAGE_KEY = 'milkHisaabLanguage';
    const THEME_KEY = 'milkHisaabTheme';

    // --- Functions ---

    // Load data from Local Storage
    function loadData() {
        const storedEntries = localStorage.getItem(ENTRIES_KEY);
        if (storedEntries) {
            milkEntries = JSON.parse(storedEntries);
        }
        const storedLang = localStorage.getItem(LANGUAGE_KEY);
        if (storedLang && translations[storedLang]) {
            currentLanguage = storedLang;
        }
        const storedTheme = localStorage.getItem(THEME_KEY);
        if (storedTheme) {
            currentTheme = storedTheme;
        }
    }

    // Save data to Local Storage
    function saveData() {
        localStorage.setItem(ENTRIES_KEY, JSON.stringify(milkEntries));
    }

    // Save preferences to Local Storage
    function savePreferences() {
        localStorage.setItem(LANGUAGE_KEY, currentLanguage);
        localStorage.setItem(THEME_KEY, currentTheme);
    }

    // Apply translations
    function applyTranslations() {
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translations[currentLanguage] && translations[currentLanguage][key]) {
                // Handle specific elements like title or inputs if needed
                if (el.tagName === 'TITLE') {
                    el.textContent = translations[currentLanguage][key];
                } else if (el.placeholder) {
                     el.placeholder = translations[currentLanguage][key];
                }
                 else {
                    el.textContent = translations[currentLanguage][key];
                }
            }
        });
        // Update dynamic elements like table headers/buttons if they weren't rendered yet
        renderEntries(); // Re-render to apply translations to dynamic parts
        languageSelect.value = currentLanguage; // Sync dropdown
        document.documentElement.lang = currentLanguage; // Set html lang attribute
    }

    // Apply theme
    function applyTheme() {
        document.body.classList.toggle('dark-theme', currentTheme === 'dark');
        themeToggleButton.setAttribute('aria-label', currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
         // You might want to update the button text/icon here too if not using emojis
    }

    // Render milk entries in the table
    function renderEntries() {
        entriesBody.innerHTML = ''; // Clear existing rows

        if (milkEntries.length === 0) {
            noEntriesMessage.style.display = 'block';
            entriesBody.innerHTML = ''; // Ensure table is empty
        } else {
            noEntriesMessage.style.display = 'none';
            // Sort entries by date (newest first)
            const sortedEntries = [...milkEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

            sortedEntries.forEach((entry, index) => {
                const row = document.createElement('tr');
                const amount = (entry.quantity * entry.rate).toFixed(2);

                row.innerHTML = `
                    <td>${entry.date}</td>
                    <td>${entry.quantity}</td>
                    <td>${entry.rate.toFixed(2)}</td>
                    <td>${amount}</td>
                    <td>
                        <span
                            class="paid-status-toggle ${entry.paid ? 'paid' : 'unpaid'}"
                            data-index="${milkEntries.indexOf(entry)}" <!-- Use original index for modification -->
                            tabindex="0"
                            role="button"
                            aria-pressed="${entry.paid}"
                            title="Click to toggle status"
                         >
                            ${entry.paid ? translations[currentLanguage].paid : translations[currentLanguage].unpaid}
                        </span>
                    </td>
                    <td>
                        <button class="delete-btn" data-index="${milkEntries.indexOf(entry)}">
                            ${translations[currentLanguage].delete}
                        </button>
                    </td>
                `;
                entriesBody.appendChild(row);
            });
        }
        updateSummary();
    }

    // Update summary calculations
    function updateSummary() {
        let totalQty = 0;
        let totalAmt = 0;
        let totalDueAmt = 0;

        milkEntries.forEach(entry => {
            const amount = entry.quantity * entry.rate;
            totalQty += parseFloat(entry.quantity);
            totalAmt += amount;
            if (!entry.paid) {
                totalDueAmt += amount;
            }
        });

        totalQuantityEl.textContent = totalQty.toFixed(2); // Use toFixed for consistency
        totalAmountEl.textContent = totalAmt.toFixed(2);
        totalDueEl.textContent = totalDueAmt.toFixed(2);
    }

    // Add new milk entry
    function addEntry(e) {
        e.preventDefault(); // Prevent form submission

        const date = dateInput.value;
        const quantity = parseFloat(quantityInput.value);
        const rate = parseFloat(rateInput.value);
        const paid = paidInput.checked;

        if (!date || isNaN(quantity) || quantity <= 0 || isNaN(rate) || rate < 0) {
            alert('Please fill in all fields with valid values.');
            return;
        }

        const newEntry = {
            id: Date.now(), // Simple unique ID
            date,
            quantity,
            rate,
            paid
        };

        milkEntries.push(newEntry);
        saveData();
        renderEntries();
        milkForm.reset(); // Clear the form
        dateInput.valueAsDate = new Date(); // Reset date to today after adding
    }

    // Delete milk entry
    function deleteEntry(index) {
        const confirmDelete = confirm(translations[currentLanguage].confirm_delete_entry);
        if (confirmDelete) {
            milkEntries.splice(index, 1);
            saveData();
            renderEntries();
        }
    }

     // Toggle paid status
    function togglePaidStatus(index) {
        if (index >= 0 && index < milkEntries.length) {
            milkEntries[index].paid = !milkEntries[index].paid;
            saveData();
            renderEntries(); // Re-render to update status text and summary
        }
    }

    // Clear all data
    function clearAllEntries() {
        const confirmClear = confirm(translations[currentLanguage].confirm_clear);
        if (confirmClear) {
            milkEntries = [];
            saveData();
            renderEntries();
        }
    }

    // Handle clicks within the entries table (for delete buttons and status toggles)
    function handleTableClick(e) {
        if (e.target.classList.contains('delete-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'), 10);
            deleteEntry(index);
        } else if (e.target.classList.contains('paid-status-toggle')) {
             const index = parseInt(e.target.getAttribute('data-index'), 10);
             togglePaidStatus(index);
        }
    }

     // Handle keypress on paid status toggle for accessibility
    function handleTableKeypress(e) {
        if (e.key === 'Enter' || e.key === ' ') {
             if (e.target.classList.contains('paid-status-toggle')) {
                e.preventDefault(); // Prevent scrolling on spacebar
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                togglePaidStatus(index);
            }
        }
    }

    // Toggle theme
    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme();
        savePreferences();
    }

    // Change language
    function changeLanguage() {
        currentLanguage = languageSelect.value;
        applyTranslations();
        savePreferences();
    }

    // --- Event Listeners ---
    milkForm.addEventListener('submit', addEntry);
    entriesBody.addEventListener('click', handleTableClick);
    entriesBody.addEventListener('keypress', handleTableKeypress); // For accessibility
    clearAllButton.addEventListener('click', clearAllEntries);
    themeToggleButton.addEventListener('click', toggleTheme);
    languageSelect.addEventListener('change', changeLanguage);

    // --- Initialization ---
    loadData(); // Load existing data and preferences
    applyTheme(); // Apply loaded theme
    applyTranslations(); // Apply loaded language and render initial state
    dateInput.valueAsDate = new Date(); // Set default date to today

});
