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
        const mainContainer = document.querySelector('.faq-body'); // 🔄 Now targeting the main container

        // THE SMART PARSER: Detects links and Drive files automatically
        function formatContent(text) {
            if (!text) return '';

            // 1. TOKENIZE: Protect Markdown links from being broken apart by space-splitting
            const markdownPlaceholders = [];
            let tokenizedText = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, linkText, url) => {
                const htmlLink = `<a href="${url}" target="_blank" style="color: #509E2F; text-decoration: underline; font-weight: 600;">${linkText}</a>`;
                markdownPlaceholders.push(htmlLink);
                // Return a temporary string with no spaces
                return `__MARKDOWN_LINK_TOKEN_${markdownPlaceholders.length - 1}__`;
            });

            // 2. PROCESS WORDS: Split the remaining text safely by spaces
            const words = tokenizedText.split(/(\s+)/); 
            
            const processedWords = words.map(word => {
                if (!word.trim()) return word;

                // Skip processing if this is our protected markdown placeholder
                if (word.startsWith('__MARKDOWN_LINK_TOKEN_')) return word;

                // Detect Google Drive Links
                if (word.includes('drive.google.com/file/d/')) {
                    const match = word.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                        const fileId = match[1];
                        return `<img src="https://drive.google.com/thumbnail?id=${fileId}&sz=w800" style="max-width: 100%; border-radius: 8px; margin-top: 12px; margin-bottom: 12px; display: block; border: 1px solid #E8E9E5;" alt="FAQ visual">`;
                    }
                }
                
                // Detect normal loose image links (ending in png, jpg)
                if (word.match(/\.(jpeg|jpg|gif|png)(\?.*)?$/i) && word.startsWith('http')) {
                    return `<img src="${word}" style="max-width: 100%; border-radius: 8px; margin-top: 12px; margin-bottom: 12px; display: block; border: 1px solid #E8E9E5;" alt="FAQ visual">`;
                }
                
                // Detect loose web links and make them clickable
                if (word.startsWith('http://') || word.startsWith('https://')) {
                    return `<a href="${word}" target="_blank" style="color: #509E2F; text-decoration: underline; font-weight: 600; word-break: break-all;">${word}</a>`;
                }
                
                return word;
            });

            // Rejoin everything back into a single string
            let finalHTML = processedWords.join('');

            // 3. RESTORE: Swap the placeholder tokens back out for your rich HTML links
            markdownPlaceholders.forEach((htmlLink, index) => {
                finalHTML = finalHTML.replace(`__MARKDOWN_LINK_TOKEN_${index}__`, htmlLink);
            });

            return finalHTML;
        }

        faqData.forEach(item => {
            const sheetCategory = item.category.trim();
            let catKey = categoryMap[sheetCategory];

            if (!catKey) {
                catKey = sheetCategory.toLowerCase().replace(/[^a-z0-9]/g, '-');
                categoryMap[sheetCategory] = catKey;

                const tabHTML = `<div class="tab" data-target="${catKey}">${sheetCategory}</div>`;
                tabsContainer.insertAdjacentHTML('beforeend', tabHTML);

                // 🔄 Safely injects new sections at the bottom of the main container
                const sectionHTML = `
                  <div class="faq-section" data-category="${catKey}" style="display: none;">
                    <div class="faq-section-label" style="margin-top:20px;">${sheetCategory}</div>
                  </div>
                `;
                mainContainer.insertAdjacentHTML('beforeend', sectionHTML);
            }

            const section = document.querySelector(`.faq-section[data-category="${catKey}"]`);

            if (section) {
                const styles = styleMap[catKey] || styleMap['default'];
                
                // Run the answer through the Smart Parser before displaying it
                const formattedAnswer = formatContent(item.answer);
                
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