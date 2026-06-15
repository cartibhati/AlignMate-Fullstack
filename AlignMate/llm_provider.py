# AlignMate/llm_provider.py
import os

def get_llm(temperature: float = 0.7):
    """
    Returns a LangChain LLM or ChatModel runnable interface.
    If GEMINI_API_KEY is found in the environment, it uses ChatGoogleGenerativeAI.
    Otherwise, it falls back to OllamaLLM locally.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            print("[INFO] Initializing Google Gemini LLM (gemini-2.5-flash)...")
            return ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=temperature,
                google_api_key=gemini_key
            )
        except ImportError:
            print("[WARNING] langchain-google-genai is not installed. Falling back to Ollama...")

    from langchain_ollama import OllamaLLM
    print("[INFO] Initializing local Ollama LLM (llama3.2)...")
    return OllamaLLM(model="llama3.2", temperature=temperature)
