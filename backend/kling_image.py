import requests
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

KLING_API_KEY = os.getenv("KLING_API_KEY")
import tempfile
if os.environ.get("VERCEL") == "1" or not os.access('.', os.W_OK):
    UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "uploads")
else:
    UPLOAD_DIR = "uploads"

def save_image_from_url(url: str):
    """Downloads an image from a URL and saves it to the uploads folder."""
    try:
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR, exist_ok=True)
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        filename = f"gen_{uuid.uuid4().hex}.png"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Return the local URL path for the frontend
        return f"/uploads/{filename}"
    except Exception as e:
        print(f"Error saving image: {e}")
        return url # Fallback to original URL if saving fails

def generate_kling_image(prompt: str):
    """
    Calls the Pixazo AI API to generate an image using the Kling-Image model.
    """
    if not KLING_API_KEY:
        return {"error": "KLING_API_KEY not found in .env file."}

    url = "https://gateway.pixazo.ai/kling-image/v1/kling-image-request"
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Ocp-Apim-Subscription-Key": KLING_API_KEY
    }
    data = {
        "prompt": prompt,
        "resolution": "1K",
        "result_type": "single",
        "num_images": 1,
        "aspect_ratio": "16:9",
        "output_format": "png"
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        raw_data = response.json()
        print(f"PIXAZO RAW RESPONSE: {raw_data}")
        
        # If the request returns a request_id, we need to poll
        request_id = raw_data.get("request_id")
        if not request_id:
            # Maybe it returned the image immediately or an error
            return raw_data
            
        # Poll for completion
        status_url = "https://gateway.pixazo.ai/kling-image/v1/kling-image-request-result"
        status_headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "Ocp-Apim-Subscription-Key": KLING_API_KEY
        }
        status_data = {"request_id": request_id}
        
        max_attempts = 45 # e.g. 45 * 4 = 180 seconds (3 minutes)
        for attempt in range(max_attempts):
            import time
            time.sleep(4)
            status_response = requests.post(status_url, json=status_data, headers=status_headers)
            status_response.raise_for_status()
            status_data_res = status_response.json()
            print(f"PIXAZO STATUS RESPONSE: {status_data_res}")
            
            status = status_data_res.get("status")
            images_data = status_data_res.get("data", {}).get("images", []) or status_data_res.get("images", [])
            
            if status == "COMPLETED" or (not status and images_data):
                # Extract image URLs for the frontend
                if images_data:
                    local_images = []
                    for img in images_data:
                        url = img.get("url")
                        if url:
                            local_url = save_image_from_url(url)
                            local_images.append({"url": local_url})
                    return {"images": local_images}
                return status_data_res
            elif status == "FAILED" or status == "ERROR":
                return {"error": f"Image generation failed on server: {status_data_res}"}
            
            # If "IN_QUEUE" or "PROCESSING", loop continues
            
        return {"error": "Image generation timed out."}
        
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {str(e)}"}
    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    # Test call
    test_prompt = "A photorealistic portrait of a weathered fisherman mending nets at sunrise"
    print(generate_kling_image(test_prompt))
