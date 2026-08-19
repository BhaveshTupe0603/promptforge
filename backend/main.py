from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from models import AnalyzeRequest, AnalyzeResponse, GenerateRequest, GenerateResponse, QualityChecks
from llm_service import analyze_rough_prompt, generate_final_prompt

app = FastAPI(
    title="PromptForge API",
    description="Backend service for human-in-the-loop prompt engineering",
    version="1.0.0"
)

# Enable CORS for local development (Vite typically runs on :5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_quality_score(components) -> tuple[int, QualityChecks]:
    """Deterministic rubric for scoring the prompt."""
    checks = QualityChecks(
        role=bool(components.role and components.role.strip()),
        task=bool(components.task and components.task.strip()),
        context=bool(components.context and components.context.strip()),
        constraints=bool(components.constraints and len(components.constraints) > 0),
        format=bool(components.format_or_output and components.format_or_output.strip())
    )
    
    # 20 points per passing check
    score = sum([
        20 if checks.role else 0,
        20 if checks.task else 0,
        20 if checks.context else 0,
        20 if checks.constraints else 0,
        20 if checks.format else 0
    ])
    
    return score, checks


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "PromptForge"}

@app.post(
    "/api/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Deconstruct a rough prompt into editable framework components"
)
async def analyze_prompt_endpoint(payload: AnalyzeRequest):
    if not payload.rough_prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prompt text cannot be empty or whitespace only."
        )

    try:
        extracted = await analyze_rough_prompt(payload)
        return AnalyzeResponse(
            technique=payload.technique,
            components=extracted
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze prompt: {str(e)}"
        )

@app.post(
    "/api/generate",
    response_model=GenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate the final polished prompt from approved components"
)
async def generate_prompt_endpoint(payload: GenerateRequest):
    try:
        final_prompt = await generate_final_prompt(payload)
        score, checks = calculate_quality_score(payload.components)
        
        return GenerateResponse(
            final_prompt=final_prompt,
            score=score,
            checks=checks
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate final prompt: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)