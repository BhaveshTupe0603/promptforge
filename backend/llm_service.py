import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv
from models import AnalyzeRequest, GenerateRequest, ExtractedPromptComponents, GenerateResponse, QualityChecks

load_dotenv()

client = genai.Client()

SYSTEM_INSTRUCTION = """
You are an expert Prompt Engineering Decomposition Engine.
Your task is to analyze an ambiguous, rough prompt and extract structured components.

Framework Definitions:
- RTF: Focus heavily on Role, Task, and Format/Output.
- RTC: Focus heavily on Role, Task, and Context (background, situation, audience).
- GCO: Focus on Task (as the Goal), Constraints (limits, boundaries), and Format/Output.
- FEW_SHOT: Focus on Task, Format/Output, and suggest realistic few-shot input/output examples.

Guiding Principles:
1. If the requested framework is "AUTO", analyze the prompt's intent and select the absolute best framework (RTF, RTC, GCO, or FEW_SHOT) and populate 'recommended_framework'.
2. Do not invent non-existent factual constraints. If something is missing, extract what is available and list missing aspects in `missing_information`.
3. Clean up sloppy phrasing into crisp, actionable specifications.
4. Always return valid structured data conforming to the schema.
"""

async def analyze_rough_prompt(request: AnalyzeRequest) -> ExtractedPromptComponents:
    user_prompt = f"""
Framework Requested: {request.technique} (If AUTO, pick the best one for the prompt type).

Rough User Prompt:
"{request.rough_prompt}"

Extract the components according to the requested framework.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=ExtractedPromptComponents,
            temperature=0.2,
        ),
    )

    return response.parsed

async def generate_final_prompt(request: GenerateRequest) -> GenerateResponse:
    components_dict = request.components.model_dump(exclude_none=True, exclude_unset=True)
    
    # Remove 'recommended_framework' and 'missing_information' before feeding it back to Gemini
    components_dict.pop("missing_information", None)
    components_dict.pop("recommended_framework", None)

    generator_prompt = f"""
You are an expert Prompt Engineer. Your job is to take the following approved components 
and weave them into a single, highly effective, ready-to-use LLM prompt based on the {request.technique} framework.

Approved Components:
{json.dumps(components_dict, indent=2)}

Instructions:
1. Write the final assembled prompt clearly using markdown.
2. Calculate a quality score from 0 to 100 based on how robust, complete, and clear the components are.
3. Perform validation checks (true/false) for: role, task, context, constraints, and format based on whether they are effectively addressed in the final prompt.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=generator_prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=GenerateResponse,
            temperature=0.3,
        ),
    )

    return response.parsed