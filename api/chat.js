export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { messages, password } = req.body || {}

    const correct = process.env.CHAT_PASSWORD || 'AIAgent2024'
    if (!password || password !== correct) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

    const systemPrompt = 'Bạn là chuyên gia về AI và AI Agent. Trả lời các câu hỏi về: machine learning, deep learning, LLM, neural networks, AI Agent, autonomous agents, multi-agent systems, LangChain, AutoGen, CrewAI, LlamaIndex, GPT, Claude, Gemini, Llama, RAG, vector databases, prompt engineering, fine-tuning, và ứng dụng AI thực tế. Trả lời bằng tiếng Việt trừ khi được hỏi bằng tiếng Anh. Ngắn gọn, rõ ràng, dễ hiểu.'

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
        }),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      return res.status(response.status).json({ error: err.error?.message || 'Google API error' })
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return res.status(200).json({ reply })
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message })
  }
}
