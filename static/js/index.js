async function loadvideoshow() {
  const loadButton = document.getElementById('loadButton');
  const waittime = document.getElementById('wait');
  const originalText = loadButton.innerText;

  loadButton.disabled = true;
  loadButton.innerText = 'Loading...';
  waittime.innerHTML = '<span class="text-primary">Please wait, fetching the video...</span>';

  await loadVideo();

  loadButton.disabled = false;
  loadButton.innerText = originalText;
  waittime.innerHTML = '';
}

async function loadVideo() {
  const url = document.getElementById('url').value;
  const videoContainer = document.getElementById('videoContainer');
  const videoPlayer = document.getElementById('videoPlayer');
  const downloadLink = document.getElementById('downloadLink');

  if (!url.includes('facebook.com')) {
    alert('Please enter a valid Facebook video URL.');
    return;
  }

  try {
    const response = await fetch('http://127.0.0.1:5000/facebook/get_video_url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error('Server did not return valid JSON. Please try again later.');
    }

    if (response.ok && data.video_url) {
      videoPlayer.src = data.video_url;
      downloadLink.href = data.video_url;
      videoContainer.style.display = 'block';
    } else {
      throw new Error(data.error || 'An unknown error occurred.');
    }

  } catch (error) {
    alert('Error: ' + error.message);
    videoContainer.style.display = 'none';
  }
}
