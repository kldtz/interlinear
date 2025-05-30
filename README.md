# Annotated Texts

A simple tool for creating texts with interlinear annotations in the browser.

My texts: https://zeitbach.com/interlinear/

```sh
# Install dependencies
pip install -r requirements.txt
# Run server
python -m uvicorn main:app --reload
```

Open `http://localhost:8000/documents/` in the browser. 
Press `Ctrl` and select some text to create a new annotation.
Click into an existing annotation and edit or delete the text.
