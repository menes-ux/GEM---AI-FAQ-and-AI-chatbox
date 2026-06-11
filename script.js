document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE:
    const API_URL = 'https://script.google.com/macros/s/AKfycbzvZdNKo6W3WP28RUNXobzMUmNyMSnjLkdVH_nn67gGaCrHzFRwfthW5kYjdSXWMQd3/exec';

    // Map the Google Sheet categories to your HTML data-category attributes
    const categoryMap = {
        "Application Info": "application",
        "Platform Support": "platform",
        "Document Rules": "documents",
        "Recruitment & Pipeline": "recruitment",
        "Employment & Benefits": "employment"
    };

    // Map specific icons and colors to each category
    const styleMap = {
        "application": { icon: "ti-user-check", color: "icon-green" },
        "platform": { icon: "ti-settings", color: "icon-gold" },
        "documents": { icon: "ti-file-certificate", color: "icon-navy" },
        "recruitment": { icon: "ti-git-branch", color: "icon-red" },
        "employment": { icon: "ti-cash", color: "icon-green" },
        "default": { icon: "ti-help", color: "icon-green" } // The fallback style for new categories
    };

    // 1. FETCH DATA FROM GOOGLE SHEETS
    async function fetchFAQData() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            renderFAQs(data);
            initializeInteractions(); 
        } catch (error) {
            console.error("Error fetching FAQ data:", error);
        }
    }

    // 2. RENDER THE DATA INTO HTML (NOW FULLY DYNAMIC)
    function renderFAQs(faqData) {
        const tabsContainer = document.querySelector('.faq-category-tabs');
        const highlightBox = document.querySelector('.faq-highlight-box');

        // This little function turns raw URLs into clickable green links automatically!
        function linkify(text) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            return text.replace(urlRegex, function(url) {
                return `<a href="${url}" target="_blank" style="color: #509E2F; text-decoration: underline; font-weight: 600;">${url}</a>`;
            });
        }

        faqData.forEach(item => {
            const sheetCategory = item.category.trim();
            let catKey = categoryMap[sheetCategory];

            if (!catKey) {
                catKey = sheetCategory.toLowerCase().replace(/[^a-z0-9]/g, '-');
                categoryMap[sheetCategory] = catKey;

                const tabHTML = `<div class="tab" data-target="${catKey}">${sheetCategory}</div>`;
                tabsContainer.insertAdjacentHTML('beforeend', tabHTML);

                const sectionHTML = `
                  <div class="faq-section" data-category="${catKey}" style="display: none;">
                    <div class="faq-section-label" style="margin-top:20px;">${sheetCategory}</div>
                  </div>
                `;
                highlightBox.insertAdjacentHTML('beforebegin', sectionHTML);
            }

            const section = document.querySelector(`.faq-section[data-category="${catKey}"]`);

            if (section) {
                const styles = styleMap[catKey] || styleMap['default'];
                
                // We pass the answer through our new linkify function here
                const formattedAnswer = linkify(item.answer);
                
                const faqHTML = `
                  <div class="faq-item">
                    <div class="faq-item-header">
                      <div class="faq-item-icon ${styles.color}"><i class="ti ${styles.icon}"></i></div>
                      <span class="faq-question">${item.question}</span>
                      <i class="ti ti-chevron-down faq-chevron"></i>
                    </div>
                    <div class="faq-answer">${formattedAnswer}</div>
                  </div>
                `;
                section.insertAdjacentHTML('beforeend', faqHTML);
            }
        });
    }

    // 3. INITIALIZE UI INTERACTIONS 
    function initializeInteractions() {
        const faqItems = document.querySelectorAll('.faq-item');
        const faqSections = document.querySelectorAll('.faq-section');
        const tabs = document.querySelectorAll('.tab');
        const searchBar = document.querySelector('.faq-search-bar');
        const searchInputText = document.querySelector('.search-text');

        // Accordion Setup
        faqItems.forEach(item => {
            const header = item.querySelector('.faq-item-header');
            header.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                faqItems.forEach(i => i.classList.remove('open'));
                if (!isOpen) item.classList.add('open');
            });
        });

        // Tabs Setup
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const targetCategory = tab.getAttribute('data-target');

                faqSections.forEach(section => {
                    const sectionCategory = section.getAttribute('data-category');
                    if (targetCategory === 'all' || targetCategory === sectionCategory) {
                        section.style.display = 'block';
                        section.querySelectorAll('.faq-item').forEach(i => i.style.display = 'block');
                    } else {
                        section.style.display = 'none';
                    }
                });
            });
        });

        // Search Setup
        if (searchBar && searchInputText) {
            const inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.placeholder = 'Search a question, e.g. "visa", "salary", "deadline"...';
            inputField.style.cssText = "border:none; outline:none; width:100%; font-size:13px; font-family:'Montserrat',sans-serif; color:#353735; background:transparent;";

            searchInputText.replaceWith(inputField);

            inputField.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                
                if (query.length > 0) {
                    tabs.forEach(t => t.classList.remove('active'));
                    tabs[0].classList.add('active'); 
                }

                faqSections.forEach(section => {
                    let sectionHasMatches = false;
                    const items = section.querySelectorAll('.faq-item');

                    items.forEach(item => {
                        const question = item.querySelector('.faq-question').textContent.toLowerCase();
                        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();

                        if (question.includes(query) || answer.includes(query)) {
                            item.style.display = 'block';
                            sectionHasMatches = true;
                        } else {
                            item.style.display = 'none';
                        }
                    });

                    section.style.display = sectionHasMatches ? 'block' : 'none';
                });
            });
        }
    }

    // Run the fetch
    fetchFAQData();
});