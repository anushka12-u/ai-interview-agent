from llm import generate_feedback
def create_feedback(candidate, session):
    history = session["history"]
    feedback_text = generate_feedback(candidate, history)
    return feedback_text