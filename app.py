from pathlib import Path
import json
import hashlib
import streamlit as st

ROOT = Path(__file__).resolve().parent
st.set_page_config(page_title="Tiny Survey", page_icon="✳", layout="wide", initial_sidebar_state="collapsed")
try:
    config = json.loads((ROOT / "config/birthday.json").read_text(encoding="utf-8-sig"))
    audio_file = ROOT / "static/audio/birthday.mp3"
    try:
        audio_data = audio_file.read_bytes()
    except OSError:
        audio_data = b""
    config["bgm_available"] = bool(audio_data)
    config["bgm_version"] = hashlib.sha256(audio_data).hexdigest()[:16] if audio_data else ""
    css = (ROOT / "frontend/style.css").read_text(encoding="utf-8-sig")
    js = (ROOT / "frontend/app.js").read_text(encoding="utf-8-sig")
    payload = json.dumps(config, ensure_ascii=False).replace("<", "\\u003c")
    st.html('<style>[data-testid="stHeader"]{display:none}.stMainBlockContainer{padding:0!important;max-width:none!important}iframe{position:fixed;inset:0;width:100%;height:100dvh!important;border:0;z-index:1000}html,body{overflow:hidden}</style>')
    st.iframe(f'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>{css}</style></head><body><main id="tiny-surprise" aria-label="취향 설문"><p>설문을 준비하고 있어요. 화면이 나타나지 않으면 새로고침해 주세요.</p></main><script>(()=>{{const CONFIG={payload};{js}\n}})();</script></body></html>', height=850)
except (OSError, ValueError) as exc:
    st.error("설문을 불러오지 못했어요. 설정 파일을 확인하고 새로고침해 주세요.")
    st.caption(str(exc))
