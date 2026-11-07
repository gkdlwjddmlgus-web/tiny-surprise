"""Server-side audio availability and cache version; no browser or network needed."""
from pathlib import Path
from unittest import TestCase, main
from unittest.mock import patch
import hashlib
import json
import runpy
import sys
import types

ROOT = Path(__file__).resolve().parents[1]

class AudioConfigTests(TestCase):
    def render(self, content=b"", error=None):
        frames, errors = [], []
        st = types.ModuleType("streamlit")
        st.set_page_config = lambda **kwargs: None
        st.html = lambda *args, **kwargs: None
        st.iframe = lambda html, **kwargs: frames.append(html)
        st.error = errors.append
        st.caption = lambda *args: None
        with patch.dict(sys.modules, {"streamlit": st}), patch.object(
            Path, "read_bytes", return_value=content, side_effect=error
        ):
            runpy.run_path(str(ROOT / "app.py"))
        self.assertEqual(errors, [])
        self.assertEqual(len(frames), 1)
        return json.loads(frames[0].split("const CONFIG=", 1)[1].split(";const root=", 1)[0])

    def test_present_audio_gets_content_hash_version(self):
        data = b"test audio data"
        config = self.render(data)
        self.assertTrue(config["bgm_available"])
        self.assertEqual(config["bgm_version"], hashlib.sha256(data).hexdigest()[:16])

    def test_missing_audio_does_not_block_app(self):
        config = self.render(error=FileNotFoundError())
        self.assertFalse(config["bgm_available"])
        self.assertEqual(config["bgm_version"], "")

    def test_unreadable_audio_does_not_block_app(self):
        config = self.render(error=PermissionError())
        self.assertFalse(config["bgm_available"])
        self.assertEqual(config["bgm_version"], "")

    def test_empty_audio_stays_silent(self):
        self.assertFalse(self.render(b"")["bgm_available"])

if __name__ == "__main__":
    main()
