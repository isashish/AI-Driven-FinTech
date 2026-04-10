import uvicorn

if __name__ == "__main__":
    # Combined service running on port 8000
    # Now pointing to main.py instead of app.py
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)