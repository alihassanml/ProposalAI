from openai import OpenAI

# Replace with your API key
API_KEY = "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"
key_3 = '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'
key_4 = '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'

client = OpenAI(api_key=key_4)

try:
    response = client.models.list()

    print("✅ OpenAI API key is working")
    
    # Print available models
    for model in response.data[:5]:
        print("-", model.id)

except Exception as e:
    print("❌ API key is not working")
    print("Error:", e)