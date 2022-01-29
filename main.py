from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

app.mount("/documents", StaticFiles(directory="docs", html = True), name="static")

class SaveRequest(BaseModel):
    filename: str
    html: str

@app.post("/save")
def save(request: SaveRequest):
    with open(f"docs/{request.filename}", "w") as fout:
        fout.write(request.html)

@app.get('/favicon.ico', include_in_schema=False)
def favicon():
    return FileResponse("favicon.ico")