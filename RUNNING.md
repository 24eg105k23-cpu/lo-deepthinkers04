# How to Run the Application

You will need **two separate terminal windows**.

### Terminal 1: Backend (Python/FastAPI)

1.  **Navigate to the project root:**
    ```powershell
    cd "d:\lo-deepthinkers"
    ```

2.  **Activate the virtual environment:**
    ```powershell
    .\.venv\Scripts\Activate
    ```

3.  **Start the backend server:**
    ```powershell
    cd backend
    python -m uvicorn main:app --reload --port 8000
    ```

### Terminal 2: Frontend (Vite/React)

1.  **Navigate to the frontend directory:**
    ```powershell
    cd "d:\lo-deepthinkers\lo-deepthinkers04"
    ```

2.  **Start the frontend development server:**
    ```powershell
    npm run dev
    ```

Once both are running:
- **Frontend**: http://localhost:8080/
- **Backend**: http://localhost:8000/
