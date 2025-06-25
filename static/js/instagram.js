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
  const imageplaylink = document.getElementById('imageplay');
  const downloadLink = document.getElementById('downloadLink');

  // Clear previous content
  videoPlayer.src = '';
  imageplaylink.src = '';
  downloadLink.href = '#';
  videoPlayer.style.display = 'none';
  imageplaylink.style.display = 'none';
  downloadLink.style.display = 'none';

  if (!url.includes('instagram.com')) {
    alert('Please enter a valid Instagram URL.');
    return;
  }

  try {
    const response = await fetch('http://127.0.0.1:5000/instagram/get_video_url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (response.ok && data.url) {
      if (data.type === 'video') {
        videoPlayer.src = data.url;
        videoPlayer.style.display = 'block';
        downloadLink.href = data.url;
        downloadLink.style.display = 'inline-block';
      } else if (data.type === 'image') {
        imageplaylink.href = data.url;
        imageplaylink.style.display = 'block';
      }
      videoContainer.style.display = 'block';
    } else {
      throw new Error(data.error || 'An unknown error occurred.');
    }

  } catch (error) {
    alert('Error: ' + error.message);
    videoContainer.style.display = 'none';
  }
}
