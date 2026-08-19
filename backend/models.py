from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# Allowed frameworks
FrameworkType = Literal["RTF", "RTC", "GCO", "FEW_SHOT"]

# --- 1. Frontend Analyze Request Model ---
class AnalyzeRequest(BaseModel):
    rough_prompt: str = Field(..., min_length=3, description="The raw user prompt")
    technique: FrameworkType = Field(..., description="Chosen prompt engineering framework")

# --- 2. Gemini Structured Output Schema ---
class ExtractedPromptComponents(BaseModel):
    role: Optional[str] = Field(
        default=None, 
        description="The persona or role the AI should adopt. (E.g., 'Senior Marketing Strategist')"
    )
    task: Optional[str] = Field(
        default=None, 
        description="The core objective or action to be completed."
    )
    context: Optional[str] = Field(
        default=None, 
        description="Background details, industry, target audience, or situation."
    )
    constraints: List[str] = Field(
        default_factory=list, 
        description="List of boundaries, budget limits, length limits, or things to avoid."
    )
    format_or_output: Optional[str] = Field(
        default=None, 
        description="Desired format, table structure, tone, or response structure."
    )
    examples: List[str] = Field(
        default_factory=list, 
        description="Few-shot input/output pairs or reference patterns if relevant."
    )
    missing_information: List[str] = Field(
        default_factory=list, 
        description="Crucial details missing from the rough prompt that the user might want to fill in."
    )

# --- 3. Frontend Analyze Response Model ---
class AnalyzeResponse(BaseModel):
    technique: FrameworkType
    components: ExtractedPromptComponents

# --- 4. Generation Request Model ---
class GenerateRequest(BaseModel):
    technique: FrameworkType
    components: ExtractedPromptComponents

# --- 5. Quality Checks Model ---
class QualityChecks(BaseModel):
    role: bool
    task: bool
    context: bool
    constraints: bool
    format: bool

# --- 6. Generation Response Model ---
class GenerateResponse(BaseModel):
    final_prompt: str
    score: int
    checks: QualityChecks