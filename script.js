document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ GOOGLE APPS SCRIPT WEB APP URL
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
        "default": { icon: "ti-help", color: "icon-green" } 
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

    // 2. RENDER THE DATA INTO HTML
    function renderFAQs(faqData) {
        const tabsContainer = document.querySelector('.faq-category-tabs');
        const mainContainer = document.querySelector('.faq-body'); 

        // THE SMART PARSER: Detects links and Drive files automatically
        // THE SMART PARSER: Cleaner, safer, and won't break your links!
        function formatContent(text) {
            if (!text) return '';
            
            // Force it to be a string just in case Google Sheets sends a number
            let html = String(text);

            // 1. Detect Google Drive Links and turn them into image thumbnails
            html = html.replace(/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)(?:\/[^\s]*)?/g, (match, fileId) => {
                return `<img src="https://drive.google.com/thumbnail?id=${fileId}&sz=w800" style="max-width: 100%; border-radius: 8px; margin-top: 12px; margin-bottom: 12px; display: block; border: 1px solid #E8E9E5;" alt="FAQ visual">`;
            });

            // 2. Convert Markdown links into clean, clickable HTML: [Click Here](https://...)
            html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, linkText, url) => {
                return `<a href="${url}" target="_blank" style="color: #509E2F; text-decoration: underline; font-weight: 600;">${linkText}</a>`;
            });

            // 3. Safely preserve paragraph line breaks from your Google Sheet
            html = html.replace(/\n/g, '<br>');

            return html;
        }

        faqData.forEach(item => {
            const sheetCategory = item.category.trim();
            let catKey = categoryMap[sheetCategory];

            // If it's a completely brand new category not in our map setup
            if (!catKey) {
                catKey = sheetCategory.toLowerCase().replace(/[^a-z0-9]/g, '-');
                categoryMap[sheetCategory] = catKey;
            }

            // 🔥 FIX: If the tab & section don't exist in Claude's clean box yet, build them dynamically!
            if (!document.querySelector(`.tab[data-target="${catKey}"]`)) {
                
                // Don't duplicate the 'All' tab if it's already there
                if (catKey !== 'all') {
                    const tabHTML = `<div class="tab" data-target="${catKey}">${sheetCategory}</div>`;
                    tabsContainer.insertAdjacentHTML('beforeend', tabHTML);
                }

                const sectionHTML = `
                  <div class="faq-section" data-category="${catKey}" style="display: none;">
                    <div class="faq-section-label" style="margin-top:20px; font-weight:700; color:#509E2F; font-size:12px; letter-spacing:1px; margin-bottom:15px;">${sheetCategory}</div>
                  </div>
                `;
                mainContainer.insertAdjacentHTML('beforeend', sectionHTML);
            }

            const section = document.querySelector(`.faq-section[data-category="${catKey}"]`);

            if (section) {
                const styles = styleMap[catKey] || styleMap['default'];
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
        if (searchBar) {
            searchBar.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                
                if (query.length > 0) {
                    tabs.forEach(t => t.classList.remove('active'));
                    const allTab = document.querySelector('.tab[data-target="all"]');
                    if(allTab) allTab.classList.add('active'); 
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

        // Auto-click 'All' tab to display everything beautifully on first launch
        const initialTab = document.querySelector('.tab[data-target="all"]');
        if (initialTab) {
            initialTab.click();
        }

        // --- CHAT MESSAGES LOGIC ---
        const chatInput = document.getElementById('chatInput');
        const sendChatBtn = document.getElementById('sendChatBtn');
        const chatMessages = document.getElementById('chatMessages');
        
        let chatHistory = []; // This array acts as GEM's short-term memory!

        async function handleUserMessage() {
            const messageText = chatInput.value.trim();
            if (!messageText) return; 

            // 1. Show user message
            chatMessages.insertAdjacentHTML('beforeend', `<div class="message user-message">${messageText}</div>`);
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // 2. Show thinking state
            const thinkingId = 'thinking-' + Date.now();
            chatMessages.insertAdjacentHTML('beforeend', `<div class="message gem-message" id="${thinkingId}"><i>GEM is thinking... 🤖</i></div>`);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // 3. Send request to your Apps Script Web App
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    // Sending as text/plain prevents CORS preflight errors in Google Apps Script
                    body: JSON.stringify({ 
                        message: messageText, 
                        history: chatHistory 
                    })
                });

                const data = await response.json();
                
                // Remove thinking bubble safely
                const thinkingElement = document.getElementById(thinkingId);
                if (thinkingElement) thinkingElement.remove();
                
                // 🚨 CHECK FOR BACKEND ERRORS BEFORE PROCEEDING
                if (data.error) {
                    console.error("GOOGLE APPS SCRIPT ERROR:", data.error);
                    chatMessages.insertAdjacentHTML('beforeend', `<div class="message gem-message" style="color:red;"><i>Backend error: ${data.error}</i></div>`);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    return; // Stop the function here
                }

                if (!data.reply) {
                    throw new Error("No reply received from server.");
                }

                // Clean up Gemini's markdown formatting
                const formattedReply = data.reply
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
                
                // Show real answer
                chatMessages.insertAdjacentHTML('beforeend', `<div class="message gem-message">${formattedReply}</div>`);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // 5. Save the interaction to memory
                chatHistory.push({ role: 'user', text: messageText });
                chatHistory.push({ role: 'model', text: data.reply });

                // Keep memory light
                if(chatHistory.length > 6) chatHistory = chatHistory.slice(-6);

            } catch (error) {
                console.error("Chat Error:", error);
                const thinkingElement = document.getElementById(thinkingId);
                if (thinkingElement) thinkingElement.remove();
                
                chatMessages.insertAdjacentHTML('beforeend', `<div class="message gem-message" style="color:red;"><i>Oops! My connection dropped. Can you try asking again?</i></div>`);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        // Trigger message send via button or Enter key
        if (sendChatBtn && chatInput) {
            sendChatBtn.addEventListener('click', handleUserMessage);
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleUserMessage();
            });
        }

    // --- CHAT WIDGET TOGGLE ---
        const chatFab = document.querySelector('.ask-gem-fab');
        const chatWidget = document.getElementById('chatWidget');
        const closeChatBtn = document.getElementById('closeChatBtn');

        if (chatFab && chatWidget && closeChatBtn) {
            chatFab.addEventListener('click', () => {
                chatWidget.classList.add('open');
            });

            closeChatBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevents the FAB click from refiring immediately
                chatWidget.classList.remove('open');
            });
        }
    }

    // Run the fetch
    fetchFAQData();
});