from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "python-backend"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Python Backend...")
    print("✅ Server running on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
