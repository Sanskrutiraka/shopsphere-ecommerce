from chatbot.agent.core import run_agent

def get_bot_response(message: str, user=None, session=None) -> str:
    """
    Wrapper function to route views.py Chat API linearly to the decoupled Agent core.
    Preserves backwards compatibility with existing application logic strings.
    """
    return run_agent(message, user=user, session=session)
