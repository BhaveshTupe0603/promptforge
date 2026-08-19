import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv
from models import AnalyzeRequest, GenerateRequest, ExtractedPromptComponents

load_dotenv()

# Initializes automatically using GEMINI_API_KEY from environment
client = genai.Client()

SYSTEM_INSTRUCTION = """
You are an expert Prompt Engineering Decomposition Engine.
Your task is to analyze an ambiguous, rough prompt and extract structured components according to the requested prompting framework.

Framework Definitions:
- RTF: Focus heavily on Role, Task, and Format/Output.
- RTC: Focus heavily on Role, Task, and Context (background, situation, audience).
- GCO: Focus on Task (as the Goal), Constraints (limits, boundaries), and Format/Output.
- FEW_SHOT: Focus on Task, Format/Output, and suggest realistic few-shot input/output examples.

Guiding Principles:
1. Do not invent non-existent factual constraints. If something is missing, extract what is available and list missing aspects in `missing_information`.
2. Clean up sloppy phrasing into crisp, actionable specifications.
3. Always return valid structured data conforming to the schema.
"""

async def analyze_rough_prompt(request: AnalyzeRequest) -> ExtractedPromptComponents:
    user_prompt = f"""
Framework Requested: {request.technique}

Rough User Prompt:
"{request.rough_prompt}"

Extract the components according to the {request.technique} framework.
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

    structured_data = ExtractedPromptComponents.model_validate_json(response.text)
    return structured_data

async def generate_final_prompt(request: GenerateRequest) -> str:
    components_dict = request.components.model_dump(exclude_none=True, exclude_unset=True)
    
    if "missing_information" in components_dict:
        del components_dict["missing_information"]

    generator_prompt = f"""
You are an expert Prompt Engineer. Your job is to take the following approved components 
and weave them into a single, highly effective, ready-to-use LLM prompt.

Target Framework Strategy: {request.technique}

Approved Components:
{json.dumps(components_dict, indent=2)}

Instructions:
1. Write ONLY the final prompt. Do not include any introductory or concluding text (e.g., "Here is your prompt:").
2. Use clear formatting (markdown, bullet points, or clear paragraphs) so the final prompt is easy for an AI to read.
3. Preserve all constraints. Do not invent factual details that are not in the components.
4. Make it authoritative, unambiguous, and professional.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=generator_prompt,
        config=types.GenerateContentConfig(
            temperature=0.4,
        ),
    )

    return response.text.strip()