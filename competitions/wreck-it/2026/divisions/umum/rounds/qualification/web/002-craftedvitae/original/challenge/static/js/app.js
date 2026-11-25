// CraftedVitae - Frontend Application
(function() {
    'use strict';

    const $ = (sel) => document.querySelector(sel);
    const badge = $('#status-badge');
    const frame = $('#preview-frame');
    const templateSelect = $('#template-select');
    const sourceSelect = $('#source-select');
    const remoteGroup = $('.remote-url-group');
    const remoteInput = $('#remote-url');
    const btnPreview = $('#btn-preview');
    const btnExport = $('#btn-export');

    function setStatus(text, type) {
        badge.textContent = text;
        badge.className = 'badge' + (type ? ' ' + type : '');
    }

    // Toggle remote URL input visibility
    sourceSelect.addEventListener('change', function() {
        remoteGroup.style.display = this.value === 'remote' ? 'block' : 'none';
    });

    // Preview button
    btnPreview.addEventListener('click', function() {
        const source = sourceSelect.value;
        let url;

        if (source === 'remote') {
            const remoteURL = remoteInput.value.trim();
            if (!remoteURL) {
                setStatus('Enter a URL', 'error');
                return;
            }
            url = '/api/render?source=remote&url=' + encodeURIComponent(remoteURL);
        } else {
            const template = templateSelect.value;
            url = '/api/render?source=local&page=' + encodeURIComponent(template);
        }

        setStatus('Loading...', 'loading');
        frame.src = url;
        frame.onload = function() {
            setStatus('Ready', '');
        };
        frame.onerror = function() {
            setStatus('Error', 'error');
        };
    });

    // Export button (disabled feature - decoy)
    btnExport.addEventListener('click', function() {
        fetch('/api/export')
            .then(r => r.json())
            .then(data => {
                setStatus(data.message || 'Export unavailable', 'error');
            })
            .catch(() => {
                setStatus('Export failed', 'error');
            });
    });

    // Load default template on page load
    window.addEventListener('DOMContentLoaded', function() {
        frame.src = '/api/render?source=local&page=professional';
    });
})();
