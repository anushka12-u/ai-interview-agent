from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import router

app = FastAPI(
	title="AI Interview Agent",
	description="An AI-powered interview agent that conducts interviews and provides feedback.",
	version="1.0.0",
)

# Allow local frontend dev server to call the API (adjust origins as needed)
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(router)
