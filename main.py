from fastapi import FastAPI, UploadFile, File
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import cv2
import numpy as np
import mss
import time
import pathlib
import psutil
import pyautogui
from pydantic import BaseModel

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0

UPLOAD_DIR = os.path.join(pathlib.Path.home(), "Documents", "Phone Uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/ping")
def ping():
    return {"status": "online"}

@app.get("/stats")
def get_stats():
    return {
        "cpu": psutil.cpu_percent(interval=None),
        "ram": psutil.virtual_memory().percent
    }

class MouseMove(BaseModel):
    dx: float
    dy: float

@app.post("/mouse/move")
def mouse_move(data: MouseMove):
    try:
        # Scale movement for usability
        pyautogui.move(data.dx * 1.5, data.dy * 1.5)
    except Exception:
        pass
    return {"status": "ok"}

@app.post("/mouse/click")
def mouse_click(button: str = "left"):
    # button is "left" or "right"
    pyautogui.click(button=button)
    return {"status": "ok"}

class KeyboardInput(BaseModel):
    text: str

@app.post("/keyboard/write")
def keyboard_write(data: KeyboardInput):
    pyautogui.write(data.text)
    return {"status": "ok"}

@app.post("/keyboard/press")
def keyboard_press(key: str):
    pyautogui.press(key)
    return {"status": "ok"}

@app.get("/")
def read_root():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/app.js")
def read_js():
    with open("static/app.js", "r", encoding="utf-8") as f:
        from fastapi.responses import Response
        return Response(content=f.read(), media_type="application/javascript")

@app.post("/shutdown")
def shutdown():
    os.system("shutdown /s /t 60")
    return {"status": "success", "message": "Shutdown triggered."}

@app.post("/sleep")
def sleep_pc():
    os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
    return {"status": "success", "message": "Sleeping..."}

@app.post("/lock")
def lock_pc():
    os.system("rundll32.exe user32.dll,LockWorkStation")
    return {"status": "success", "message": "Locked."}

import asyncio

async def generate_frames():
    try:
        with mss.mss() as sct:
            monitor = sct.monitors[1]
            while True:
                img = sct.grab(monitor)
                frame = np.array(img)
                frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)
                ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                await asyncio.sleep(0.05)
    except Exception:
        pass

@app.get("/stream")
def video_stream():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"status": "success", "filename": file.filename}

@app.get("/list_files")
def list_files():
    files = os.listdir(UPLOAD_DIR)
    return {"files": files}

@app.get("/download/{filename:path}")
def download_file(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(path):
        return FileResponse(path, filename=os.path.basename(filename))
    return {"error": "File not found"}
