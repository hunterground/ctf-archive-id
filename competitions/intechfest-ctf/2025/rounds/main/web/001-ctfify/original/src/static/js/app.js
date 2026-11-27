document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ctf-form');
    const loader = document.querySelector('.loader');
    const resultContainer = document.getElementById('result-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        loader.style.display = 'block';
        resultContainer.innerHTML = '';

        try {
            const response = await fetch('/', {
                method: 'POST',
                body: new URLSearchParams(new FormData(form))
            });
            
            const data = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const result = doc.querySelector('pre')?.outerHTML || 'No output';
            
            resultContainer.innerHTML = result;
        } catch (error) {
            resultContainer.innerHTML = `<pre class="error">Error: ${error.message}</pre>`;
        } finally {
            loader.style.display = 'none';
        }
    });
}); 