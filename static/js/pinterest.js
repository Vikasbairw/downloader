async function loadvideoshow() {
  const status = document.getElementById('status');
  const urlInput = document.getElementById('url');
  const videoContainer = document.getElementById('videoContainer');
  const videoPlayer = document.getElementById('videoPlayer');
  const downloadLink = document.getElementById('downloadLink');

  const url = urlInput.value.trim();
  if (!url) {
    status.textContent = 'Please enter a Pinterest URL.';
    return;
  }

  status.textContent = 'Fetching video...';
  videoContainer.style.display = 'none';

  try {
    const response = await fetch('http://127.0.0.1:5000/pinterest/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      let errorMsg = 'Unknown error occurred';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch { }
      status.textContent = 'Error: ' + errorMsg;
      return;
    }

    const blob = await response.blob();
    const videoURL = URL.createObjectURL(blob);

    videoPlayer.src = videoURL;
    downloadLink.href = videoURL;
    videoContainer.style.display = 'block';
    status.textContent = '✅ Video ready to download!';
  } catch (error) {
    status.textContent = 'Error: ' + error.message;
  }
}
