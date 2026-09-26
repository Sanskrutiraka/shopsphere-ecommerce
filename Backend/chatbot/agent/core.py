import os
import google.generativeai as genai
from .tools import ToolsetBuilder

def run_agent(message: str, user=None, session=None) -> str:
    """Enterprise AI Core Initialization and Session Mapping"""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return "System configuration missing: GEMINI_API_KEY not found in Server environment."

    genai.configure(api_key=api_key)
    builder = ToolsetBuilder(user)
    
    model = genai.GenerativeModel(
        model_name='gemini-2.5-flash',
        tools=builder.build_tools(),
        system_instruction=(
            f"You are ShopSphere AI, an enterprise-grade digital concierge for an e-commerce platform. "
            f"You MUST seamlessly utilize your tools to support the user. Use markdown deeply to make your replies "
            f"look visually stunning (tables, bullet points, bold highlights, emojis). Provide SKUs whenever mentioning a product. "
            f"Logged in customer user: {user.first_name if user else 'Guest'}."
        )
    )
    
    history = []
    if session:
        msgs = list(session.messages.all().order_by('timestamp'))[-20:]
        # Remove duplication from view injector
        if msgs and msgs[-1].sender == 'USER' and msgs[-1].message == message:
            msgs = msgs[:-1]
        for h in msgs:
            if not h.message: continue
            role = 'user' if h.sender == 'USER' else 'model'
            history.append({"role": role, "parts": [h.message]})

    try:
        chat = model.start_chat(enable_automatic_function_calling=True, history=history)
        response = chat.send_message(message)
        return response.text
    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"An error occurred while communicating with the AI Core: {str(e)}"
