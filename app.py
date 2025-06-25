from flask import Flask, request, send_file, jsonify, render_template
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from io import BytesIO
import re
import instaloader
import yt_dlp
import tempfile
import os

app = Flask(__name__)
CORS(app)

# ----------- Pinterest Section ------------

@app.route('/')
def home():
    return send_file('pinterest.html')

@app.route('/pinterest/download', methods=['POST'])
def pinterest_download():
    data = request.get_json()
    url = data.get('url')

    if not url or ("pinterest.com/pin/" not in url and "pin.it" not in url):
        return jsonify({'error': 'Invalid Pinterest URL.'}), 400

    try:
        if "pin.it" in url:
            res = requests.get(url, timeout=10)
            if res.status_code != 200:
                return jsonify({'error': 'URL not reachable.'}), 400
            soup = BeautifulSoup(res.content, 'html.parser')
            link = soup.find('link', rel='alternate')
            if not link:
                return jsonify({'error': 'Redirect URL not found.'}), 404
            url_match = re.search(r'url=(.*?)&', link['href'])
            if not url_match:
                return jsonify({'error': 'Invalid redirect URL.'}), 400
            url = url_match.group(1)

        res = requests.get(url, timeout=10)
        if res.status_code != 200:
            return jsonify({'error': 'Pinterest page not reachable.'}), 400

        soup = BeautifulSoup(res.content, 'html.parser')
        video_tag = soup.find('video')
        if not video_tag:
            return jsonify({'error': 'No video found on this page.'}), 404

        video_url = video_tag.get('src')
        if not video_url:
            source_tag = video_tag.find('source')
            if source_tag:
                video_url = source_tag.get('src')

        if not video_url:
            return jsonify({'error': 'Video source URL not found.'}), 404

        if 'm3u8' in video_url:
            video_url = video_url.replace('hls', '720p').replace('m3u8', 'mp4')

        video_resp = requests.get(video_url, stream=True, timeout=15)
        video_resp.raise_for_status()

        video_stream = BytesIO()
        for chunk in video_resp.iter_content(chunk_size=8192):
            if chunk:
                video_stream.write(chunk)
        video_stream.seek(0)

        return send_file(
            video_stream,
            as_attachment=True,
            download_name="pinterest_video.mp4",
            mimetype="video/mp4"
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------- Instagram Section ------------

# Helper function to extract shortcode from URL
def extract_shortcode(url):
    match = re.search(r"instagram\.com/(?:reel|p|tv)/([^/?]+)", url)
    return match.group(1) if match else None

@app.route('/instagram/get_video_url', methods=['POST'])
def get_instagram_video():
    data = request.get_json()
    url = data.get('url', '').strip()

    if 'instagram.com' not in url:
        return jsonify({'error': 'Invalid Instagram URL'}), 400

    shortcode = extract_shortcode(url)
    if not shortcode:
        return jsonify({'error': 'Could not extract shortcode'}), 400

    try:
        loader = instaloader.Instaloader()
        post = instaloader.Post.from_shortcode(loader.context, shortcode)

        if post.is_video:
            return jsonify({
                'type': 'video',
                'url': post.video_url
            })
        else:
            return jsonify({
                'type': 'image',
                'url': post.url
            })

    except Exception as e:
        return jsonify({'error': str(e)}), 500



# ----------- Facebook Section ------------

@app.route('/facebook')
def facebook_page():
    return render_template('facebook.html')

@app.route('/facebook/get_video_url', methods=['POST'])
def facebook_get_video_url():
    data = request.get_json()
    video_url = data.get('url')

    if not video_url or "facebook.com" not in video_url:
        return jsonify({'error': 'Invalid Facebook URL.'}), 400

    try:
        ydl_opts = {
            'format': 'best[ext=mp4]/best',
            'quiet': True,
            'skip_download': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            video_direct_url = info.get('url')
            if not video_direct_url:
                return jsonify({'error': 'Could not retrieve direct video URL.'}), 500

            return jsonify({'video_url': video_direct_url})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------- YouTube Section ------------

@app.route('/youtube/formats', methods=['POST'])
def get_youtube_formats():
    data = request.get_json()
    url = data.get('url')

    if not url or ("youtube.com" not in url and "youtu.be" not in url):
        return jsonify({'error': 'Invalid YouTube URL.'}), 400

    try:
        ydl_opts = {'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            result = []
            for f in formats:
                if f.get('url') and f.get('filesize'):
                    result.append({
                        'format_id': f['format_id'],
                        'ext': f['ext'],
                        'resolution': f.get('resolution') or f.get('format_note'),
                        'filesize': f.get('filesize'),
                        'format_note': f.get('format_note', '')
                    })
            return jsonify({'formats': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/youtube/download', methods=['POST'])
def download_youtube_video():
    data = request.get_json()
    url = data.get('url')
    format_id = data.get('format_id')

    if not url or not format_id:
        return jsonify({'error': 'URL or format ID missing.'}), 400

    try:
        temp_dir = tempfile.mkdtemp()
        ydl_opts = {
            'format': format_id,
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
            'quiet': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            file_path = ydl.prepare_filename(info)

        return send_file(file_path, as_attachment=True)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------------

if __name__ == '__main__':
    app.run(debug=True)




