const fetchBtn = document.getElementById('fetchBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qualitySelect = document.getElementById('qualitySelect');
const statusDiv = document.getElementById('status');
const videoPreviewContainer = document.getElementById('videoPreviewContainer');
const videoPlayer = document.getElementById('videoPlayer');
const previewStatus = document.getElementById('previewStatus');
let fileName = null;
let formatsData = [];

function generateRandomName() {
    fileName = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

fetchBtn.addEventListener('click', async () => {
    const url = document.getElementById('url').value;
    if (!url) {
        alert('Please enter a YouTube URL.');
        return;
    }

    fetchBtn.disabled = true;
    statusDiv.innerText = 'Fetching video information...';
    videoPreviewContainer.style.display = 'none';
    videoPlayer.src = '';
    previewStatus.innerText = '';

    try {
        const response = await fetch('http://127.0.0.1:5000/youtube/formats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'An error occurred.');
        }

        const data = await response.json();
        formatsData = data.formats;

        qualitySelect.innerHTML = '';
        data.formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.format_id;
            option.text = `${format.resolution || format.format_note || 'Unknown'} - ${format.ext} - ${format.filesize ? (format.filesize / (1024 * 1024)).toFixed(2) + ' MB' : 'Size Unknown'}`;
            qualitySelect.appendChild(option);
        });

        qualitySelect.style.display = 'block';
        downloadBtn.style.display = 'block';
        statusDiv.innerText = 'Select a quality and download.';
    } catch (err) {
        statusDiv.innerText = `Error: ${err.message}`;
        alert(err.message);
    } finally {
        fetchBtn.disabled = false;
    }
});

qualitySelect.addEventListener('change', () => {
    const selectedFormatId = qualitySelect.value;
    const selectedFormat = formatsData.find(f => f.format_id == selectedFormatId);

    if (!selectedFormat) {
        videoPreviewContainer.style.display = 'none';
        videoPlayer.src = '';
        previewStatus.innerText = '';
        return;
    }

    if (selectedFormat.url) {
        videoPlayer.src = selectedFormat.url;
        videoPreviewContainer.style.display = 'block';
        previewStatus.innerText = `Previewing ${selectedFormat.resolution || selectedFormat.format_note || 'video'}`;
    } else {
        videoPreviewContainer.style.display = 'none';
        videoPlayer.src = '';
        previewStatus.innerText = 'No preview available for this quality.';
    }
});

downloadBtn.addEventListener('click', async () => {
    const url = document.getElementById('url').value;
    const formatId = qualitySelect.value;

    if (!url || !formatId) {
        alert('Please select a quality and provide the YouTube URL.');
        return;
    }

    downloadBtn.disabled = true;
    statusDiv.innerText = 'Downloading video...';

    try {
        const response = await fetch('http://127.0.0.1:5000/youtube/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url, format_id: formatId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Download failed.');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${fileName || 'video'}.mp4`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);

        statusDiv.innerText = 'Download complete!';
    } catch (error) {
        statusDiv.innerText = `Error: ${error.message}`;
        alert('Error: ' + error.message);
    } finally {
        downloadBtn.disabled = false;
    }
});
