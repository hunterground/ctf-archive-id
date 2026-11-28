document.addEventListener('DOMContentLoaded', () => {   
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const loadingIndicator = document.getElementById('loading-indicator');
    const hiddenSelect = document.getElementById('server-select');
    const selectSelected = document.getElementById('select-selected');
    const selectItems = document.getElementById('select-items');
    const flagForm = document.getElementById('flag-form');
    const flagInput = document.getElementById('flag-input');
    const flagResultMessage = document.getElementById('flag-result-message');

    let conversationHistory = [];

    async function setupCustomSelect() {
        try {
            const response = await fetch('/api/servers');
            const servers = await response.json();
            
            if (servers.length === 0) return;

            hiddenSelect.innerHTML = '';
            selectItems.innerHTML = '';


            servers.forEach((server, index) => {
                const realOption = document.createElement('option');
                realOption.value = server.id;
                realOption.textContent = server.name;
                hiddenSelect.appendChild(realOption);

                const customOption = document.createElement('div');
                customOption.textContent = server.name;
                customOption.setAttribute('data-value', server.id);
                selectItems.appendChild(customOption);

                customOption.addEventListener('click', function(e) {
                    e.stopPropagation(); 
                    selectSelected.textContent = this.textContent;
                    hiddenSelect.value = this.getAttribute('data-value');
                    selectItems.classList.add('select-hide');
                });

                if (index === 0) {
                    selectSelected.textContent = server.name;
                    hiddenSelect.value = server.id;
                }
            });

        } catch (error) {
            console.error('Failed to fetch servers:', error);
            selectSelected.textContent = 'Error loading servers';
        }
    }

    selectSelected.addEventListener('click', (e) => {
        e.stopPropagation();
        selectItems.classList.toggle('select-hide');
    });


    document.addEventListener('click', () => {
        selectItems.classList.add('select-hide');
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = messageInput.value.trim();
        const serverId = hiddenSelect.value; 

        if (!userInput) return;

        addMessage('user', userInput);
        messageInput.value = '';
        loadingIndicator.classList.remove('hidden');
        chatForm.querySelector('button').disabled = true;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userInput,
                    serverId: serverId,
                    history: conversationHistory,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with status: ${response.status}`);
            }

            const data = await response.json();
            const furinaMessage = data.message.find(m => m.role === 'Furina');

            if (furinaMessage) {
                addMessage('model', furinaMessage.message);
                conversationHistory.push({ role: "user", parts: [{ text: userInput }] });
                conversationHistory.push({ role: "model", parts: [{ text: furinaMessage.message }] });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            addMessage('system', `Sorry, something went wrong: ${error.message}`);
        } finally {
            loadingIndicator.classList.add('hidden');
            chatForm.querySelector('button').disabled = false;
            messageInput.focus();
        }
    });


    function addMessage(role, text) {
        const messageElement = document.createElement('div');
        const roleClass = role === 'model' ? 'furina' : role;
        messageElement.classList.add('message', roleClass);
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.parentElement.scrollTop = chatMessages.parentElement.scrollHeight;
    }

    flagForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const flagValue = flagInput.value.trim();
        if (!flagValue) return;

        try {
            const response = await fetch('/api/validate-flag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ flag: flagValue })
            });

            const result = await response.json();
            flagResultMessage.textContent = result.message;
            flagResultMessage.style.display = 'block';

            flagResultMessage.classList.remove('correct', 'incorrect');
            if (result.valid) {
                flagResultMessage.classList.add('correct');
            } else {
                flagResultMessage.classList.add('incorrect');
            }

        } catch (error) {
            console.error('Error validating flag:', error);
            flagResultMessage.textContent = 'An error occurred. Please try again later.';
            flagResultMessage.style.display = 'block';
            flagResultMessage.classList.remove('correct');
            flagResultMessage.classList.add('incorrect');
        }
    });

    setupCustomSelect();
});