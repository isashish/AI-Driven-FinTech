import uvicorn

if __name__ == "__main__":
    # Combined service running on port 8000 (Expected by the main backend)
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)